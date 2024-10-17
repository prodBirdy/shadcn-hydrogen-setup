#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

function runCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Failed to execute ${command}`);
        process.exit(1);
    }
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer.toLowerCase());
    }));
}

async function moveComponents() {
    const srcPath = path.join(process.cwd(), 'src');
    const componentsSrc = path.join(srcPath, 'components/ui');
    const componentsDest = path.join(process.cwd(), 'app/components/ui');
    const filesToRevert = [];

    // Ensure the destination directory exists
    if (!fs.existsSync(componentsDest)) {
        fs.mkdirSync(componentsDest, { recursive: true });
    }

    if (fs.existsSync(componentsSrc)) {
        // Move each file from src/components/ui to app/components/ui
        for (const file of fs.readdirSync(componentsSrc)) {
            const srcFile = path.join(componentsSrc, file);
            const destFile = path.join(componentsDest, file);

            if (fs.existsSync(destFile)) {
                const answer = await askQuestion(`The file ${destFile} already exists. Do you want to overwrite it? (yes/no): `);
                if (answer !== 'yes') {
                    console.log(`Skipping ${destFile}`);
                    filesToRevert.push(srcFile);
                    continue;
                }
                console.log(`Overwriting existing file: ${destFile}`);
            }

            runCommand(`mv -f ${srcFile} ${componentsDest}`);
        }
    }

    // Remove the files that were skipped
    for (const file of filesToRevert) {
        if (fs.existsSync(file)) {
            console.log(`Reverting added file: ${file}`);
            fs.rmSync(file, { force: true });
        }
    }

    // Remove the src/components/ui directory if it is empty
    if (fs.existsSync(componentsSrc) && fs.readdirSync(componentsSrc).length === 0) {
        fs.rmSync(componentsSrc, { recursive: true, force: true });
    }

    // Remove src directory if it is empty or only contains empty folders
    if (fs.existsSync(srcPath)) {
        const isSrcEmpty = fs.readdirSync(srcPath).every(subDir => {
            const fullPath = path.join(srcPath, subDir);
            return fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0;
        });

        if (isSrcEmpty) {
            fs.rmSync(srcPath, { recursive: true, force: true });
        }
    }
}

// Initialize shadcn and move the generated components
(async () => {
    const action = process.argv[2];
    if (action === 'init') {
        runCommand('npx shadcn init');
        await moveComponents();
    } else if (action === 'add') {
        const component = process.argv[3];
        if (!component) {
            console.error('Please specify a component to add.');
            process.exit(1);
        }
        runCommand(`npx shadcn add ${component}`);
        await moveComponents();
    } else {
        console.error('Unknown action. Use "init" or "add".');
        process.exit(1);
    }
})();
