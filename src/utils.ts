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

    let bsconfig: any = {};
    const hostAndPwd = {
        host: 'If your Roku IP is static, you can set it here and remove the host entry from .vscode/launch.json',
        password: ''
    };

    if (answers.language === 'bs') {
        bsconfig.sourceMap = true;
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
        bsconfig.lintConfig = 'config/bslint.jsonc';
        bsconfig.plugins = ['@rokucommunity/bslint'];

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

    if (answers.language === 'bs' || answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
        bsconfig = { ...bsconfigBase, ...bsconfig };
        files.push({
            path: `${folderName}/config/bsconfig.base.json`,
            content: JSON.stringify(bsconfig, null, 4)
        });

        files.push({
            path: `${folderName}/bsconfig.json`,
            content: JSON.stringify({ extends: 'config/bsconfig.base.json', ...hostAndPwd }, null, 4)
        });
    } else {
        files.push({
            path: `${folderName}/bsconfig.json`,
            content: JSON.stringify({ ...bsconfig, ...hostAndPwd }, null, 4)
        });
    }

    return files;
}
