#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
    const cwd = process.cwd();
    const projectName = path.basename(cwd);

    console.log(chalk.green.bold("\n🐍 Flask (Python) Backend Setup\n"));

    const answers = await inquirer.prompt([
        {
            type: "confirm",
            name: "useVenv",
            message: "Create a Python virtual environment?",
            default: true,
        },
        {
            type: "confirm",
            name: "useMongo",
            message: "Set up MongoDB integration?",
            default: false,
        },
        {
            type: "input",
            name: "mongoURI",
            message: "Enter MongoDB connection URI:",
            when: (answers) => answers.useMongo,
            default: "mongodb://localhost:27017/myapp",
            validate: (input) => {
                const isValid = /^mongodb(?:\+srv)?:\/\//.test(input);
                return isValid || "Please enter a valid MongoDB URI";
            },
        },
        {
            type: "input",
            name: "port",
            message: "Flask server port:",
            default: "5000",
            validate: (input) => {
                const port = parseInt(input);
                return (!isNaN(port) && port > 0 && port < 65536) || "Enter a valid port (1-65535)";
            },
        },
        {
            type: "confirm",
            name: "useCors",
            message: "Enable CORS (Cross-Origin Resource Sharing)?",
            default: true,
        },
        {
            type: "list",
            name: "dbChoice",
            message: "Choose database option:",
            choices: [
                { name: "SQLite (file-based, good for development)", value: "sqlite" },
                { name: "PostgreSQL", value: "postgresql" },
                { name: "MySQL", value: "mysql" },
                { name: "No database", value: "none" }
            ],
            default: "sqlite",
            when: (answers) => !answers.useMongo
        }
    ]);

    const { useVenv, useMongo, mongoURI, useCors, port, dbChoice } = answers;

    try {
        // Create project structure
        console.log(chalk.blue("\n📁 Creating project structure..."));
        const folders = [
            "app",
            "app/routes", 
            "app/controllers",
            "app/models",
            "app/utils",
            "tests"
        ];
        
        if (useMongo) {
            folders.push("app/db");
        }

        for (const folder of folders) {
            await fs.ensureDir(path.join(cwd, folder));
        }

        // Create .env file
        let envContent = `# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_RUN_PORT=${port}
SECRET_KEY=your-secret-key-change-this-in-production

# Server Configuration
PORT=${port}
`;

        if (useMongo) {
            envContent += `\n# MongoDB Configuration\nMONGO_URI=${mongoURI}\n`;
        } else if (dbChoice !== 'none') {
            envContent += `\n# Database Configuration\nDATABASE_URL=${getDatabaseUrl(dbChoice)}\n`;
        }

        await fs.writeFile(path.join(cwd, ".env"), envContent);

        // Create .gitignore
        await fs.writeFile(path.join(cwd, ".gitignore"), `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual Environment
venv/
ENV/
env/
.venv/
.ENV/
.env/

# Flask
instance/
.webassets-cache
.flaskenv

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite
*.sqlite3
`);

        // Create requirements.txt
        let requirementsContent = `Flask==3.0.0
python-dotenv==1.0.0
Werkzeug==3.0.1
`;

        if (useCors) {
            requirementsContent += `Flask-CORS==4.0.0\n`;
        }

        if (useMongo) {
            requirementsContent += `pymongo==4.6.0\nFlask-PyMongo==2.3.0\n`;
        } else if (dbChoice !== 'none') {
            requirementsContent += getDbRequirements(dbChoice);
        }

        await fs.writeFile(path.join(cwd, "requirements.txt"), requirementsContent);

        // Create Flask application files
        await createFlaskFiles(cwd, { useMongo, useCors, port, dbChoice, useVenv });

        console.log(chalk.green("✅ Project structure created successfully!"));

        // Create and activate virtual environment
        if (useVenv) {
            console.log(chalk.blue("\n🔧 Setting up Python virtual environment..."));
            await createVirtualEnvironment(cwd);
        }

        // Install Python dependencies
        console.log(chalk.blue("\n📦 Installing Python dependencies..."));
        await installPythonDependencies(cwd, useVenv);

        // Success message with instructions
        displaySuccessMessage(useVenv, port);

        // Final cleanup
        console.log(chalk.gray("\n🧹 Cleaning up..."));
        await finalCleanup(cwd);

    } catch (error) {
        console.error(chalk.red(`\n❌ Setup failed: ${error.message}`));
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
}

