import type prompts from 'prompts';

export const questions: Array<prompts.PromptObject> = [
    {
        type: 'select',
        name: 'language',
        message: 'Select a Language',
        choices: [
            {
                title: 'BrighterScript (recommended)',
                description: 'A superset of the BrightScript language that includes modern features like classes, namespaces, compiler plugins and more. Compiles to Vanilla BrightScript.',
                value: 'bs'
            },
            {
                title: 'Vanilla BrightScript',
                description: 'The ol\' reliable language provided by Roku. No bells and whistles, but it gets the job done.',
                value: 'brs'
            }
        ]
    },
    {
        type: 'select',
        name: 'lintFormat',
        message: 'Linter and formatter options',
        choices: [
            {
                title: 'Use both (recommended)',
                value: 'both'
            },
            {
                title: 'Linter only (bslint)',
                value: 'linter'
            },
            {
                title: 'Formatter only (brighterscript-formatter)',
                value: 'formatter'
            },
            {
                title: 'Not this time',
                value: 'none'
            }
        ]
    },
    {
        type: 'select',
        name: 'inspector',
        message: 'Enable SceneGraph Inspector',
        choices: [
            {
                title: 'Enable (recommended)',
                description: 'A faster and more insightful SceneGraph inspector within the Visual Studio Code plugin.',
                value: 'plugin'
            },
            {
                title: 'Not this time',
                value: 'none'
            }
        ]
    },
    {
        type: 'confirm',
        name: 'initRepo',
        message: 'Should we initialize a git repository?',
        initial: true
    }
];

export const recommendedAnswers: prompts.Answers<string> = {
    language: 'bs',
    lintFormat: 'both',
    inspector: 'plugin'
};

export const manifest = new Map<string, string>([
    ['ui_resolutions', 'fhd'],
    ['major_version', '1'],
    ['minor_version', '0'],
    ['build_version', '0'],
    ['mm_icon_focus_hd', '# TODO: Add path to 290x218 image'],
    ['mm_icon_focus_sd', '# TODO: Add path to 246x140 image'],
    ['splash_screen_hd', '# TODO: Add path to 1280x720 image'],
    ['splash_screen_sd', '# TODO: Add path to 720x480 image']
]);

export const mainSceneXml = (suffix: string) => `<?xml version="1.0" encoding="UTF-8"?>
<component name="MainScene" extends="Scene" xsi:noNamespaceSchemaLocation="https://devtools.web.roku.com/schema/RokuSceneGraph.xsd">
    <script type="text/brightscript" uri="MainScene.${suffix}" />
    <children>
        <Label id="welcome" />
    </children>
</component>
`;

export const mainSceneScript = `sub init()
    label = m.top.findNode("welcome")
    label.text = "Hello from create-roku-app"
end sub
`;

export const mainScript = (injectRdb: boolean) => `sub main()
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    m.global = screen.getGlobalNode()

    scene = screen.CreateScene("MainScene")
    screen.show()
${injectRdb
        ? '\n\t\' The following comment is to enable the SceneGraph inspector\n\t\' on the VSCode BrightScript plugin.\n\n\t\' vscode_rdb_on_device_component_entry\n'
        : ''}
    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub
`;

export const basePackageJson: any = {
    private: true,
    version: '0.0.1',
    dependencies: {},
    devDependencies: {},
    scripts: {}
};

export const baseVscodeConfig: Record<string, any> = {
    'type': 'brightscript',
    'request': 'launch',
    // eslint-disable-next-line no-template-curly-in-string
    'host': '${promptForHost}',
    'password': 'rokudev',
    'stopOnEntry': false,
    'enableDebuggerAutoRecovery': false,
    'stopDebuggerOnAppExit': false
};

export const VscodeTasks: Record<string, any> = {
    'label': 'build',
    'presentation': {
        'close': true,
        'reveal': 'silent',
        'revealProblems': 'onProblem'
    },
    'script': 'build',
    'type': 'npm'
};

export const bsconfigBase: Record<string, any> = {
    diagnosticLevel: 'error',
    retainStagingFolder: true,
    rootDir: 'src/',
    plugins: [],
    files: [
        'source/**/*',
        'components/**/*',
        'images/**/*',
        'fonts/**/*',
        'manifest'
    ],
    stagingFolderPath: 'dist/build'
};
