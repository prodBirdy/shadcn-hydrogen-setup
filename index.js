#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Failed to execute ${command}`);
        process.exit(1);
    }
}

function moveComponents() {
    const srcPath = path.join(process.cwd(), 'src');
    const appPath = path.join(process.cwd(), 'app');

    if (fs.existsSync(path.join(srcPath, 'components'))) {
        const componentsSrc = path.join(srcPath, 'components');
        const componentsDest = path.join(appPath, 'components');

        runCommand(`mv ${componentsSrc} ${componentsDest}`);
    }

    if (fs.existsSync(path.join(srcPath, 'lib'))) {
        const libSrc = path.join(srcPath, 'lib');
        const libDest = path.join(appPath, 'lib');

        runCommand(`mv ${libSrc} ${libDest}`);
    }

    runCommand(`rm -rf ${srcPath}`);
}

// Initialize shadcn and move the generated components
const action = process.argv[2];
if (action === 'init') {
    runCommand('npx shadcn init');
    moveComponents();
} else if (action === 'add') {
    const component = process.argv[3];
    if (!component) {
        console.error('Please specify a component to add.');
        process.exit(1);
    }
    runCommand(`npx shadcn add ${component}`);
    moveComponents();
} else {
    console.error('Unknown action. Use "init" or "add".');
    process.exit(1);
}