function getDatabaseUrl(dbChoice) {
    switch (dbChoice) {
        case 'sqlite':
            return 'sqlite:///app.db';
        case 'postgresql':
            return 'postgresql://username:password@localhost:5432/mydatabase';
        case 'mysql':
            return 'mysql://username:password@localhost:3306/mydatabase';
        default:
            return '';
    }
}

function getDbRequirements(dbChoice) {
    switch (dbChoice) {
        case 'sqlite':
            return `Flask-SQLAlchemy==3.1.1\nFlask-Migrate==4.0.5\n`;
        case 'postgresql':
            return `Flask-SQLAlchemy==3.1.1\nFlask-Migrate==4.0.5\npsycopg2-binary==2.9.9\n`;
        case 'mysql':
            return `Flask-SQLAlchemy==3.1.1\nFlask-Migrate==4.0.5\nPyMySQL==1.1.0\n`;
        default:
            return '';
    }
}

async function createVirtualEnvironment(cwd) {
    try {
        const pythonCmd = await getPythonCommand();
        await execa(pythonCmd, ['-m', 'venv', 'venv'], { 
            cwd, 
            stdio: 'inherit' 
        });
        console.log(chalk.green("✅ Virtual environment created"));
    } catch (error) {
        throw new Error(`Failed to create virtual environment: ${error.message}\nEnsure Python 3.7+ is installed and accessible.`);
    }
}

async function installPythonDependencies(cwd, useVenv) {
    try {
        const pipCmd = useVenv ? getPipCommandForVenv(cwd) : await getPipCommand();
        const execaOptions = { cwd, stdio: 'inherit' };

        if (useVenv) {
            // Set PATH to include venv
            const venvBinPath = process.platform === 'win32' 
                ? path.join(cwd, 'venv', 'Scripts')
                : path.join(cwd, 'venv', 'bin');
            execaOptions.env = { 
                ...process.env,
                PATH: `${venvBinPath}${path.delimiter}${process.env.PATH}`
            };
        }

        await execa(pipCmd, ['install', '-r', 'requirements.txt'], execaOptions);
        console.log(chalk.green("✅ Python dependencies installed"));
    } catch (error) {
        throw new Error(`Failed to install dependencies: ${error.message}`);
    }
}

function getPipCommandForVenv(cwd) {
    return process.platform === 'win32' 
        ? path.join(cwd, 'venv', 'Scripts', 'pip.exe')
        : path.join(cwd, 'venv', 'bin', 'pip');
}

async function getPythonCommand() {
    const commands = ['python3', 'python'];
    for (const cmd of commands) {
        try {
            await execa(cmd, ['--version']);
            return cmd;
        } catch {}
    }
    throw new Error('Python not found');
}

async function getPipCommand() {
    const commands = ['pip3', 'pip'];
    for (const cmd of commands) {
        try {
            await execa(cmd, ['--version']);
            return cmd;
        } catch {}
    }
    throw new Error('pip not found');
}

