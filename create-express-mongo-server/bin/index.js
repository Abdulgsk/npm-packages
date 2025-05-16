#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { ExitPromptError } from "@inquirer/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.green.bold("\nWelcome to create-express-mongo-server 🚀\n"));

async function init() {
  try {
    const { projectName, mongoURI, useCors, useNodemon, port } =
      await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Enter your project name:",
          default: "backend",
        },
        {
          type: "input",
          name: "mongoURI",
          message: "Enter your MongoDB connection URI:",
          validate: (input) => {
            const isValid =
              /^mongodb(?:\+srv)?:\/\/[\w.-]+(?::\w+)?@?[\w.-]+(?::\d+)?(?:\/[\w.-]*)?(?:\?.*)?$/.test(
                input
              );
            return (
              isValid ||
              "Please enter a valid MongoDB URI (e.g., mongodb://localhost:27017/mydb)"
            );
          },
        },
        {
          type: "input",
          name: "port",
          message: "Enter the port number:",
          default: "5000",
          validate: (input) => {
            const port = parseInt(input);
            if (!isNaN(port) && port > 0 && port < 65536) return true;
            return "Please enter a valid port number (1-65535)";
          },
        },
        {
          type: "confirm",
          name: "useCors",
          message: "Do you want to enable CORS?",
          default: true,
        },
        {
          type: "confirm",
          name: "useNodemon",
          message: "Do you want to use Nodemon for development?",
          default: true,
        },
      ]);

    const targetDir = path.join(process.cwd(), projectName);
    await fs.ensureDir(targetDir);

    // Minimal package.json setup
    const pkgJson = {
      name: projectName,
      version: "1.0.0",
      main: "server.js",
      type: "module",
      scripts: {
        start: "node server.js",
      },
    };

    if (useNodemon) {
      pkgJson.scripts.dev = "nodemon server.js";
    }

    await fs.writeJson(path.join(targetDir, "package.json"), pkgJson, {
      spaces: 2,
    });

    // Create folder structure
    const folders = ["routes", "controllers", "db"];
    for (const folder of folders) {
      await fs.ensureDir(path.join(targetDir, folder));
    }

    // 1. Create .env file
    await fs.writeFile(
      path.join(targetDir, ".env"),
      `MONGO_URI=${mongoURI}
    PORT=${port}
    `
    );

    // 2. Create .gitignore file
    await fs.writeFile(
      path.join(targetDir, ".gitignore"),
      `# dependencies
node_modules/
pakage-lock.json

# environment variables
.env

# logs
logs
*.log

# OS-specific
.DS_Store

# build
dist/
build/

# IDEs and editors
.vscode/
.idea/

# npm
npm-debug.log*
`
    );

    // db/db.js
    await fs.writeFile(
      path.join(targetDir, "db", "db.js"),
      `import mongoose from 'mongoose';
  
const connectDB = async () => {
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
      break; // Exit loop on successful connection
      } catch (error) {
      console.error(\`❌ MongoDB connection failed. Retries left: \${retries - 1}\`);
      console.error(\`Error: \${error.message}\`);
      retries -= 1;

      if (retries === 0) {
        console.error('MongoDB connection failed after multiple attempts. Exiting process.');
        process.exit(1);
        }

      // Wait before retrying (e.g., 5 seconds)
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  // Optional: Handle mongoose connection events more granularly
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error(\`MongoDB connection error: \${err}\`);
  });
  
  // Optional: Graceful shutdown on app termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
    });
    };
    
    export default connectDB;
    
    `
    );

    // server.js
    await fs.writeFile(
      path.join(targetDir, "server.js"),
      `import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/db.js';${
        useCors ? "\nimport cors from 'cors';" : ""
      }
import mongoose from 'mongoose';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());${useCors ? "\napp.use(cors());" : ""}

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
  });
  
app.use('/api/users', userRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Shutting down...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ MongoDB connection closed. Server stopped.');
    process.exit(0);
    });
    });

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      process.exit(1);
      });
      `
    );

    // controllers/userController.js
    await fs.writeFile(
      path.join(targetDir, "controllers", "userController.js"),
      `export const getUsers = (req, res) => {
  res.json([
    { id: 1, name: 'John' },
    { id: 2, name: 'Smith' },
    ]);
    };`
    );

    // routes/users.js
    await fs.writeFile(
      path.join(targetDir, "routes", "users.js"),
      `import express from 'express';
  import { getUsers } from '../controllers/userController.js';
  
  const router = express.Router();
  
  router.get('/', getUsers);
  
  export default router;`
    );

    // Install dependencies using child_process
    const dependencies = ["express", "mongoose"];
    if (useCors) dependencies.push("cors");

    const devDependencies = [];
    if (useNodemon) devDependencies.push("nodemon");

    console.log(chalk.blue("\nInstalling dependencies..."));

    dependencies.push("dotenv");
    execSync(`npm install ${dependencies.join(" ")}`, {
      cwd: targetDir,
      stdio: "inherit",
    });

    if (devDependencies.length > 0) {
      console.log(chalk.blue("\nInstalling dev dependencies..."));
      execSync(`npm install -D ${devDependencies.join(" ")}`, {
        cwd: targetDir,
        stdio: "inherit",
      });
    }

    console.log(
      chalk.blue.bold(
        `\n✅ Project '${projectName}' has been created successfully!`
      )
    );
    console.log(`\nTo get started:\n`);
    console.log(chalk.yellow(`cd ${projectName}`));
    console.log(chalk.yellow(`npm i or npm install`));
    if (useNodemon) {
      console.log(chalk.yellow(`npm run dev`));
    } else {
      console.log(chalk.yellow(`npm start`));
    }
  } catch (err) {
    if (err instanceof ExitPromptError) {
      console.log(chalk.cyan.bold("\nPrompt interrupted by user. Exiting..."));
      process.exit(0);
    } else {
      throw err; // Re-throw unexpected errors
    }
  }
}

init();
