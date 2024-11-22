#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const _AnythingLLMStore = require('./AnythingLLMStore');


/** @type {_AnythingLLMStore} */
let LocalStore;

const Commands = {
  help: {
    args: {},
    description: 'Show help for the CLI',
    handler: () => {
      console.log('Usage: anythingllm-hub-cli <command> [options]');
      Object.keys(Commands).forEach(command => {
        const commandInfo = Commands[command];
        let info = `\t${command}: ${commandInfo.description}`;
        if (commandInfo.args) {
          Object.keys(commandInfo.args).forEach(arg => {
            info += `\n\t\t--${arg}: ${commandInfo.args[arg].description}.${commandInfo.args[arg].choices ? `\n\t\t\tChoices: ${commandInfo.args[arg].choices.join(', ')}` : ''}`;
          });
        }
        console.log(info);
      });
    }
  },
  config: {
    args: {},
    description: 'Show the current config',
    handler: () => {
      LocalStore.showConfig();
    }
  },
  login: {
    args: {},
    description: 'Login to the AnythingLLM Hub via Connection Key',
    handler: async () => {
      await LocalStore.login();
    }
  },
  logout: {
    args: {},
    description: 'Logout from the AnythingLLM Hub & clears the connection key from the config file',
    handler: async () => {
      await LocalStore.logout();
    }
  },
  upload: {
    args: {
      type: {
        type: 'string',
        description: 'The type of item to upload',
        choices: ['agent-skill']
      },
      path: {
        type: 'string',
        description: 'The path to the folder to upload, can be relative to the current working directory',
      }
    },
    description: 'Upload a model to the AnythingLLM Hub',
    handler: async (args) => {
      await LocalStore.upload(args);
    }
  },
  init: {
    args: {
      type: {
        type: 'string',
        description: 'The type of item to create',
        choices: ['agent-skill']
      },
      output: {
        type: 'string',
        description: 'The path to save the new item to, can be relative to the current working directory',
      }
    },
    description: 'Initialize a new agent skill',
    handler: async (args) => {
      await LocalStore.newItem(args);
    }
  }
}

async function main() {
  const command = argv?._[0] ?? null;
  if (command) {
    const argObject = Object.entries(Commands[command].args).reduce((acc, [arg]) => {
      if (['_', '$0'].includes(arg)) return acc;
      acc[arg] = argv[arg];
      return acc;
    }, {});
    LocalStore = new _AnythingLLMStore({ debug: argv.debug });
    await Commands[command].handler(argObject);
  } else {
    Commands.help.handler();
  }
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  console.error('Error:', error.message);
  process.exit(1);
});
