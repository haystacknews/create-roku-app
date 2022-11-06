import type prompts from 'prompts';
import { exec } from 'child_process';

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

// TODO: This is too slow, any way to speed it up?
/**
 * Returns the latest version of the given package from the npm repository.
 */
async function getPackageVersion(packageName: string) {
    return new Promise((resolve, reject) => {
        exec(`npm view ${packageName} --json`, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            if (stderr) {
                reject(stderr);
            }
            resolve(JSON.parse(stdout).version);
        });
    });
}

export async function generatePackageJson(answers: prompts.Answers<string>) {
    const contents = basePackageJson;

    if (answers.language === 'bs') {
        contents.scripts.prebuild = 'rm -rf dist';
        contents.scripts.build = 'bsc';
        contents.scripts['build:prod'] = 'npm run build -- --sourceMap=false';

        const bsVersion = await getPackageVersion('brighterscript');
        contents.devDependencies.brighterscript = `^${bsVersion}`;
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
        contents.scripts.lint = 'bslint --project config/bsconfig.lint.json --lintConfig config/bslint.jsonc';
        contents.scripts['lint:fix'] = 'npm run lint -- --fix';

        const linterVersion = await getPackageVersion('@rokucommunity/bslint');
        contents.devDependencies['@rokucommunity/bslint'] = `^${linterVersion}`;
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'formatter') {
        contents.scripts['format:base'] = 'bsfmt "src/**/*.brs" "src/**/*.bs" "!src/components/lib/**/*" "!src/source/lib/**/*" "!**/bslib.brs" --bsfmt-path "config/bsfmt.jsonc"';
        contents.scripts.format = 'npm run format:base -- --check';
        contents.scripts['format:fix'] = 'npm run format:base -- --write';

        const formatterVersion = await getPackageVersion('brighterscript-formatter');
        contents.devDependencies['brighterscript-formatter'] = `^${formatterVersion}`;
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
            preLaunchTask: 'build-prod',
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
        bsconfig.lintConfig = 'config/bslint.jsonc';
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
            path: `${folderName}/bsconfig.json`,
            content: JSON.stringify({ extends: 'config/bsconfig.base.json', host: '', password: '' }, null, 4)
        });
    }

    return files;
}
