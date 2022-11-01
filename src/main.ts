import prompts from 'prompts';
import yargs from 'yargs';
import generate from 'project-name-generator';
import { hideBin } from 'yargs/helpers';
import { mkdir, writeFile } from 'fs/promises';

import { mainSceneScript, mainSceneXml, mainScript, manifest, questions, recommendedAnswers } from './data';
import { jsonToManifest } from './utils';

export async function main() {
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

    const folderName = answers.name.replaceAll(' ', '-').toLowerCase();
    const finalManifest = new Map<string, string>([
        ['title', answers.name],
        ...manifest
    ]);

    // Create project folder and src inside
    await mkdir(folderName);
    await mkdir(`${folderName}/src`);

    // Create tree below src
    await Promise.all([
        mkdir(`${folderName}/src/components`),
        mkdir(`${folderName}/src/source`),
        writeFile(`${folderName}/src/manifest`, jsonToManifest(finalManifest))
    ]);

    await Promise.all([
        // Create tree below components/
        writeFile(`${folderName}/src/components/MainScene.xml`, mainSceneXml(answers.language)),
        writeFile(`${folderName}/src/components/MainScene.${answers.language}`, mainSceneScript),
        // Create main script
        writeFile(`${folderName}/src/source/main.${answers.language}`, mainScript)
    ]);
}

void main();
