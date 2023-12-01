export function generateFsAbstraction(answers) {
    const root = {
        type: 'folder',
        name: answers.name,
        children: []
    };

    const vscodeFolder = {
        type: 'folder',
        name: '.vscode',
        children: [
            {
                type: 'json',
                name: 'launch.json',
                data: {}
            }
        ]
    };
}
