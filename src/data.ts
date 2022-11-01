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
        message: 'SceneGraph Inspector',
        choices: [
            {
                title: 'Use the VSCode integrated inspector (recommended)',
                description: 'A faster and more insightful alternative to RALE within the Visual Studio Code plugin.',
                value: 'plugin'
            },
            {
                title: 'Use RALE',
                description: 'The official SceneGraph inspector provided by Roku.',
                value: 'rale'
            },
            {
                title: 'I don\'t want any of that',
                value: 'none'
            }
        ]
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

export const mainScript = `sub main()
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)
    m.global = screen.getGlobalNode()

    scene = screen.CreateScene("MainScene")
    screen.show()

    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        end if
    end while
end sub
`;
