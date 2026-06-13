# `create-roku-app`

> An interactive command-line scaffolder that bootstraps a modern Roku app with sensible defaults: language choice, linting, formatting, and editor tooling configured for you.

Quickly scaffold a modern Roku app, including the best practices to enhance your development experience. Instead of copying boilerplate by hand, you answer a few prompts (or pass flags) and get a ready-to-run project wired up with the RokuCommunity toolchain.

> **This project assumes that you will be using VSCode for development.**

## Tech stack

`Node.js` · `TypeScript` · `npm (published package)` · targets `BrightScript` / `BrighterScript` Roku projects

<!-- TODO (Arturo): confirm the implementation language above. The package is published to npm and run via `npx`; verify whether the CLI source is TypeScript or JavaScript before publishing this line. -->

## Features

- Interactive prompts to scaffold a complete Roku project in seconds.
- Choice of **BrighterScript** (recommended) or **Vanilla BrightScript** as the project language.
- Optional linter ([bslint](https://github.com/rokucommunity/bslint)) and formatter ([brighterscript-formatter](https://github.com/rokucommunity/brighterscript-formatter)), together or individually.
- Optional SceneGraph Inspector setup for a faster, more insightful debugging experience in the VSCode plugin.
- Optional `git init` and dependency install as part of the same flow.
- Non-interactive mode via CLI flags (`--name`, `--recommended`, `--vanilla`) for scripted or repeatable setups.
- Package-manager choice: `npm` (default), `yarn`, or `pnpm`.

## How it works

`create-roku-app` is a Node CLI you run with `npx`, so there is nothing to install globally. It walks you through a short series of questions (language, linter/formatter, SceneGraph Inspector, `git init`, dependency install), then writes out a project directory with the matching configuration files and dependencies already in place. Passing `--recommended` skips the questions and applies the recommended defaults, and `--vanilla` produces a minimal project. The goal is to remove the repetitive boilerplate and get you to a working, best-practice Roku project on the first command.

## Install / Usage

No global install is required. Run it directly with `npx`:

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

These are only available as CLI `--flags` and will not appear on the questions list.

- `--name`: Shortcut to set the name of your project.

- `--pm`: Set the package manager that will be used to install dependencies, if necessary. Values: `npm` (default) | `yarn` | `pnpm`.

- `--recommended`: Start a project with the recommended options values.

- `--vanilla`: Start a project with minimal options and dependencies.

## Contribute

You can see our issues list for things that need to be implemented. For any questions ping me ([@arturocuya](https://github.com/arturocuya)) on the Roku Developers [Slack channel](https://join.slack.com/t/rokudevelopers/shared_invite/zt-1fwucni9w-WizAcwB_rhL8nTctkO7trQ).
