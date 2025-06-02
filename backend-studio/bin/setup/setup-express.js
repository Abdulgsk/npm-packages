#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from "execa";

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main setup function to guide the user through Express.js backend creation.
 */
async function setup() {
  const cwd = process.cwd(); // Current working directory
  const projectName = path.basename(cwd); // Project name from current directory

  console.log(chalk.green.bold("\n🚀 Express.js (Node.js) Backend Setup\n"));

  // Prompt user for configuration options
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "useTypeScript",
      message: "Use TypeScript?",
      default: true,
    },
    {
      type: "input",
      name: "port",
      message: "Express server port:",
      default: "3000",
      validate: (input) => {
        const port = parseInt(input);
        return (
          (!isNaN(port) && port > 0 && port < 65536) ||
          "Enter a valid port (1-65535)"
        );
      },
    },
    {
      type: "confirm",
      name: "useCors",
      message: "Enable CORS (Cross-Origin Resource Sharing)?",
      default: true,
    },
    {
      type: "confirm",
      name: "useNodemon",
      message: "Use Nodemon for development (auto-restarts server)?",
      default: true,
    },
    {
      type: "list",
      name: "dbChoice",
      message: "Choose database option:",
      choices: [
        { name: "No database", value: "none" },
        { name: "MongoDB (with Mongoose)", value: "mongodb" },
        { name: "PostgreSQL (with Sequelize)", value: "postgresql" },
        { name: "MySQL (with Sequelize)", value: "mysql" },
        { name: "SQLite (with Sequelize, file-based)", value: "sqlite" },
      ],
      default: "none",
    },
    {
      type: "input",
      name: "mongoURI",
      message: "Enter MongoDB connection URI:",
      when: (answers) => answers.dbChoice === "mongodb",
      default: "mongodb://localhost:27017/myapp",
      validate: (input) => {
        const isValid = /^mongodb(?:\+srv)?:\/\//.test(input);
        return isValid || "Please enter a valid MongoDB URI";
      },
    },
    {
      type: "input",
      name: "dbUser",
      message: "Database username (for SQL):",
      when: (answers) => ["postgresql", "mysql"].includes(answers.dbChoice),
      default: "user",
    },
    {
      type: "password",
      name: "dbPassword",
      message: "Database password (for SQL):",
      when: (answers) => ["postgresql", "mysql"].includes(answers.dbChoice),
      mask: "*",
      default: "password",
    },
    {
      type: "input",
      name: "dbHost",
      message: "Database host (for SQL):",
      when: (answers) => ["postgresql", "mysql"].includes(answers.dbChoice),
      default: "localhost",
    },
    {
      type: "input",
      name: "dbPort",
      message: "Database port (for SQL):",
      when: (answers) => answers.dbChoice === "postgresql",
      default: "5432",
    },
    {
      type: "input",
      name: "dbPort",
      message: "Database port (for SQL):",
      when: (answers) => answers.dbChoice === "mysql",
      default: "3306",
    },
    {
      type: "input",
      name: "dbName",
      message: "Database name (for SQL):",
      when: (answers) =>
        ["postgresql", "mysql", "sqlite"].includes(answers.dbChoice),
      default: "mydb",
    },
  ]);

  const {
    useTypeScript,
    port,
    useCors,
    useNodemon,
    dbChoice,
    mongoURI,
    dbUser,
    dbPassword,
    dbHost,
    dbPort,
    dbName,
  } = answers;

  try {
    // Create project structure
    console.log(chalk.blue("\n📁 Creating project structure..."));
    await createProjectStructure(cwd, useTypeScript);
    console.log(chalk.green("✅ Project structure created successfully!"));

    // Generate .env file
    console.log(chalk.blue("📝 Generating .env file..."));
    await createEnvFile(cwd, {
      port,
      dbChoice,
      mongoURI,
      dbUser,
      dbPassword,
      dbHost,
      dbPort,
      dbName,
    });
    console.log(chalk.green("✅ .env file created!"));

    // Generate .gitignore file
    console.log(chalk.blue("👻 Generating .gitignore file..."));
    await createGitignore(cwd);
    console.log(chalk.green("✅ .gitignore file created!"));

    // Generate package.json
    console.log(chalk.blue("📦 Generating package.json..."));
    await createPackageJson(cwd, {
      projectName,
      useTypeScript,
      useCors,
      useNodemon,
      dbChoice,
    });
    console.log(chalk.green("✅ package.json created!"));

    // Create Express application files
    console.log(chalk.blue("📄 Creating Express application files..."));
    await createExpressFiles(cwd, { useTypeScript, useCors, dbChoice, dbName });
    console.log(chalk.green("✅ Express files created!"));

    // Install Node.js dependencies
    console.log(
      chalk.blue(
        "\n⬇️ Installing Node.js dependencies (this might take a moment)..."
      )
    );
    await installDependencies(cwd);
    console.log(chalk.green("✅ Node.js dependencies installed!"));

    // Create test files
    console.log(chalk.blue("🧪 Creating test files..."));
    await createTestFiles(cwd, { useTypeScript, dbChoice });
    console.log(chalk.green("✅ Test files created!"));

    // Create README.md
    console.log(chalk.blue("📖 Generating README.md..."));
    await createReadme(cwd, { port, useTypeScript, useNodemon, dbChoice });
    console.log(chalk.green("✅ README.md created!"));

    // Final cleanup
    console.log(chalk.gray("\n🧹 Cleaning up..."));
    await finalCleanup(cwd);

    // Display success message with instructions
    displaySuccessMessage(port, useTypeScript, useNodemon);
  } catch (error) {
    console.error(chalk.red(`\n❌ Setup failed: ${error.message}`));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

/**
 * Creates the basic project directory structure.
 * @param {string} cwd - Current working directory.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 */
async function createProjectStructure(cwd, useTypeScript) {
  const srcDir = path.join(cwd, "src");
  const folders = [
    srcDir,
    path.join(srcDir, "routes"),
    path.join(srcDir, "controllers"),
    path.join(srcDir, "models"),
    path.join(srcDir, "middleware"),
    path.join(srcDir, "utils"),
    path.join(cwd, "tests"),
    path.join(cwd, "logs"), // Add logs directory
  ];

  for (const folder of folders) {
    await fs.ensureDir(folder);
  }

  // Create empty index files for modules
  const emptyFiles = [
    path.join(srcDir, "routes", `index.${useTypeScript ? "ts" : "js"}`),
    path.join(srcDir, "controllers", `index.${useTypeScript ? "ts" : "js"}`),
    path.join(srcDir, "models", `index.${useTypeScript ? "ts" : "js"}`),
    path.join(srcDir, "middleware", `index.${useTypeScript ? "ts" : "js"}`),
    path.join(srcDir, "utils", `index.${useTypeScript ? "ts" : "js"}`),
  ];
  for (const file of emptyFiles) {
    await fs.writeFile(file, "");
  }
    // Add .nvmrc file for Node version consistency
  await fs.writeFile(path.join(cwd, ".nvmrc"), "18.0.0\n");
  await fs.writeFile(path.join(cwd, ".node-version"), "18.0.0\n"); // For rbenv/nodenv users

  const editorconfigContent = `root = true

  [*]
  charset = utf-8
  end_of_line = lf
  insert_final_newline = true
  trim_trailing_whitespace = true
  indent_style = space
  indent_size = 2

  [*.md]
  trim_trailing_whitespace = false
  `;
  await fs.writeFile(path.join(cwd, ".editorconfig"), editorconfigContent);
}

/**
 * Generates the .env file with configuration variables.
 * @param {string} cwd - Current working directory.
 * @param {object} options - Configuration options.
 */
async function createEnvFile(cwd, options) {
  const {
    port,
    dbChoice,
    mongoURI,
    dbUser,
    dbPassword,
    dbHost,
    dbPort,
    dbName,
  } = options;
  let envContent = `# Express.js Configuration
PORT=${port}
NODE_ENV=development

# Secret for JWT or session management (change in production)
SECRET_KEY=your-super-secret-key-change-this

`;

  if (dbChoice === "mongodb") {
    envContent += `# MongoDB Configuration
MONGO_URI=${mongoURI}
`;
  } else if (dbChoice !== "none") {
    envContent += `# Database Configuration (${dbChoice.toUpperCase()})
DB_DIALECT=${dbChoice}
DB_HOST=${dbHost}
DB_PORT=${dbPort || (dbChoice === "postgresql" ? "5432" : "3306")}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
`;
    if (dbChoice === "sqlite") {
      // Ensure data directory exists for SQLite
      await fs.ensureDir(path.join(cwd, "data"));
      envContent += `DB_STORAGE=./data/${dbName}.sqlite\n`;
    }
  }

  await fs.writeFile(path.join(cwd, ".env"), envContent);
}

/**
 * Generates the .gitignore file.
 * @param {string} cwd - Current working directory.
 */
async function createGitignore(cwd) {
  const gitignoreContent = `
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Dependency directories
node_modules/
dist/ # TypeScript build output
build/ # General build output

# Optional npm cache directory
.npm
.yarn-cache

# Optional REPL history
.node_repl_history

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# TypeScript build files
*.tsbuildinfo

# IDEs and editors
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
*.DS_Store
Thumbs.db

# Misc
*.pid
*.seed
*.pid.lock
`;
  await fs.writeFile(path.join(cwd, ".gitignore"), gitignoreContent);
}

/**
 * Generates the package.json file.
 * @param {string} cwd - Current working directory.
 * @param {object} options - Configuration options.
 */
async function createPackageJson(cwd, options) {
  const { projectName, useTypeScript, useCors, useNodemon, dbChoice } = options;

  // FIXED: Declare dependencies and devDependencies with let/const
  let dependencies = {
    express: "^4.21.0",           // was ^4.19.2
    dotenv: "^16.4.5",           // keep same
    winston: "^3.15.0", 
    "lru-cache": "^10.1.0"         // was ^3.13.0
  };

  let devDependencies = {
    jest: "^29.7.0",             // keep same
    supertest: "^7.0.0",         // keep same
  };

  if (useCors) {
    dependencies["cors"] = "^2.8.5";
  }

  if (dbChoice === "mongodb") {
    dependencies["mongoose"] = "^8.8.0";          // was ^8.4.1
  } else if (dbChoice !== "none") {
    dependencies["sequelize"] = "^6.37.5";        // was ^6.37.3
    if (dbChoice === "postgresql") {
      dependencies["pg"] = "^8.11.5";
      dependencies["pg-hstore"] = "^2.3.4";
    } else if (dbChoice === "mysql") {
      dependencies["mysql2"] = "^3.9.8";
    } else if (dbChoice === "sqlite") {
      dependencies["sqlite3"] = "^5.1.7";
    }
  }

  if (useNodemon) {
    devDependencies["nodemon"] = "^3.1.7";          // was ^3.1.0
  }
  devDependencies["glob"] = "^10.3.10";

  if (useTypeScript) {
    devDependencies["tsx"] = "^4.19.0";              // was ^4.7.0
    devDependencies["typescript"] = "^5.6.0";       // was ^5.4.5
    devDependencies["@types/node"] = "^22.0.0";    // was ^20.12.12
    devDependencies["@types/express"] = "^5.0.0";  // was ^4.17.21
    devDependencies["@types/jest"] = "^29.5.14";   // was ^29.5.12
    devDependencies["ts-node"] = "^10.9.2";        // keep same
    if (useCors) {
      devDependencies["@types/cors"] = "^2.8.17";
    }
    if (dbChoice !== "none" && dbChoice !== "mongodb") {
      devDependencies["@types/sequelize"] = "^4.28.20";
    }
    devDependencies["@types/supertest"] = "^6.0.2";
    // Add ts-jest as a dev dependency if using TypeScript for testing
    devDependencies["ts-jest"] = "^29.2.0"; // was ^29.1.4
  }

  const scripts = {
    // 'start' script: Builds (if TS) then runs the compiled JS
    start: useTypeScript
      ? "npm run build && node dist/src/server.js"
      : "node src/server.js",
    // 'test' script
    test: useTypeScript
      ? "jest --forceExit --detectOpenHandles"
      : "jest --forceExit --detectOpenHandles",
  };

  // 'dev' script: Uses nodemon for auto-restarts
  if (useNodemon) {
    // For TypeScript, use ts-node with Node's ES Module loader
    scripts["dev"] = useTypeScript
      ? 'nodemon --exec "tsx" src/server.ts'
      : "nodemon src/server.js";
  } else {
    // If no nodemon, 'dev' just runs 'start'
    scripts["dev"] = scripts["start"];
  }

  // 'build' script for TypeScript projects
  if (useTypeScript) {
    scripts["build"] = "tsc";
  }

  const packageJsonContent = {
    name: projectName,
    version: "1.0.0",
    description: "Express.js Backend API",
    // 'main' entry point for the package
    main: useTypeScript ? "dist/src/server.js" : "src/server.js",
    scripts: scripts,
    keywords: [
      "express",
      "node",
      "api",
      "backend",
      useTypeScript ? "typescript" : "javascript",
    ],
    author: "Abdul Gouse Syeedy A",
    license: "MIT",
    engines: {                    // ADD THIS BLOCK
      node: ">=18.0.0",
      npm: ">=8.0.0"
    },
    overrides: {
     "glob": "^10.3.10",
     "inflight": "lru-cache@^10.1.0"
    },
    dependencies: dependencies,
    devDependencies: devDependencies,
  };

  // Set 'type: "module"' for both JS and TS projects for consistent ES Module syntax handling
  // For TS, this works with `ts-node/esm` in dev and `commonjs` output for build. 
  packageJsonContent.type = "module";

  await fs.writeJson(path.join(cwd, "package.json"), packageJsonContent, {
    spaces: 2,
  });

  // If using TypeScript, create tsconfig.json
  if (useTypeScript) {
    const tsconfigContent = {
      compilerOptions: {
        target: "ES2022",    
        module: "ESNext",
        rootDir: "./src",
        outDir: "./dist",
        esModuleInterop: true, // Allows default imports from CommonJS modules
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        moduleResolution: "Node", // Standard Node.js module resolution
        resolveJsonModule: true,
        sourceMap: true, // Generate source maps for debugging
        // "allowImportingTsExtensions": true // REMOVED: Not needed if imports are extension-less in source, and conflicts with emitting JS.
      },
      include: ["src/**/*.ts"], // Include all TypeScript files in src
      exclude: ["node_modules", "dist"], // Exclude node_modules and output directory
    };
    await fs.writeJson(path.join(cwd, "tsconfig.json"), tsconfigContent, {
      spaces: 2,
    });
  }
}

/**
 * Creates the core Express.js application files.
 * @param {string} cwd - Current working directory.
 * @param {object} options - Configuration options.
 */
async function createExpressFiles(cwd, options) {
  const { useTypeScript, useCors, dbChoice, dbName } = options;
  const ext = useTypeScript ? "ts" : "js";
  const srcDir = path.join(cwd, "src");

  // src/server.js or src/server.ts (main entry point)
  const serverContent = `import app from './app${useTypeScript ? "" : ".js"}';
import dotenv from 'dotenv';
${dbChoice === "mongodb" ? `import mongoose from 'mongoose';` : ""}

dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`📍 API Base URL: http://localhost:\${PORT}\`);
    console.log(\`🔍 Health Check: http://localhost:\${PORT}/health\`);
    console.log(\`👥 Users API: http://localhost:\${PORT}/api/users\`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down...');
    ${
      dbChoice === "mongodb"
        ? `await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');`
        : ""
    }
    server.close(() => {
        console.log('✅ Server stopped.');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
`;
  await fs.writeFile(path.join(srcDir, `server.${ext}`), serverContent);

  // src/app.js or src/app.ts (Express app configuration)
  const appContent = `import express from 'express';
${useCors ? "import cors from 'cors';" : ""}
import { setupLogging } from './utils/helpers${useTypeScript ? "" : ".js"}';
import { notFound, errorHandler } from './middleware/errorHandler${
    useTypeScript ? "" : ".js"
  }';
import userRoutes from './routes/userRoutes${useTypeScript ? "" : ".js"}';
${
  dbChoice !== "none"
    ? `import { connectDB } from './models/index${useTypeScript ? "" : ".js"}';`
    : ""
}
import dotenv from 'dotenv';

const app = express();
dotenv.config();

// Setup logging
setupLogging();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
${useCors ? "app.use(cors()); // Enable CORS" : ""}

// Connect to database
${dbChoice !== "none" ? `connectDB();` : ""}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Express API is running!',
        status: 'healthy',
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'express-api',
        port: process.env.PORT || 3000
    });
});

