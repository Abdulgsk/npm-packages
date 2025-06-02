# 🎨 Backend Studio

<div align="center">
  
[![npm version](https://badge.fury.io/js/backend-studio.svg)](https://badge.fury.io/js/backend-studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

**🎨 Your creative workspace for backend development**

*Craft beautiful Express.js & Flask backends with MongoDB, PostgreSQL, MySQL, SQLite support*

</div>

---

## 🌟 Features

### 🔥 **Dual Framework Support**
- **Express.js** - Fast, unopinionated web framework for Node.js
- **Flask** - Lightweight WSGI web application framework for Python

### 🗄️ **Multi-Database Support**
- **MongoDB** with Mongoose ODM
- **PostgreSQL** with Sequelize ORM
- **MySQL** with Sequelize ORM  
- **SQLite** for lightweight development
- **No Database** option for API-only projects

### ⚙️ **Developer Experience**
- **TypeScript** support for Express projects
- **Python Virtual Environment** for Flask projects
- **CORS** configuration out of the box
- **Nodemon** for auto-restart during development
- **Environment Variables** with dotenv
- **Interactive CLI** with beautiful prompts

---

## 🚀 Quick Start

### Create Your Backend in 30 Seconds

```bash
npx backend-studio my-awesome-backend
cd my-awesome-backend
npm install
```

That's it! Your backend is ready to rock! 🎸

---

## 📦 Installation & Usage

### Option 1: NPX (Recommended)
```bash
npx backend-studio <project-name>
```

### Option 2: Global Installation
```bash
npm install -g backend-studio
backend-studio <project-name>
```

### 🎯 Example Commands
```bash
# Create Express.js backend
npx backend-studio my-express-api

# Create Flask backend  
npx backend-studio my-flask-api

# Navigate and install dependencies
cd my-express-api
npm install

# Start development server
npm run dev
```

---

## 🛠️ Interactive Setup

When you run the command, you'll be guided through an interactive setup:

### For Express.js Projects:
```
✨ Welcome to Express.js Backend Generator!

? Use TypeScript? (Y/n) 
? Express server port: (3000)
? Enable CORS? (Y/n)
? Use Nodemon for development? (Y/n)
? Choose database option:
  ❯ MongoDB (with Mongoose)
    PostgreSQL (with Sequelize)
    MySQL (with Sequelize)
    SQLite (with Sequelize, file-based)
    No database
```

### For Flask Projects:
```
🐍 Welcome to Flask Backend Generator!

? Create a Python virtual environment? (Y/n)
? Flask server port: (5000)
? Enable CORS? (Y/n)
? Choose database option:
  ❯ SQLite (file-based, good for development)
    PostgreSQL
    MySQL
    No database
? Set up MongoDB integration? (y/N)
```

---

## 📁 Project Structure

### Express.js Structure
```
my-express-backend/
├── 📄 package.json
├── 🔧 .env
├── 📝 README.md
├── 🚀 server.js (or server.ts)
├── 📁 routes/
│   └── 🛣️ index.js
├── 📁 models/
│   └── 🏗️ User.js
├── 📁 middleware/
│   └── ⚙️ auth.js
└── 📁 config/
    └── 🗄️ database.js
```

### Flask Structure
```
my-flask-backend/
├── 📄 requirements.txt
├── 🔧 .env
├── 📝 README.md
├── 🐍 app.py
├── 📁 models/
│   └── 🏗️ user.py
├── 📁 routes/
│   └── 🛣️ main.py
└── 📁 config/
    └── 🗄️ database.py
```

---

## 🔧 Environment Configuration

Your project comes with a pre-configured `.env` file:

### Express.js
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/myapp
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=password
DB_NAME=mydb
```

### Flask
```env
FLASK_PORT=5000
FLASK_ENV=development
MONGODB_URI=mongodb://localhost:27017/myapp
DATABASE_URL=sqlite:///app.db
```

---

## 🚀 Getting Started After Setup

### Express.js
```bash
cd your-project-name
npm install

# Development with auto-restart
npm run dev

# Production
npm start
```

### Flask
```bash
cd your-project-name

# Activate virtual environment (if created)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Or with Flask CLI
flask run
```

---

## 🎨 What You Get Out of the Box

### ✅ Express.js Features
- **Express Server** with middleware setup
- **Database Integration** (MongoDB/PostgreSQL/MySQL/SQLite)
- **CORS Configuration** for cross-origin requests
- **Environment Variables** management
- **TypeScript Support** (optional)
- **Nodemon** for development auto-restart
- **Basic Routing** structure
- **Error Handling** middleware

### ✅ Flask Features
- **Flask Application** with blueprints
- **Database Integration** with SQLAlchemy/PyMongo
- **CORS Support** with Flask-CORS
- **Virtual Environment** setup
- **Environment Variables** with python-dotenv
- **Basic Route** structure
- **Error Handling** setup

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abdul Gouse A**
- GitHub: [@Abdulgsk](https://github.com/Abdulgsk)
- Email: your-email@example.com

---

## ⭐ Show Your Support

If this project helped you, please consider giving it a ⭐ on [GitHub](https://github.com/Abdulgsk/npm-packages)!

---

<div align="center">

**Made with ❤️ for the developer community**

*Happy Coding! 🚀*

</div>