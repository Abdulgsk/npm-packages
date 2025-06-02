#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.green.bold("\nWelcome to backend-studio 🚀\n"));

// Get folder name from CLI arg if provided
const folderArg = process.argv[2];
let folderCreatedByMe = false;


function foldeName() {
    // If a folder name is provided via CLI argument, check if the directory already exists
    if (folderArg) {
        const targetDir = path.join(process.cwd(), folderArg);
        if (fs.existsSync(targetDir)) {
            console.error(chalk.red(`\nError: Directory "${folderArg}" already exists! Please choose a different name or delete the existing folder.`));
            process.exit(1); // Exit the process as we cannot proceed
        } else {
            folderCreatedByMe = true; // Set flag to true since we will create this folder
        }
    }
}
// Handle graceful exit on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    async function handleExit() {
        if (folderCreatedByMe) {
            try {
                const targetDir = path.join(process.cwd(), folderArg || "backend");
                await fs.remove(targetDir);
                console.log(chalk.blue.bold(`\n🗑️  Folder '${targetDir}' removed.`));
            } catch (error) {
                console.error(chalk.red(`\n❌ Error removing folder: ${error.message}`));
            }
        }
    }
    console.log(chalk.yellow('\n\n👋 Setup cancelled by user. Goodbye!'));
    process.exit(0);
});

async function init() {
    try {
        // Prompt for folder/project name if not provided
        let projectName = folderArg;
        let targetDir;

        // --- NEW LOGIC STARTS HERE ---
        // If a project name is provided via CLI argument, check if the directory already exists
        if (projectName) {
            targetDir = path.join(process.cwd(), projectName);
            if (fs.existsSync(targetDir)) {
                console.error(chalk.red(`\nError: Directory "${projectName}" already exists! Please choose a different name or delete the existing folder.`));
                process.exit(1); // Exit the process as we cannot proceed
            }
        }
        // --- NEW LOGIC ENDS HERE ---

        // Prompt for folder/project name if not provided (or if CLI arg was invalid)
        if (!projectName) {
            const { inputName } = await inquirer.prompt([
                {
                    type: "input",
                    name: "inputName",
                    message: "Enter your project folder name:",
                    default: "backend",
                    validate: (input) => {
                        if (!input.trim()) return "Project name cannot be empty";
                        // This validation will still be useful if the user types a name
                        // after not providing it as an argument.
                        if (fs.existsSync(path.join(process.cwd(), input))) {
                            return "Directory already exists! Please choose a different name.";
                        }
                        return true;
                    },
                },
            ]);
            projectName = inputName;
        }

        targetDir = path.join(process.cwd(), projectName); // Ensure targetDir is set for the chosen name
        await fs.ensureDir(targetDir);
        // Ensure the .scripts folder exists directly within the target directory
        await fs.ensureDir(path.join(targetDir, ".scripts"));

        // In your index.js init() function
        const { backendChoice } = await inquirer.prompt([
            {
                type: "list",
                name: "backendChoice",
                message: "Which backend technology would you like to use?",
                choices: ["Express", "Flask"], // Corrected: Capitalized to match conditions
                default: "Express", // Default choice
            },
        ]);

        let postinstallScriptCommand, startCommand, mainEntry;
        const packageType = "module"; // IMPORTANT: Always set to "module" initially for setup scripts to run

        if (backendChoice === "Express") {
            postinstallScriptCommand = "node .scripts/setup-express.js";
            startCommand = "node server.js"; // Assuming server.js is the entry point
            mainEntry = "server.js";
            await fs.copyFile(
                path.join(__dirname, "setup", "setup-express.js"), // Corrected source path: now includes 'setup' subdirectory
                path.join(targetDir, ".scripts", "setup-express.js") // Destination: directly in .scripts folder
            );
        } else if (backendChoice === "Flask") {
            postinstallScriptCommand = "node .scripts/setup-flask.js";
            startCommand = "python app.py"; // Assuming app.py is the entry point for Flask
            mainEntry = "app.py"; // Flask projects typically have an app.py
            // packageType will be set to "module" initially, and then removed by setup-flask.js
            await fs.copyFile(
                path.join(__dirname, "setup", "setup-flask.js"), // Corrected source path: now includes 'setup' subdirectory
                path.join(targetDir, ".scripts", "setup-flask.js") // Destination: directly in .scripts folder
            );
        } else {
            // Handle unexpected choice or provide a fallback
            console.error("Unexpected backend choice. Exiting.");
            process.exit(1);
        }

        // 3. Generate package.json with postinstall pointing to local script
        const pkgJson = {
            name: projectName,
            version: "1.0.0",
            main: mainEntry, // Use the determined main entry
            type: packageType, // Use the determined type (now always "module" initially)
            scripts: {
                start: startCommand, // Use the determined start command
                postinstall: postinstallScriptCommand, // This is correct now!
            },
            // Add setup.js dependencies here temporarily
            dependencies: {
                inquirer: "^9.0.0", // Use specific versions or ranges that work
                chalk: "^5.0.0", // For chalk 5 (ESM compatible)
                "fs-extra": "^11.0.0", // For fs-extra
                execa: "^9.0.0", // For execa (corrected typo)
                // Note: path and url are built-in Node.js modules, no need to list them
            },
        };
        await fs.writeJson(path.join(targetDir, "package.json"), pkgJson, {
            spaces: 2,
        });

        console.log(chalk.blue.bold(`\n✅ Folder '${projectName}' created!`));
        console.log(`\nNext steps:`);
        console.log(chalk.yellow(`cd ${projectName}`));
        console.log(chalk.yellow(`npm install or npm i`));
        console.log(
            chalk.gray("\nThis will continue the setup inside your new folder.\n")
        );

    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log(chalk.yellow('\n\n👋 Setup cancelled by user. Goodbye!'));
            process.exit(0);
        } else {
            console.error(chalk.red('\n❌ An error occurred during setup:'));
            console.error(error.message);
            process.exit(1);
        }
    }
}
foldeName();
init();