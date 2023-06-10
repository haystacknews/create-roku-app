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

export async function generatePackageJson(answers: prompts.Answers<string>) {
    const contents = basePackageJson;

    const requiresBsc = answers.language === 'bs';
    const requiresLinter = answers.lintFormat === 'both' || answers.lintFormat === 'linter';
    const requiresFormatter = answers.lintFormat === 'both' || answers.lintFormat === 'formatter';

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

    const [
        bscVersion,
        linterVersion,
        formatterVersion
    ] = await Promise.all(requiredDependencies.map(dep => getPackageVersion(dep)));

    if (requiresBsc) {
        contents.scripts.prebuild = 'rm -rf dist';
        contents.scripts.build = 'bsc';
        contents.scripts['build:prod'] = 'npm run build -- --sourceMap=false';
        contents.devDependencies.brighterscript = `^${bscVersion}`;
    }

    if (requiresLinter) {
        contents.scripts.lint = 'bslint --project config/bsconfig.lint.json --lintConfig config/bslint.jsonc';
        contents.scripts['lint:fix'] = 'npm run lint -- --fix';
        contents.devDependencies[dependencies.linter] = `^${linterVersion}`;
    }

    if (requiresFormatter) {
        contents.scripts['format:base'] = 'bsfmt "src/**/*.brs" "src/**/*.bs" "!src/components/lib/**/*" "!src/source/lib/**/*" "!**/bslib.brs" --bsfmt-path "config/bsfmt.jsonc"';
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

    let bsconfig: any = {};
    const hostAndPwd = {
        host: '',
        password: ''
    };

    if (answers.language === 'bs') {
        bsconfig.sourceMap = true;
    }

    if (answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
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

    if (answers.language === 'bs' || answers.lintFormat === 'both' || answers.lintFormat === 'linter') {
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
