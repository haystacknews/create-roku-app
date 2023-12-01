import randomNames from './random-names.js';
import { LanguageOptions, StyleOptions } from './enums.js';

// Exits the process when the prompt is cancelled
// (e.g: when the user presses ctrl|cmd + c)
export function exitPromptOnCancelled(state) {
    if (state.aborted) {
        process.nextTick(() => {
            process.exit(0);
        });
    }
}

export const namePrompt = {
    type: 'text',
    name: 'name',
    message: 'What\'s the name of your app?',
    // eslint-disable-next-line no-bitwise
    initial: randomNames[randomNames.length * Math.random() | 0]
};

export const languagePrompt = {
    type: 'select',
    name: 'language',
    message: 'Select a Language',
    choices: [
        {
            title: 'BrighterScript (recommended)',
            description: 'A superset of the BrightScript language that includes modern features like classes, namespaces, compiler plugins and more. Compiles to Vanilla BrightScript.',
            value: LanguageOptions.BrighterScript
        },
        {
            title: 'Vanilla BrightScript',
            description: 'The ol\' reliable language provided by Roku. No bells and whistles, but it gets the job done.',
            value: LanguageOptions.BrightScript
        }
    ]
};

export const stylePrompt = {
    type: 'select',
    name: 'style',
    message: 'Linter and formatter options',
    choices: [
        {
            title: 'Use both (recommended)',
            value: StyleOptions.Both
        },
        {
            title: 'Linter only (bslint)',
            value: StyleOptions.Linter
        },
        {
            title: 'Formatter only (brighterscript-formatter)',
            value: StyleOptions.Formatter
        },
        {
            title: 'Not this time',
            value: StyleOptions.None
        }
    ]
};

export const inspectorPrompt = {
    type: 'confirm',
    name: 'enableInspector',
    message: 'Enable SceneGraph Inspector?\nA faster and more insightful SceneGraph inspector within the Visual Studio Code plugin\n',
    initial: true
};

export const gitInitPrompt = {
    type: 'confirm',
    name: 'initRepo',
    message: 'Should we initialize a git repository?',
    initial: true
};

export const installPrompt = (installCommand) => ({
    type: 'confirm',
    name: 'runInstall',
    message: `Should we run \`${installCommand}\` for you?`,
    initial: true
});