app.use('/api/users', userRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
`;
  await fs.writeFile(path.join(srcDir, `app.${ext}`), appContent);

  // src/models/index.js or src/models/index.ts (Database connection and models export)
  await fs.writeFile(
    path.join(srcDir, "models", `index.${ext}`),
    getDbConnectionCode(dbChoice, useTypeScript, dbName)
  );

  // src/models/User.js or src/models/User.ts
  await fs.writeFile(
    path.join(srcDir, "models", `User.${ext}`),
    getModelCode(dbChoice, useTypeScript)
  );

  // src/controllers/userController.js or src/controllers/userController.ts
  await fs.writeFile(
    path.join(srcDir, "controllers", `userController.${ext}`),
    getControllerCode(dbChoice, useTypeScript)
  );

  // src/routes/userRoutes.js or src/routes/userRoutes.ts
  await fs.writeFile(
    path.join(srcDir, "routes", `userRoutes.${ext}`),
    getRoutesCode(useTypeScript)
  );

  // src/middleware/errorHandler.js or src/middleware/errorHandler.ts
  await fs.writeFile(
    path.join(srcDir, "middleware", `errorHandler.${ext}`),
    getMiddlewareCode(useTypeScript)
  );

  // src/utils/helpers.js or src/utils/helpers.ts
  await fs.writeFile(
    path.join(srcDir, "utils", `helpers.${ext}`),
    getUtilsCode(useTypeScript)
  );
}

/**
 * Generates the database connection code based on the chosen DB.
 * @param {string} dbChoice - The chosen database.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @param {string} dbName - The database name for SQLite.
 * @returns {string} The database connection code.
 */
function getDbConnectionCode(dbChoice, useTypeScript, dbName) {
  const tsFnSignature = useTypeScript ? "(): Promise<void>" : "()";

  if (dbChoice === "mongodb") {
    return `import mongoose from 'mongoose';

const connectDB = async ${tsFnSignature} => {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        console.error('MongoDB connection string is missing in environment variables (MONGO_URI)');
        process.exit(1);
    }

    let retries = 5;
    while (retries) {
        try {
            await mongoose.connect(mongoURI);   
            console.log('✅ MongoDB connection established successfully');
            break;
        } catch (error${useTypeScript ? ": any" : ""}) {
            console.error('❌ MongoDB connection failed. Retries left: ' + (retries - 1));
            console.error(\`Error: \${error.message}\`);
            retries -= 1;

            if (retries === 0) {
                console.error('MongoDB connection failed after multiple attempts. Exiting process.');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, 5000));
        }
    }

    mongoose.connection.on('disconnected', () => {
        console.warn(\`\\n⚠️ MongoDB connection lost. Attempting to reconnect...\`);
    });

    mongoose.connection.on('error', (err) => {
        console.error(\`MongoDB connection error: \${err}\`);
    });
};

const closeDB = async ${tsFnSignature} => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

const sequelize = null; // Not used for MongoDB
export { sequelize, mongoose, connectDB, closeDB };
`;
  } else if (dbChoice !== "none") {
    const sequelizeImports = useTypeScript
      ? `import { Sequelize, DataTypes, Model } from 'sequelize';`
      : `import { Sequelize, DataTypes } from 'sequelize';`;
    const sequelizeInit =
      dbChoice === "sqlite"
        ? `
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './data/${dbName}.sqlite',
    logging: false, // Set to true for SQL query logging
});
`
        : `
const sequelize = new Sequelize(
    process.env.DB_NAME || 'database',
    process.env.DB_USER || 'user',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '${
          dbChoice === "postgresql" ? "5432" : "3306"
        }'),
        dialect: '${dbChoice}',
        logging: false, // Set to true for SQL query logging
    }
);
`;
    return `${sequelizeImports}
import dotenv from 'dotenv';

dotenv.config();

${sequelizeInit}

const connectDB = async ${tsFnSignature} => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        await sequelize.sync(); // Sync models with database (creates tables if they don't exist)
        console.log('✅ Database synchronized successfully.');
    } catch (error${useTypeScript ? ": any" : ""}) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};

const closeDB = async ${tsFnSignature} => {
    if (sequelize) {
        await sequelize.close();
        console.log('Database connection closed.');
    }
};

const mongoose = null; // Not used for SQL
export { sequelize, mongoose, connectDB, closeDB };
`;
  } else {
    // No database
    return `const connectDB = () => {
    console.log('ℹ️ No database configured.');
};

const closeDB = () => {};

const sequelize = null;
const mongoose = null;

export { sequelize, mongoose, connectDB, closeDB };
`;
  }
}

/**
 * Generates the model code (e.g., User model).
 * @param {string} dbChoice - The chosen database.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @returns {string} The model code.
 */
function getModelCode(dbChoice, useTypeScript) {
  const ext = useTypeScript ? "ts" : "js";
  if (dbChoice === "mongodb") {
    return `import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\\S+@\\S+\\.\\S+$/, 'Please use a valid email address.'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', UserSchema);

export default User;
`;
  } else if (dbChoice !== "none") {
    return `import { sequelize } from './index${useTypeScript ? "" : ".js"}';
import { DataTypes, Model } from 'sequelize';
${
  useTypeScript
    ? `
interface UserAttributes {
    id?: number;
    username: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public email!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
`
    : ""
}
const User = sequelize${useTypeScript ? ".define<User>('User'" : ".define('User'"}, {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
}, {
    tableName: 'users',
    timestamps: true, // Adds createdAt and updatedAt fields
});

export default User;
`;
  } else {
    // No database, return a placeholder for consistency
    return `// No database configured, so no models are defined.
// You can define in-memory data structures here if needed.
`;
  }
}

/**
 * Generates the controller code (e.g., UserController).
 * @param {string} dbChoice - The chosen database.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @returns {string} The controller code.
 */
function getControllerCode(dbChoice, useTypeScript) {
  const ext = useTypeScript ? "ts" : "js";
  const reqResTypes = useTypeScript
    ? `(req: Request, res: Response)`
    : `(req, res)`;
  // The promiseVoid should probably remain Promise<void> for controllers
  // as they don't explicitly return anything useful, but rather manage the response.
  const promiseVoid = useTypeScript ? `: Promise<void>` : "";

  if (dbChoice === "mongodb") {
    return `${
      useTypeScript ? "import { Request, Response } from 'express';" : ""
    }
import User from '../models/User${
      useTypeScript ? "" : ".js"
    }'; // Mongoose User model

export const getUsers = async ${reqResTypes}${promiseVoid} => {
    try {
        const users = await User.find({});
        res.status(200).json({ users, count: users.length });
    } catch (error${useTypeScript ? ": any" : ""}) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const createUser = async ${reqResTypes}${promiseVoid} => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
          res.status(400).json({ message: 'Username and email are required.' });
          return;
    }
        const newUser = new User({ username, email });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully', userId: newUser._id });
    } catch (error${useTypeScript ? ": any" : ""}) {
        if (error.code === 11000) { // Duplicate key error
            // FIX START: Remove 'return' here
            res.status(409).json({ message: 'User with this username or email already exists.' });
            return; // Explicitly return void to satisfy TypeScript
            // FIX END
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};
`;
  } else if (dbChoice !== "none") {
    return `${
      useTypeScript ? "import { Request, Response } from 'express';" : ""
    }
import User from '../models/User${
      useTypeScript ? "" : ".js"
    }'; // Sequelize User model

export const getUsers = async ${reqResTypes}${promiseVoid} => {
    try {
        const users = await User.findAll();
        res.status(200).json({ users, count: users.length });
    } catch (error${useTypeScript ? ": any" : ""}) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const createUser = async ${reqResTypes}${promiseVoid} => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
            // FIX START: Remove 'return' here
            res.status(400).json({ message: 'Username and email are required.' });
            return; // Explicitly return void to satisfy TypeScript
            // FIX END
        }
        const newUser = await User.create({ username, email });
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error${useTypeScript ? ": any" : ""}) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            // FIX START: Remove 'return' here
            res.status(409).json({ message: 'User with this username or email already exists.' });
            return; // Explicitly return void to satisfy TypeScript
            // FIX END
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};
`;
  } else {
    // No database, use in-memory array
    return `${
      useTypeScript ? "import { Request, Response } from 'express';" : ""
    }

// In-memory data store for demonstration
let users${
      useTypeScript
        ? ": { id: number; username: string; email?: string }[]"
        : ""
    } = [
    { id: 1, username: 'alice', email: 'alice@example.com' },
    { id: 2, username: 'bob', email: 'bob@example.com' }
];
let nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

export const getUsers = ${reqResTypes} => {
    res.status(200).json({ users, count: users.length });
};

export const createUser = ${reqResTypes} => {
    const { username, email } = req.body;
    if (!username) {
        // FIX START: Remove 'return' here
        res.status(400).json({ message: 'Username is required.' });
        return; // Explicitly return void to satisfy TypeScript
        // FIX END
    }

    // Check for duplicate username (simple check for in-memory)
    if (users.some(user => user.username === username)) {
        // FIX START: Remove 'return' here
        res.status(409).json({ message: 'User with this username already exists.' });
        return; // Explicitly return void to satisfy TypeScript
        // FIX END
    }

    const newUser = { id: nextId++, username, email };
    users.push(newUser);
    res.status(201).json({ message: 'User created successfully', user: newUser });
};
`;
  }
}

/**
 * Generates the routes code (e.g., userRoutes).
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @returns {string} The routes code.
 */
function getRoutesCode(useTypeScript) {
  const ext = useTypeScript ? "ts" : "js";
  return `import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController${
    useTypeScript ? "" : ".js"
  }';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);

export default router;
`;
}

/**
 * Generates the error handling middleware code.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @returns {string} The middleware code.
 */
function getMiddlewareCode(useTypeScript) {
  const errorTypes = useTypeScript
    ? `(req: Request, res: Response, next: NextFunction)`
    : `(req, res, next)`;
  const errorHandlerTypes = useTypeScript
    ? `(err: Error, req: Request, res: Response, next: NextFunction)`
    : `(err, req, res, next)`;

  return `${
    useTypeScript
      ? "import { Request, Response, NextFunction } from 'express';"
      : ""
  }

export const notFound = ${errorTypes} => {
    const error = new Error(\`Not Found - \${req.originalUrl}\`);
    res.status(404);
    next(error);
};

export const errorHandler = ${errorHandlerTypes} => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
`;
}

/**
 * Generates utility functions code.
 * @param {boolean} useTypeScript - Whether TypeScript is being used.
 * @returns {string} The utility code.
 */
function getUtilsCode(useTypeScript) {
  return `import winston from 'winston';
import fs from 'fs';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

export const setupLogging = () => {
    // Ensure logs directory exists
    try {
        fs.mkdirSync('logs', { recursive: true });
    } catch (e) {
        // Directory already exists or other error
    }
    logger.info('Logging initialized.');
};

export { logger };
`;
}

/**
 * Installs Node.js dependencies using npm.
 * @param {string} cwd - Current working directory.
 */
async function installDependencies(cwd) {
  try {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    await execa(npmCommand, ["install"], { cwd, stdio: "inherit" });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

/**
 * Creates basic test files using Jest.
 * @param {string} cwd - Current working directory.
 * @param {object} options - Configuration options.
 */
async function createTestFiles(cwd, options) {
  const { useTypeScript, dbChoice } = options;
  const ext = useTypeScript ? "ts" : "js";

  // tests/user.test.js or tests/user.test.ts
  const testContent = `import request from 'supertest';
import app from '../src/app${
    useTypeScript ? "" : ".js"
  }'; // Adjust path if needed
${
  dbChoice === "mongodb"
    ? `import { mongoose } from '../src/models/index${
        useTypeScript ? "" : ".js"
      }';`
    : ""
}
${
  dbChoice !== "none" && dbChoice !== "mongodb"
    ? `import { sequelize } from '../src/models/index${
        useTypeScript ? "" : ".js"
      }';`
    : ""
}
${
  dbChoice !== "none"
    ? `import { connectDB, closeDB } from '../src/models/index${
        useTypeScript ? "" : ".js"
      }';`
    : ""
}

describe('User API Endpoints', () => {
    // Before all tests, connect to DB (if applicable)
    beforeAll(async () => {
        ${dbChoice !== "none" ? `await connectDB();` : ""}
        // For SQLite, ensure the database file is clean for tests
        ${
          dbChoice === "sqlite"
            ? `
        if (sequelize) {
            await sequelize.sync({ force: true }); // Recreate tables for clean test
        }
        `
            : ""
        }
        ${
          dbChoice === "mongodb"
            ? `
        if (mongoose && mongoose.connection.readyState === 1) {
            // Drop the users collection to ensure a clean state for tests
            await mongoose.connection.db.dropCollection('users').catch(() => {});
        }
        `
            : ""
        }
    });

    // After all tests, close DB connection (if applicable)
    afterAll(async () => {
        ${dbChoice !== "none" ? `await closeDB();` : ""}
    });

    it('GET / should return a welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Express API is running!');
    });

    it('GET /health should return health status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'healthy');
    });

    it('GET /api/users should return a list of users', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('users');
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('POST /api/users should create a new user', async () => {
        const newUser = { username: 'testuser', email: 'test@example.com' };
        const res = await request(app)
            .post('/api/users')
            .send(newUser);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User created successfully');
        ${
          dbChoice === "mongodb"
            ? `expect(res.body).toHaveProperty('userId');`
            : ""
        }
        ${
          dbChoice !== "mongodb" && dbChoice !== "none"
            ? `expect(res.body).toHaveProperty('user');`
            : ""
        }
    });

    it('POST /api/users should return 400 if username or email is missing (for DB)', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ email: 'missingusername@example.com' }); // Missing username
        ${
          dbChoice !== "none"
            ? `expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Username and email are required.');`
            : `expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Username is required.');`
        }
    });

    it('POST /api/users should return 409 if user already exists', async () => {
        // Create user first
        await request(app)
            .post('/api/users')
            .send({ username: 'existinguser', email: 'existing@example.com' });

        // Try to create again with same username/email
        const res = await request(app)
            .post('/api/users')
            .send({ username: 'existinguser', email: 'another@example.com' });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/exists/);
    });
});
`;
  await fs.writeFile(path.join(cwd, "tests", `user.test.${ext}`), testContent);

  // Jest config file
  const jestConfigContent = `/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
    preset: '${useTypeScript ? "ts-jest" : undefined}',
    ${useTypeScript ? '' : 'transform: {},'}
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.${ext}'],
    ${
      useTypeScript
        ? `moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },`
        : ""
    }
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    verbose: true,
};

