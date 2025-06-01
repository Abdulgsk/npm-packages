#!/usr/bin/setup.js
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from 'execa'; // Import execa for running shell commands

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
    const cwd = process.cwd();
    const projectName = path.basename(cwd);

    console.log(chalk.green.bold("\nExpress + MongoDB Setup\n"));

    const answers = await inquirer.prompt([
        {
            type: "confirm",
            name: "useMongo",
            message: "Do you want to set up MongoDB (requires URI)?",
            default: true,
        },
        {
            type: "input",
            name: "mongoURI",
            message: "Enter your MongoDB connection URI:",
            when: (answers) => answers.useMongo, // Only ask if useMongo is true
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

    const { useMongo, mongoURI, useCors, useNodemon, port } = answers;

    // Update package.json to add main dependencies
    const pkgPath = path.join(cwd, "package.json");
    const pkgJson = await fs.readJson(pkgPath);

    pkgJson.dependencies = pkgJson.dependencies || {};
    pkgJson.devDependencies = pkgJson.devDependencies || {};

    // Add main project dependencies
    pkgJson.dependencies.express = "^4.19.2";
    pkgJson.dependencies.dotenv = "^16.5.0";
    if (useCors) {
        pkgJson.dependencies.cors = "^2.8.5";
    }
    if (useNodemon) {
        pkgJson.devDependencies.nodemon = "^3.1.4";
    }
    if (useMongo) { // Conditionally add mongoose
        pkgJson.dependencies.mongoose = "^8.4.4";
    }

    // Remove temporary setup dependencies
    delete pkgJson.dependencies.inquirer;
    delete pkgJson.dependencies.chalk;
    delete pkgJson.dependencies['fs-extra'];
    delete pkgJson.dependencies.execa; // execa is also a temporary setup dependency

    // Update scripts
    pkgJson.scripts = pkgJson.scripts || {};
    pkgJson.scripts.start = "node server.js";
    if (useNodemon) {
        pkgJson.scripts.dev = "nodemon server.js";
    }
    // Remove the postinstall script after it's run
    delete pkgJson.scripts.postinstall;

    await fs.writeJson(pkgPath, pkgJson, { spaces: 2 });

    // Create folder structure
    const folders = ["routes", "controllers"];
    if (useMongo) { // Only create 'db' folder if MongoDB is used
        folders.push("db");
    }
    for (const folder of folders) {
        await fs.ensureDir(path.join(cwd, folder));
    }

    // .env
    let envContent = `PORT=${port}\n`;
    if (useMongo) {
        envContent += `MONGO_URI=${mongoURI}\n`;
    }
    await fs.writeFile(path.join(cwd, ".env"), envContent);

    // .gitignore
    await fs.writeFile(
        path.join(cwd, ".gitignore"),
        `node_modules/
package-lock.json
.env
logs
*.log
.DS_Store
dist/
build/
.vscode/
.idea/
npm-debug.log*
`
    );

    // db/db.js - Only create if MongoDB is used
    if (useMongo) {
        await fs.writeFile(
            path.join(cwd, "db", "db.js"),
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
            break;
        } catch (error) {
            console.error(\`❌ MongoDB connection failed. Retries left: \${retries - 1}\`);
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
        console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
        console.error(\`MongoDB connection error: \${err}\`);
    });

    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
    });
};

export default connectDB;
`
        );
    }

    // server.js
    await fs.writeFile(
        path.join(cwd, "server.js"),
        `import express from 'express';
import dotenv from 'dotenv';
${useMongo ? "import connectDB from './db/db.js';" : ""}
${useMongo ? "import mongoose from 'mongoose';" : ""}
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

${useMongo ? "connectDB();" : "// MongoDB connection skipped"}

app.use(express.json());${useCors ? "\napp.use(cors());" : ""}

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/users', userRoutes);

const server = app.listen(PORT, () => {
    console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down...');
    ${useMongo ? "await mongoose.connection.close();" : "// No MongoDB connection to close"}
    server.close(() => {
        console.log('✅ Server stopped.');
        ${useMongo ? "console.log('✅ MongoDB connection closed.');" : ""}
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
`
    );

    // controllers/userController.js (remains the same)
    await fs.writeFile(
        path.join(cwd, "controllers", "userController.js"),
        `export const getUsers = (req, res) => {
    res.json([
        { id: 1, name: 'John' },
        { id: 2, name: 'Smith' },
    ]);
};`
    );

    // routes/users.js (remains the same)
    await fs.writeFile(
        path.join(cwd, "routes", "users.js"),
        `import express from 'express';
import { getUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);

export default router;`
    );

    console.log(chalk.blue.bold(`\n✅ Project structure and initial config complete!`));

    // --- Install main project dependencies ---
    console.log(chalk.green("\n📦 Installing main project dependencies... This might take a moment."));
    try {
        const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        await execa(npmCommand, ['install'], { cwd, stdio: 'inherit' });
        console.log(chalk.green("✅ Main project dependencies installed successfully."));
    } catch (error) {
        console.error(chalk.red(`❌ Failed to install main project dependencies: ${error.message}`));
        process.exit(1);
    }

    // --- CLEANUP ---
    console.log(chalk.gray("\n🧹 Cleaning up temporary setup files..."));
    try {
        await fs.remove(path.join(cwd, ".scripts")); // Remove the .scripts folder
        delete pkgJson.dependencies.execa;
        console.log(chalk.gray("   Removed .scripts folder. and execa from package.json"));
    } catch (error) {
        console.error(chalk.red(`Error during cleanup: ${error.message}`));
    }
    // The temporary dependencies (inquirer, chalk, fs-extra) were removed from package.json
    // npm will automatically remove unneeded packages when it next runs 'install'

    console.log(`\nTo get started:\n`);
    if (useNodemon) {
        console.log(chalk.yellow(`npm run dev`));
    } else {
        console.log(chalk.yellow(`npm start`));
    }
    console.log(chalk.gray("\nHappy coding! 🎉\n"));
}

setup();