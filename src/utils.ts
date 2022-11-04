/* eslint-disable no-template-curly-in-string */
import { basePackageJson, baseVscodeConfig, bsconfigBase, manifest } from './data';
import type prompts from 'prompts';

export function generateManifestString(answers: prompts.Answers<string>): string {
    const finalManifest = new Map<string, string>([
        ['title', answers.name],
        ...manifest
    ]);

    return Array.from(finalManifest.entries()).map(([key, value]): string => {
        return `${key}=${value}`;
    }).join('\n');
}

export function generatePackageJson(answers: prompts.Answers<string>) {
    const contents = basePackageJson;

    if (answers.language === 'bs') {
        contents.scripts.build = 'bsc --stagingFolderPath=dist/build';
        contents.scripts['build:prod'] = 'bsc --stagingFolderPath=dist/build --sourceMap=false';
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
        contents.scripts.lint = 'bslint --project config/bsconfig.lint.json';
        contents.scripts['lint:fix'] = 'npm run lint -- --fix';
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'formatter') {
        contents.scripts['format:base'] = 'bsfmt "src/**/*.brs" "src/**/*.bs" "!src/components/lib/**/*" "!src/source/lib/**/*" "!**/bslib.brs" --bsfmt-path "config/bsfmt.jsonc"';
        contents.scripts.format = 'npm run format:base -- --check';
        contents.scripts['format:fix'] = 'npm run format:base -- --write';
    }

    return contents;
}

export function generateVscodeLaunchConfig(answers: prompts.Answers<string>) {
    const vscodeConfig = baseVscodeConfig;

    if (answers.language === 'brs') {
        vscodeConfig.rootDir = '${workspaceFolder}/src';
        vscodeConfig.files = [
            'source/**/*',
            'components/**/*',
            'images/**/*',
            'fonts/**/*',
            'manifest'
        ];
    } else {
        vscodeConfig.rootDir = '${workspaceFolder}/dist/build';
        vscodeConfig.preLaunchTask = 'build';
    }

    const vscodeLaunchSettings: { version: string; configurations: Record<string, any>[] } = {
        version: '0.2.0',
        configurations: [{
            ...vscodeConfig,
            name: `Launch ${answers.name}`
        }]
    };

    if (answers.language === 'bs' || answers.inspector === 'plugin') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        vscodeLaunchSettings.configurations[0]!.name += ' (dev)';
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        vscodeLaunchSettings.configurations[0]!.injectRdbOnDeviceComponent = true;

        vscodeLaunchSettings.configurations.push({
            ...vscodeConfig,
            preLaunchTask: 'build:prod',
            name: `Launch ${answers.name} (prod)`
        });
    }

    return vscodeLaunchSettings;
}

export function generateBsConfigFiles(folderName: string, answers: prompts.Answers<string>): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];

    const bsconfig = bsconfigBase;

    if (answers.language === 'bs') {
        bsconfig.sourceMap = true;
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
        bsconfig.lintConfig = 'bslint.jsonc';
        bsconfig.plugins.push('@rokucommunity/bslint');

        let bsconfigLintContent: any = {
            deploy: false,
            retainStagingFolder: false,
            createPackage: false,
            sourceMap: false
        };

        if (answers.language === 'bs') {
            bsconfigLintContent.extends = 'bsconfig.base.json';
        } else {
            bsconfigLintContent = {
                ...bsconfig,
                ...bsconfigLintContent
            };
        }

        files.push({
            path: `${folderName}/config/bsconfig.lint.json`,
            content: JSON.stringify(bsconfigLintContent, null, 4)
        });
    }

    if (answers.language === 'bs') {
        files.push({
            path: `${folderName}/config/bsconfig.base.json`,
            content: JSON.stringify(bsconfig, null, 4)
        });

        files.push({
            path: `${folderName}/config/bsconfig.dev.json`,
            content: JSON.stringify({ extends: 'bsconfig.base.json', deploy: true }, null, 4)
        });

        files.push({
            path: `${folderName}/bsconfig.json`,
            content: JSON.stringify({ extends: 'bsconfig.base.json', host: '', password: '' }, null, 4)
        });
    }

    return files;
}
