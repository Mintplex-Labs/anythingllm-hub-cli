const fs = require('fs');
const path = require('path');
const os = require('os');
const input = require('input');
const CommunityHubInterface = require('./CommunityHubInterface');
const validateAgentSkill = require('./utils/validateAgentSkill');

/**
 * AnythingLLMStore is a class that stores the connection key for the AnythingLLM Hub.
 */
class AnythingLLMStore extends CommunityHubInterface {
  configPath = path.join(os.homedir(), '.anythingllm-hub-cli-config.json');
  connectionKey = null;
  userInfo = null;
  supportedUploadTypes = ['agent-skill'];

  /**
   * @param {Object} options
   * @param {boolean} options.debug
   */
  constructor({ debug = false } = {}) {
    if (debug) {
      console.log(`---`);
      console.log(`AnythingLLM CLI initialized with debug: ${debug}`);
      console.log(`---`);
    }
    super({ debug });
    this._loadConfig();
  }

  _loadConfig() {
    if (fs.existsSync(this.configPath)) {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

      if (config.connectionKey) {
        this.connectionKey = config.connectionKey;
        this.userInfo = config.userInfo;
        console.log(`Loaded connection key: ${this.connectionKey}`);
      } else {
        console.log('No connection key found in config - you will need to login to push to the AnythingLLM Hub');
      }
    }
  }

  /**
   * Updates the config file with the given updates.
   * @param {Object} updates
   */
  _saveConfig(updates = {}) {
    // If the config file doesn't exist, create it
    if (!fs.existsSync(this.configPath)) return fs.writeFileSync(this.configPath, JSON.stringify(updates, null, 2));

    // Otherwise, update the existing config
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    Object.assign(config, updates);
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  _wipeConfig() {
    if (!fs.existsSync(this.configPath)) return;
    fs.unlinkSync(this.configPath);
  }

  /**
   * Shows the current config in the console.
   */
  showConfig() {
    if (!fs.existsSync(this.configPath)) {
      console.log('No config file found. Run `anythingllm-hub-cli login` to login and save your connection key.');
      return;
    }
    console.log(JSON.parse(fs.readFileSync(this.configPath, 'utf8')));
  }

  /**
   * Logs in to the AnythingLLM Hub using a connection key.
   * and if successful, saves the connection key to the config file.
   * @returns {Promise<void>}
   */
  async login() {
    const connectionKey = await input.text('Enter your AnythingLLM Hub connection key:');
    if (!connectionKey) throw new Error('Connection key is required');

    const authCheck = await this.authCheck(connectionKey);
    if (!authCheck) throw new Error('Invalid connection key - could not authenticate');
    this.connectionKey = connectionKey;
    this.userInfo = await this.getUserInfo();
    this._saveConfig({ connectionKey, userInfo: this.userInfo });
    console.log('Successfully logged in!');
  }

  /**
   * Logs out of the AnythingLLM Hub.
   * @returns {Promise<void>}
   */
  async logout() {
    this.connectionKey = null;
    this.userInfo = null;
    this._wipeConfig();
    console.log('Successfully logged out!');
  }

  async upload({ type, path: _folderPath }) {
    const folderPath = path.resolve(_folderPath); // Resolve the path to ensure it's absolute
    if (!this.connectionKey) throw new Error('No connection key found - you will need to login first to push to the AnythingLLM Hub');
    if (!this.supportedUploadTypes.includes(type)) throw new Error(`Unsupported upload type: ${type}`);
    if (!folderPath) throw new Error('--path argument is required');
    if (!fs.existsSync(folderPath)) throw new Error(`--path argument was provided but the path does not exist`);
    if (!fs.lstatSync(folderPath).isDirectory()) throw new Error(`--path argument was provided but the path is not a directory`);

    const authCheck = await this.authCheck(this.connectionKey);
    if (!authCheck) throw new Error('Invalid connection key - could not authenticate.');

    if (type === 'agent-skill') return await validateAgentSkill(this, folderPath);
    console.log(`Uploading Complete.`);
  }

  /**
   * Creates a new item in the AnythingLLM Hub.
   * @param {Object} args
   * @param {string} args.type - The type of item to create
   * @param {string} args.output - The path to save the new item to, can be relative to the current working directory
   */
  async newItem({ type, output }) {
    if (!this.supportedUploadTypes.includes(type)) throw new Error(`Unsupported upload type: ${type}`);
    if (!output) throw new Error('--output argument is required');

    const outputFolder = output === '.' ? `my-${type}-${Date.now().toString().slice(-3)}` : output;
    const outputFolderPath = path.resolve(outputFolder);
    const templatePath = path.join(__dirname, `template/${type}`);
    fs.cpSync(templatePath, outputFolderPath, { recursive: true });
    console.log(`New ${type} created at ${outputFolderPath}`);
  }
}

module.exports = AnythingLLMStore;