export default config;
`;
  await fs.writeFile(path.join(cwd, `jest.config.${ext}`), jestConfigContent);
}

/**
 * Creates the README.md file.
 * @param {string} cwd - Current working directory.
 * @param {object} options - Configuration options.
 */
async function createReadme(cwd, options) {
  const { port, useTypeScript, useNodemon, dbChoice } = options;

  const dbDescription =
    dbChoice === "mongodb"
      ? "MongoDB (with Mongoose)"
      : dbChoice === "postgresql"
      ? "PostgreSQL (with Sequelize)"
      : dbChoice === "mysql"
      ? "MySQL (with Sequelize)"
      : dbChoice === "sqlite"
      ? "SQLite (with Sequelize)"
      : "no database";

  let readmeContent = `# Express.js Backend API

A robust Express.js REST API backend built with ${
    useTypeScript ? "TypeScript" : "JavaScript"
  } and ${dbDescription} integration.

## Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Run the Application

${
  useNodemon
    ? `#### Development Mode (with Nodemon)
\`\`\`bash
npm run dev
\`\`\`
This will start the server and automatically restart it on file changes.

#### Production Mode
\`\`\`bash
npm start
\`\`\`
`
    : `#### Start Server
\`\`\`bash
npm start
\`\`\`
`
}

The API will be available at: \`http://localhost:${port}\`

## API Endpoints

- \`GET /\` - Health check
- \`GET /health\` - Detailed health status
- \`GET /api/users/\` - List all users
- \`POST /api/users/\` - Create a new user

## Testing

To run the tests:

\`\`\`bash
npm test
\`\`\`

## Project Structure

\`\`\`
.
├── src/
│   ├── app.${
    useTypeScript ? "ts" : "js"
  }          # Main Express app configuration
│   ├── server.${useTypeScript ? "ts" : "js"}      # Server entry point
│   ├── controllers/    # Request handling logic
│   │   └── userController.${useTypeScript ? "ts" : "js"}
│   ├── models/         # Database models and connection
│   │   ├── index.${useTypeScript ? "ts" : "js"}
│   │   └── User.${useTypeScript ? "ts" : "js"}
│   ├── middleware/     # Express middleware (e.g., error handling)
│   │   └── errorHandler.${useTypeScript ? "ts" : "js"}
│   ├── routes/         # API routes definitions
│   │   └── userRoutes.${useTypeScript ? "ts" : "js"}
│   └── utils/          # Utility functions (e.g., logging)
│       └── helpers.${useTypeScript ? "ts" : "js"}
├── tests/
│   └── user.test.${useTypeScript ? "ts" : "js"}  # API tests
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies and scripts
${useTypeScript ? "├── tsconfig.json       # TypeScript configuration" : ""}
└── README.md           # Project documentation
\`\`\`

Happy coding! 🚀✨
`;
  await fs.writeFile(path.join(cwd, "README.md"), readmeContent);
}

