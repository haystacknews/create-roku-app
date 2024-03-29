import type prompts from 'prompts';
import * as https from 'https';

import { basePackageJson, baseVscodeConfig, bsconfigBase, manifest } from './data';

export function generateManifestString(answers: prompts.Answers<string>): string {
    const finalManifest = new Map<string, string>([
        ['title', answers.name],
        ...manifest
    ]);

    return Array.from(finalManifest.entries()).map(([key, value]): string => {
        return `${key}=${value}`;
    }).join('\n');
}

async function getPackageVersion(packageName: string) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'registry.npmjs.org',
            path: `/${packageName}`,
            port: 443,
            method: 'GET'
        }, (res) => {
            let str = '';

            res.on('data', (chunk) => {
                str += chunk;
            });

            res.on('end', () => {
                // Do stuff with your data (str)
                resolve(JSON.parse(str)['dist-tags'].latest);
            });
        });

        req.end();
    });
}

enum dependencies {
    bsc = 'brighterscript',
    linter = '@rokucommunity/bslint',
    formatter = 'brighterscript-formatter'
}

function getDepsRequirements(answers: prompts.Answers<string>) {
    const requiresBsc = answers.language === 'bs';
    const requiresLinter = answers.lintFormat === 'both' || answers.lintFormat === 'linter';
    const requiresFormatter = answers.lintFormat === 'both' || answers.lintFormat === 'formatter';
    return [requiresBsc, requiresLinter, requiresFormatter];
}

export async function generatePackageJson(answers: prompts.Answers<string>) {
    const contents = basePackageJson;

    const [requiresBsc, requiresLinter, requiresFormatter] = getDepsRequirements(answers);

    const requiredDependencies = [];
    if (requiresBsc) {
        requiredDependencies.push(dependencies.bsc);
    }
    if (requiresLinter) {
        requiredDependencies.push(dependencies.linter);
    }
    if (requiresFormatter) {
        requiredDependencies.push(dependencies.formatter);
    }

    if (requiresBsc) {
        const bscVersion = await getPackageVersion(dependencies.bsc);
        console.info(`Using ${dependencies.bsc} ^${bscVersion}`);
        contents.scripts.prebuild = 'rm -rf dist';
        contents.scripts.build = 'bsc';
        contents.scripts['build:prod'] = 'npm run build -- --sourceMap=false';
        contents.devDependencies.brighterscript = `^${bscVersion}`;
    }

    if (requiresLinter) {
        const linterVersion = await getPackageVersion(dependencies.linter);
        console.info(`Using ${dependencies.linter} ^${linterVersion}`);
        contents.scripts.lint = 'bslint --project config/bsconfig.lint.json --lintConfig config/bslint.jsonc';
        contents.scripts['lint:fix'] = 'npm run lint -- --fix';
        contents.devDependencies[dependencies.linter] = `^${linterVersion}`;
    }

    if (requiresFormatter) {
        const formatterVersion = await getPackageVersion(dependencies.formatter);
        console.info(`Using ${dependencies.formatter} ^${formatterVersion}`);
        contents.scripts['format:base'] = 'bsfmt "src/**/*.brs" "src/**/*.bs" "!src/components/lib/**/*" "!src/source/lib/**/*" "!**/bslib.brs" "!**/roku_modules/**/*" --bsfmt-path "config/bsfmt.jsonc"';
        contents.scripts.format = 'npm run format:base -- --check';
        contents.scripts['format:fix'] = 'npm run format:base -- --write';
        contents.devDependencies[dependencies.formatter] = `^${formatterVersion}`;
    }

    return contents;
}