async function createFlaskFiles(cwd, options) {
    const { useMongo, useCors, port, dbChoice, useVenv } = options;

    // Create app/__init__.py
    await fs.writeFile(path.join(cwd, "app", "__init__.py"), "# Flask app package");

    // Create MongoDB connection file
    if (useMongo) {
        await fs.writeFile(path.join(cwd, "app", "db", "__init__.py"), "");
        await fs.writeFile(path.join(cwd, "app", "db", "connection.py"), `"""MongoDB connection module"""
from pymongo import MongoClient
from flask_pymongo import PyMongo
import os
from urllib.parse import quote_plus

mongo = PyMongo()

def init_db(app):
    """Initialize MongoDB connection"""
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError('MONGO_URI environment variable is required')
    
    app.config['MONGO_URI'] = mongo_uri
    mongo.init_app(app)
    
    # Test connection
    try:
        mongo.cx.admin.command('ping')
        print('✅ MongoDB connected successfully')
    except Exception as e:
        print(f'❌ MongoDB connection failed: {e}')
        raise

def get_db():
    """Get database instance"""
    return mongo.db
`);
    }

    // Create SQLAlchemy models if using SQL database
    if (!useMongo && dbChoice !== 'none') {
        await fs.writeFile(path.join(cwd, "app", "models", "__init__.py"), "");
        await fs.writeFile(path.join(cwd, "app", "models", "database.py"), `"""Database configuration"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def init_db(app):
    """Initialize database"""
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config.get('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        db.create_all()
    
    print('✅ Database initialized successfully')
`);

        await fs.writeFile(path.join(cwd, "app", "models", "user.py"), `"""User model"""
from app.models.database import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.username}>'
`);
    }

    // Create controllers
    await fs.writeFile(path.join(cwd, "app", "controllers", "__init__.py"), "");
    
    const controllerContent = useMongo ? `"""User controller with MongoDB"""
from flask import jsonify, request
from app.db.connection import get_db
from bson import ObjectId

def get_users():
    """Get all users"""
    try:
        db = get_db()
        users = list(db.users.find({}, {'_id': 0}))  # Exclude _id field
        return jsonify({'users': users, 'count': len(users)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        if not data or 'username' not in data:
            return jsonify({'error': 'Username is required'}), 400
        
        db = get_db()
        result = db.users.insert_one(data)
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
` : (dbChoice !== 'none' ? `"""User controller with SQLAlchemy"""
from flask import jsonify, request
from app.models.database import db
from app.models.user import User

def get_users():
    """Get all users"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users],
            'count': len(users)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'email' not in data:
            return jsonify({'error': 'Username and email are required'}), 400
        
        user = User(username=data['username'], email=data['email'])
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
` : `"""User controller - basic example"""
from flask import jsonify, request

# Sample data for demonstration
users_data = [
    {'id': 1, 'username': 'alice', 'email': 'alice@example.com'},
    {'id': 2, 'username': 'bob', 'email': 'bob@example.com'}
]

def get_users():
    """Get all users"""
    return jsonify({'users': users_data, 'count': len(users_data)}), 200

def create_user():
    """Create a new user"""
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({'error': 'Username is required'}), 400
    
    new_user = {
        'id': len(users_data) + 1,
        'username': data['username'],
        'email': data.get('email', '')
    }
    users_data.append(new_user)
    
    return jsonify({
        'message': 'User created successfully',
        'user': new_user
    }), 201
`);

    await fs.writeFile(path.join(cwd, "app", "controllers", "user_controller.py"), controllerContent);

    // Create routes
    await fs.writeFile(path.join(cwd, "app", "routes", "__init__.py"), "");
    await fs.writeFile(path.join(cwd, "app", "routes", "users.py"), `"""User routes"""
from flask import Blueprint
from app.controllers.user_controller import get_users, create_user

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def list_users():
    """GET /api/users - List all users"""
    return get_users()

@users_bp.route('/', methods=['POST'])
def add_user():
    """POST /api/users - Create a new user"""
    return create_user()

@users_bp.route('/health', methods=['GET'])
def health_check():
    """GET /api/users/health - Health check endpoint"""
    return {'status': 'healthy', 'service': 'users'}, 200
`);

    // Create utils
    await fs.writeFile(path.join(cwd, "app", "utils", "__init__.py"), "");
    await fs.writeFile(path.join(cwd, "app", "utils", "helpers.py"), `"""Utility functions"""
from functools import wraps
from flask import jsonify, request
import os
import logging

def setup_logging():
    """Configure application logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def handle_errors(f):
    """Decorator for handling route errors"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500
    return decorated_function

def validate_json(*required_fields):
    """Decorator for validating JSON request data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body must contain valid JSON'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
`);

    // Create main app.py with Windows socket fix
    const appContent = `"""Flask application factory"""
import os
import sys
from flask import Flask, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

${useCors ? "from flask_cors import CORS" : ""}
${useMongo ? "from app.db.connection import init_db" : (dbChoice !== 'none' ? "from app.models.database import init_db" : "")}
from app.routes.users import users_bp
from app.utils.helpers import setup_logging

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-this')
    ${dbChoice !== 'none' ? "app.config['DATABASE_URL'] = os.getenv('DATABASE_URL')" : ""}
    
    # Setup logging
    logger = setup_logging()
    logger.info('Starting Flask application...')
    
    ${useCors ? "# Enable CORS\n    CORS(app)" : ""}
    
    ${useMongo || dbChoice !== 'none' ? "# Initialize database\n    try:\n        init_db(app)\n    except Exception as e:\n        logger.error(f'Database initialization failed: {e}')\n        raise" : ""}
    
    # Register blueprints
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    @app.route('/')
    def home():
        """Health check endpoint"""
        return jsonify({
            'message': 'Flask API is running!',
            'status': 'healthy',
            'version': '1.0.0'
        })
    
    @app.route('/health')
    def health():
        """Detailed health check"""
        return jsonify({
            'status': 'healthy',
            'service': 'flask-api',
            'port': os.getenv('FLASK_RUN_PORT', '5000')
        })
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    # Development server
    port = int(os.getenv('FLASK_RUN_PORT', ${port}))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting Flask server on port {port}")
    print(f"📍 API Base URL: http://localhost:{port}")
    print(f"🔍 Health Check: http://localhost:{port}/health")
    print(f"👥 Users API: http://localhost:{port}/api/users")
    
    # Windows socket fix
    try:
        app.run(
            host='127.0.0.1', 
            port=port, 
            debug=debug,
            threaded=True,
            use_reloader=False if sys.platform.startswith('win') else debug
        )
    except OSError as e:
        if 'WinError 10038' in str(e):
            print("\\n⚠️  Windows socket error detected. Starting with alternate config...")
            app.run(host='127.0.0.1', port=port, debug=False, threaded=False)
        else:
            raise
`;

    await fs.writeFile(path.join(cwd, "app.py"), appContent);

    // Create basic test file
    await fs.writeFile(path.join(cwd, "tests", "__init__.py"), "");
    await fs.writeFile(path.join(cwd, "tests", "test_app.py"), `"""Basic tests for Flask app"""
import pytest
import sys
import os

# Add app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app

@pytest.fixture
def client():
    """Test client fixture"""
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_endpoint(client):
    """Test home endpoint"""
    response = client.get('/')
    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == 'Flask API is running!'

def test_health_endpoint(client):
    """Test health endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'

def test_users_endpoint(client):
    """Test users endpoint"""
    response = client.get('/api/users/')
    assert response.status_code == 200
    data = response.get_json()
    assert 'users' in data
    assert 'count' in data
`);

    // Create README.md
    await fs.writeFile(path.join(cwd, "README.md"), `# Flask Backend API

A Flask-based REST API backend with ${useMongo ? 'MongoDB' : (dbChoice !== 'none' ? dbChoice.toUpperCase() : 'no database')} integration.

## Quick Start

### 1. Activate Virtual Environment
${useVenv ? `
\`\`\`bash
# Windows
venv\\Scripts\\activate

# macOS/Linux
source venv/bin/activate
\`\`\`
` : ''}

### 2. Run the Application
\`\`\`bash
python app.py
\`\`\`

The API will be available at: http://localhost:${port}

## API Endpoints

- \`GET /\` - Health check
- \`GET /health\` - Detailed health status  
- \`GET /api/users/\` - List all users
- \`POST /api/users/\` - Create a new user

Happy coding! 🐍🚀
`);
}