/**
 * Performs final cleanup steps after project generation.
 * @param {string} cwd - Current working directory.
 */
async function finalCleanup(cwd) {
  try {
    // Remove .scripts folder if it exists (from the setup script itself)
    const scriptsFolder = path.join(cwd, ".scripts");
    if (await fs.pathExists(scriptsFolder)) {
      await fs.remove(scriptsFolder);
      console.log(chalk.gray("   Removed .scripts folder."));
    }
    // The temporary dependencies (inquirer, chalk, fs-extra, execa) are part of the setup script's own package.json.
    // The new project's package.json is generated clean, so no need to explicitly remove them from the new one.
    // If this setup script was run from a temporary directory, that directory would be cleaned up externally.
  } catch (error) {
    console.warn(chalk.yellow(`Cleanup warning: ${error.message}`));
  }
}

/**
 * Displays the success message and next steps.
 * @param {string} port - The port the server will run on.
 * @param {boolean} useTypeScript - Whether TypeScript is used.
 * @param {boolean} useNodemon - Whether Nodemon is used.
 */
function displaySuccessMessage(port, useTypeScript, useNodemon) {
  console.log(chalk.green.bold("\n🎉 Express backend setup completed!\n"));

  console.log(chalk.blue.bold("To get started:"));

  console.log(chalk.yellow("\n1. Install dependencies:"));
  console.log(chalk.white("   npm install"));

  console.log(chalk.yellow(`\n2. Start server:`));
  if (useNodemon) {
    console.log(chalk.white("   npm run dev"));
  } else {
    console.log(chalk.white("   npm start"));
  }

  console.log(chalk.yellow(`\n3. API endpoints:`));
  console.log(chalk.cyan(`   http://localhost:${port}`));
  console.log(chalk.cyan(`   http://localhost:${port}/api/users`));

  console.log(chalk.green("\nHappy coding! 🚀✨\n"));
}

// Run the setup
setup().catch((error) => {
  console.error(chalk.red("\n💥 Setup failed:"), error.message);
  process.exit(1);
});
