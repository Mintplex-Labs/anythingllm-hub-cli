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

Available entity types:
- `agent-skill` - An agent skill is a plugin that can be used to add custom functionality to AnythingLLM.




## Development
Link the local package so you can test it out without publishing:
```bash
npm link
```

Test it out by running `anythingllm-hub-cli` in your terminal.

`npm unlink` to remove the link when you're done.