async function finalCleanup(cwd) {
    try {
        const itemsToRemove = ['.scripts', 'node_modules', 'package-lock.json'];
        
        for (const item of itemsToRemove) {
            const itemPath = path.join(cwd, item);
            if (await fs.pathExists(itemPath)) {
                await fs.remove(itemPath);
            }
        }

        // Create minimal package.json
        const minimalPackage = {
            "name": path.basename(cwd),
            "version": "1.0.0",
            "description": "Flask Python Backend API",
            "main": "app.py",
            "scripts": {
                "start": "python app.py",
                "dev": "python app.py",
                "test": "pytest tests/"
            },
            "keywords": ["flask", "python", "api", "backend"],
            "license": "MIT"
        };
        
        await fs.writeJson(path.join(cwd, 'package.json'), minimalPackage, { spaces: 2 });
        
    } catch (error) {
        console.warn(chalk.yellow(`Cleanup warning: ${error.message}`));
    }
}

function displaySuccessMessage(useVenv, port) {
    console.log(chalk.green.bold("\n🎉 Flask backend setup completed!\n"));
    
    console.log(chalk.blue.bold("To get started:"));
    
    if (useVenv) {
        console.log(chalk.yellow("\n1. Activate virtual environment:"));
        console.log(chalk.white(process.platform === 'win32' 
            ? "   venv\\Scripts\\activate" 
            : "   source venv/bin/activate"));
    }
    
    console.log(chalk.yellow(`\n${useVenv ? '2' : '1'}. Start server:`));
    console.log(chalk.white("   python app.py"));
    
    console.log(chalk.yellow(`\n${useVenv ? '3' : '2'}. API endpoints:`));
    console.log(chalk.cyan(`   http://localhost:${port}`));
    console.log(chalk.cyan(`   http://localhost:${port}/api/users`));
    
    console.log(chalk.green("\nHappy coding! 🐍✨\n"));
}

// Run the setup
setup().catch((error) => {
    console.error(chalk.red('\n💥 Setup failed:'), error.message);
    process.exit(1);
});