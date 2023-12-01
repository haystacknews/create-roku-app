import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as q from './prompts.js';
import prompts from 'prompts';
import { LanguageOptions, PackageManagerOptions, StyleOptions } from './enums.js';

export async function cli() {
    // Get command arguments
    const argv = await yargs(hideBin(process.argv)).argv;

    if (!!argv.pm && !Object.values(PackageManagerOptions).includes(argv.pm)) {
        console.error(`Error: Unknown package manager option "${argv.pm}"`);
        process.exit(0);
    }

    const answers = {};
    const questions = [];

    if (!argv.name) {
        questions.push(q.namePrompt);
    }

    if (!argv.recommended) {
        questions.push(q.languagePrompt);
        questions.push(q.stylePrompt);
        questions.push(q.inspectorPrompt);
    } else {
        answers.language = LanguageOptions.BrighterScript;
        answers.style = StyleOptions.Both;
        answers.enableInspector = true;
    }

    questions.push(q.gitInitPrompt);

    // eslint-disable-next-line github/array-foreach
    questions.forEach(p => {
        p.onState = q.exitPromptOnCancelled;
    });

    Object.assign(answers, await prompts(questions));

    if (answers.language !== LanguageOptions.BrighterScript && answers.style === StyleOptions.None) {
        return answers;
    }

    let installCommand = 'npm install';

    if (argv.pm === PackageManagerOptions.Yarn) {
        installCommand = 'yarn';
    } else if (argv.pm === PackageManagerOptions.Pnpm) {
        installCommand = 'pnpm install';
    }

    const installPrompt = q.installPrompt(installCommand);
    installPrompt.onState = q.exitPromptOnCancelled;
    const { runInstall } = await prompts(q.installPrompt(installPrompt));

    answers.runInstall = runInstall;
    return answers;
}
