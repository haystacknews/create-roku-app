# `create-roku-app`

Quickly scaffold a modern Roku app, including the best practices to enhance your development experience.

> **This project assumes that you will be using VSCode for development.**

## Usage

```bash
npx create-roku-app
```

### With recommended options

```bash
npx create-roku-app --name "My App" --recommended
```

## Options

1. Select a language

    - **[BrighterScript](https://github.com/rokucommunity/brighterscript) (recommended)**: A superset of the BrightScript language that includes modern features like classes, namespaces, compiler plugins and more. Compiles to Vanilla BrightScript.

    - Vanilla BrightScript: The old reliable language provided by Roku.

1. Linter and formatter

    - **Install both (recommended)**

    - Install linter only ([bslint](https://github.com/rokucommunity/bslint))

    - Install formatter only ([brighterscript-formatter](https://github.com/rokucommunity/brighterscript-formatter))

    - Not this time.

1. Enable SceneGraph Inspector: A faster and more insightful SceneGraph inspector within the Visual Studio Code plugin.

    - **Enable (recommended)**

    - Not this time.

1. Run `git init`? (y/n)

1. Run `npm install`? (y/n)


## CLI options

These are only available as CLI `--flags` and will not appear on the questions list

- `--name`: Shortcut to set the name of your project.

- `--pm`: Set the package manager that will be used to install dependencies, if necessary. Values: `npm` (default) | `yarn` | `pnpm`.

- `--recommended`: Start a project with the recommended options values.


## Contribute

You can see our issues list for things that need to be implemented. For any questions ping me ([@arturocuya](https://github.com/arturocuya)) on the Roku Developers [Slack channel](https://join.slack.com/t/rokudevelopers/shared_invite/zt-1fwucni9w-WizAcwB_rhL8nTctkO7trQ).