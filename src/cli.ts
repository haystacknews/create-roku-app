import prompts from 'prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

import { mainSceneScript, mainSceneXml, mainScript, questions, recommendedAnswers, vanillaAnswers } from './data';
import {
    generatePackageJson,
    generateVscodeLaunchConfig,
    generateManifestString,
    generateBsConfigFiles,
    generateReadme
} from './utils';
import { spawn } from 'child_process';
import { names } from './names';

// Exits the process when the prompt is cancelled
// (e.g: when the user presses ctrl|cmd + c)
function exitPromptOnCancelled(state: any) {
    if (state.aborted) {
        process.nextTick(() => {
            process.exit(0);
        });
    }
}

export async function cli() {
    // Collect initial answers
    let answers: prompts.Answers<string> = {};
    const argv = await yargs(hideBin(process.argv)).argv;

    if (!argv.name) {
        answers.name = (await prompts({
            type: 'text',
            name: 'name',
            message: 'What\'s the name of your app?',
            initial: names[names.length * Math.random() | 0],
            onState: exitPromptOnCancelled
        })).name;
    } else {
        answers.name = argv.name;
    }

    if (argv.recommended) {
        console.info("Using recommended configuration...");
        Object.assign(answers, recommendedAnswers);
    } else if (argv.vanilla) {
        console.info("Using vanilla configuration...");
        Object.assign(answers, vanillaAnswers);
    } else {
        Object.assign(answers, await prompts(questions.map(q => ({ ...q, onState: exitPromptOnCancelled }))));
    }

    const shouldGitInit = (await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Should we initialize a git repository?',
        initial: true,
        onState: exitPromptOnCancelled
    })).value;

    // Optional question to install dependencies, only if they would be required
    let install = false;
    // Use npm by default, but allow the user to override
    let installCommand = 'npm install';

    const requiresDependencies = answers.language === 'bs' || answers.lintFormat !== 'none';
    if (requiresDependencies) {
        if (argv.pm === 'yarn') {
            installCommand = 'yarn';
        } else if (argv.pm === 'pnpm') {
            installCommand = 'pnpm install';
        }

        install = (await prompts({
            type: 'confirm',
            name: 'value',
            message: `Should we run \`${installCommand}\` for you?`,
            initial: true,
            onState: exitPromptOnCancelled
        })).value;
    }

    const folderName = answers.name.replaceAll(' ', '-').toLowerCase();

    // Create project folder
    await mkdir(folderName);

    // Create files and folders at the root of the project
    await Promise.all([
        mkdir(`${folderName}/src`),
        mkdir(`${folderName}/.vscode`),
        copyFile(resolve(__dirname, './static/_gitignore'), `${folderName}/.gitignore`),
        writeFile(`${folderName}/README.md`, generateReadme(answers))
    ]);

    if (requiresDependencies) {
        console.log('Searching latest dependencies...');
        await writeFile(`${folderName}/package.json`, JSON.stringify(await generatePackageJson(answers), null, 4));
    }

    if (answers.language === 'bs' || answers.lintFormat !== 'none') {
        await mkdir(`${folderName}/config`);
    }

    // Create files for linter and formatter
    if (answers.lintFormat === 'both') {
        await Promise.all([
            copyFile(resolve(__dirname, './static/bsfmt.jsonc'), `${folderName}/config/bsfmt.jsonc`),
            copyFile(resolve(__dirname, './static/bslint.jsonc'), `${folderName}/config/bslint.jsonc`)
        ]);
    } else if (answers.lintFormat === 'formatter') {
        await copyFile(resolve(__dirname, './static/bsfmt.jsonc'), `${folderName}/config/bsfmt.jsonc`);
    } else if (answers.lintFormat === 'linter') {
        await copyFile(resolve(__dirname, './static/bslint.jsonc'), `${folderName}/config/bslint.jsonc`);
    }

    // Create tree below src and .vscode
    await Promise.all([
        mkdir(`${folderName}/src/components`),
        mkdir(`${folderName}/src/source`),
        writeFile(`${folderName}/src/manifest`, generateManifestString(answers)),
        writeFile(`${folderName}/.vscode/launch.json`, JSON.stringify(generateVscodeLaunchConfig(answers), null, 4)),
        copyFile(resolve(__dirname, './static/extensions.json'), `${folderName}/.vscode/extensions.json`)
    ]);

    // Create .vscode tasks configuration
    if (answers.language === 'bs') {
        await copyFile(resolve(__dirname, './static/tasks.json'), `${folderName}/.vscode/tasks.json`);
    }

    // Create bsconfig files
    await Promise.all(generateBsConfigFiles(folderName, answers).map(file => writeFile(file.path, file.content)));

    await Promise.all([
        // Create tree below components/
        writeFile(`${folderName}/src/components/MainScene.xml`, mainSceneXml(answers.language)),
        writeFile(`${folderName}/src/components/MainScene.${answers.language}`, mainSceneScript),
        // Create main script
        writeFile(`${folderName}/src/source/main.${answers.language}`, mainScript(answers.inspector === 'plugin'))
    ]);

    if (shouldGitInit) {
        console.log('Initializing git repository...');
        await new Promise((resolve, reject) => {
            const child = spawn('git', ['init'], {
                cwd: folderName,
                stdio: 'inherit'
            });

            child.on('error', reject);
            child.on('exit', resolve);
        });
        console.log('Done!');
    }

    if (install) {
        console.log(`Installing dependencies with command \`${installCommand}\``);
        await new Promise((resolve, reject) => {
            const installCommandBase = String(installCommand.split(' ')[0]);
            const installCommandArgs = installCommand.split(' ').slice(1);
            const child = spawn(installCommandBase, installCommandArgs, {
                cwd: folderName,
                stdio: 'inherit'
            });

            child.on('error', reject);
            child.on('exit', resolve);
        });
    }

    if (answers.name.toLowerCase().includes('roku')) {
        console.warn('\nWarning: The name of your app contains "Roku", which is prohibited.')
    }

    console.log(`\nDone! Remaining steps for you:`);
    console.log(`- Open your project with \`code ${folderName}\`.`);
    console.log(`- Open \`bsconfig.json\` and set the preferred password for your device.`);
    console.log('- Go to the Run & Debug panel to build and launch your application.\n');

    console.log('Learn modern Roku development for free at: https://www.arturocuya.com?utm_source=create-roku-app&utm_medium=terminal')
    console.log('Happy coding!');
}