export function generateVscodeLaunchConfig(answers: prompts.Answers<string>) {
    const vscodeConfig = baseVscodeConfig;

    if (answers.language === 'brs') {
        // eslint-disable-next-line no-template-curly-in-string
        vscodeConfig.rootDir = '${workspaceFolder}/src';
        vscodeConfig.files = [
            'source/**/*',
            'components/**/*',
            'images/**/*',
            'fonts/**/*',
            'manifest'
        ];
    } else {
        // eslint-disable-next-line no-template-curly-in-string
        vscodeConfig.rootDir = '${workspaceFolder}/dist/build';
        vscodeConfig.preLaunchTask = 'build';
    }

    const vscodeLaunchSettings: { version: string; configurations: Record<string, any>[] } = {
        version: '0.2.0',
        configurations: []
    };

    if (answers.language === 'bs' || answers.inspector === 'plugin') {
        const devLaunchConfig: any = {
            ...vscodeConfig,
            name: `Launch ${answers.name} (dev)`,
            injectRdbOnDeviceComponent: true
        };

        const prodLaunchConfig: any = {
            ...vscodeConfig,
            name: `Launch ${answers.name} (prod)`
        };

        if (answers.language === 'bs') {
            devLaunchConfig.preLaunchTask = 'build';
            prodLaunchConfig.preLaunchTask = 'build-prod';
        }

        vscodeLaunchSettings.configurations.push(devLaunchConfig, prodLaunchConfig);
    } else {
        vscodeLaunchSettings.configurations.push({
            ...vscodeConfig,
            name: `Launch ${answers.name}`
        });
    }

    return vscodeLaunchSettings;
}

export function generateBsConfigFiles(folderName: string, answers: prompts.Answers<string>): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];

    const [requiresBsc, requiresLinter] = getDepsRequirements(answers);

    let bsconfig: any = {};
    const hostAndPwd = {
        host: '',
        password: ''
    };

    if (requiresBsc) {
        bsconfig.sourceMap = true;
    }

    if (requiresLinter) {
        bsconfig.lintConfig = 'config/bslint.jsonc';
        bsconfig.plugins = [dependencies.linter];

        const bsconfigLintContent = {
            extends: 'bsconfig.base.json',
            deploy: false,
            retainStagingFolder: false,
            createPackage: false,
            sourceMap: false
        };

        files.push({
            path: `${folderName}/config/bsconfig.lint.json`,
            content: JSON.stringify(bsconfigLintContent, null, 4)
        });
    }

    let finalBsConfig = {};

    if (requiresBsc || requiresLinter) {
        bsconfig = { ...bsconfigBase, ...bsconfig };
        files.push({
            path: `${folderName}/config/bsconfig.base.json`,
            content: JSON.stringify(bsconfig, null, 4)
        });
        finalBsConfig = { extends: 'config/bsconfig.base.json', ...hostAndPwd };
    } else {
        finalBsConfig = { ...bsconfig, ...hostAndPwd, rootDir: 'src' };
    }

    files.push(
        {
            path: `${folderName}/bsconfig.json`,
            content: JSON.stringify(finalBsConfig, null, 4)
        },
        {
            path: `${folderName}/bsconfig.example.json`,
            content: JSON.stringify(finalBsConfig, null, 4)
        }
    );

    return files;
}

export function generateReadme(answers: prompts.Answers<string>) {
    const [requiresBsc, requiresLinter, requiresFormatter] = getDepsRequirements(answers);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const requiresDependencies = requiresBsc || requiresLinter || requiresFormatter;

    let text = `# Welcome to ${answers.name}

> This project was created using [\`npx create-roku-app\`](https://github.com/haystacknews/create-roku-app)

## Before you start
`;

    if (requiresDependencies) {
        text += `\n1. Install the project dependencies if you haven't done that yet.
`;
    }

    text += `
1. Open the \`bsconfig.json\` file and enter the password for your Roku device.

1. Optionally you can hardcode your Roku device's IP in the \`host\` field. If you do so make sure to remove the \`host\` entry from the \`.vscode/launch.json\` settings.

## Launching your app

> This project assumes that you will be using VSCode as your code editor.

1. Go to the \`Run and Debug\` panel.

1. Select the option \`Launch ${answers.name} (dev)\`
`;

    if (requiresDependencies) {
        text += '\n## NPM Commands available\n';
    }

    if (requiresBsc) {
        text += `\n- \`build\`: Builds your project with [\`brighterscript\`](https://github.com/rokucommunity/brighterscript). Includes source maps.

- \`build:prod\`: Builds your project without source maps.
`;
    }

    if (requiresLinter) {
        text += `\n- \`lint\`: Lints your source files with [\`@rokucommunity/bslint\`](https://github.com/rokucommunity/bslint)

- \`lint:fix\`: Lints your source files and applies automatic fixes.
`;
    }

    if (requiresFormatter) {
        text += `\n- \`format\`: Formats your source files with [\`brighterscript-formatter\`](https://github.com/rokucommunity/brighterscript-formatter)

- \`format:fix\`: Formats your source files and applies automatic fixes.
`;
    }

    return text;
}
