import prompts from 'prompts';
import yargs from 'yargs';
import generate from 'project-name-generator';
import { hideBin } from 'yargs/helpers';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import InfProgress from 'cli-infinity-progress';

import { mainSceneScript, mainSceneXml, mainScript, questions, recommendedAnswers } from './data';
import { generatePackageJson, generateVscodeLaunchConfig, generateManifestString, generateBsConfigFiles } from './utils';
import { spawn } from 'child_process';

export async function cli() {
    const progress = new InfProgress();

    // Collect initial answers
    let answers = recommendedAnswers;
    const argv = await yargs(hideBin(process.argv)).argv;

    if (!argv.name) {
        answers.name = (await prompts({
            type: 'text',
            name: 'name',
            message: 'What\'s the name of your app?',
            initial: generate({ alliterative: true }).dashed
        })).name;
    } else {
        answers.name = argv.name;
    }

    if (!argv.recommended) {
        answers = {
            ...answers,
            ...(await prompts(questions))
        };
    }

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
            initial: true
        })).value;
    }

    const folderName = answers.name.replaceAll(' ', '-').toLowerCase();

    // Create project folder
    await mkdir(folderName);

    // Create files and folders at the root of the project
    await Promise.all([
        mkdir(`${folderName}/src`),
        mkdir(`${folderName}/.vscode`),
        copyFile(resolve(__dirname, './static/_gitignore'), `${folderName}/.gitignore`)
    ]);

    if (requiresDependencies) {
        progress.setHeader('Searching latest dependencies').start();
        await writeFile(`${folderName}/package.json`, JSON.stringify(await generatePackageJson(answers), null, 4));
        progress.remove();
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
        writeFile(`${folderName}/.vscode/launch.json`, JSON.stringify(generateVscodeLaunchConfig(answers), null, 4))
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

    if (answers.initRepo) {
        progress.setHeader('Initializing Git repository');
        await new Promise((resolve, reject) => {
            const child = spawn('git', ['init'], {
                cwd: folderName,
                stdio: 'inherit'
            });

            child.on('error', reject);
            child.on('exit', resolve);
        });
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

    console.log(`\nDone! Remaining steps for you:`);
    console.log(`- Open your project with \`code ${folderName}\`.`);
    console.log(`- Open \`bsconfig.json\` and set the preferred password for your device.`);
    console.log('- Go to the Run & Debug panel and launch your application.\n');
    console.log('Happy coding!');
}
