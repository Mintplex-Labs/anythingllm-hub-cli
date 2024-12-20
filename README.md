# AnythingLLM Hub CLI

## Overview 

[AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) is an open-source platform and desktop app that is an "all-in-one" solution for using LLMs to their maximum potential, but without all the complexity or setup.

[AnythingLLM Hub](https://hub.anythingllm.com) is a platform for sharing and discovering custom community-contributed plugins for AnythingLLM.

AnythingLLM plugins extend the functionality of AnythingLLM beyond the core set of plugins that are distributed with AnythingLLM so that you can build custom workflows and integrations or just tools that are specific to your use case.

This CLI tool allows you to upload your custom plugins to the AnythingLLM Hub so that they can be discovered and used by others.

### What is a plugin?

Plugins are extensions to AnythingLLM that can be used to add custom functionality to AnythingLLM. These are pieces of custom code that can do whatever it is you want them to do. Anything you can write in Node.js can be used as a plugin within the framework of AnythingLLM.

### Supported Entity Types

- [x] Agent Skills
- [ ] Data Connectors


## Usage

- `npx anythingllm-hub-cli help` - Show help for the CLI
- `npx anythingllm-hub-cli config` - Show the current config path and display the current config
- `npx anythingllm-hub-cli login` - Login using your [AnythingLLM Hub Connection Key](https://hub.anythingllm.com/me)
- `npx anythingllm-hub-cli logout` - Logout and clear your connection key from the config file
- `npx anythingllm-hub-cli upload --type=<agent-skill> --path=<path-to-plugin-folder>` - Upload an agent skill to the AnythingLLM Hub
- `npx anythingllm-hub-cli init --type=<agent-skill> --output=<path-to-save-to>` - Create a new agent skill in the current directory or at the specified folder

Available entity types:
- `agent-skill` - An agent skill is a plugin that can be used to add custom functionality to AnythingLLM.


## Development
Link the local package so you can test it out without publishing:
```bash
npm link
```

Test it out by running `npx anythingllm-hub-cli` in your terminal.

```bash
# Remove the link so you can test the latest version
npm unlink -g anythingllm-hub-cli
npm uninstall -g anythingllm-hub-cli
npx clear-npx-cache
npx @mintplex-labs/anythingllm-hub-cli@latest
```

Publish the package:
```bash
npm publish --access public
```