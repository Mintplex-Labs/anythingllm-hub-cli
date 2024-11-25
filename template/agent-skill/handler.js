// Documentation: https://docs.anythingllm.com/agent/custom/introduction

/**
 * @typedef {Object} AnythingLLM
 * @property {{[key: string]: any}} runtimeArgs - Contains runtime arguments passed to the agent skill @link {https://docs.anythingllm.com/agent/custom/handler-js#available-runtime-properties-and-methods}
 * @property {('docker'|'desktop')} runtime - The runtime environment.
 * @property {import('./plugin.json')} config - your plugin's config
 * @property {function(string|Error): void} logger - Logging function
 * @property {function(string): void} introspect - Print a string to the UI while agent skill is running
 * @property {{getLinkContent: function(url): Promise<{success: boolean, content: string}>}} webScraper - Scrape a website easily to bypass user-agent restrictions.
 */

/** @type {AnythingLLM} */
module.exports.runtime = {
  /**
   * @param {import('./plugin.json')['entrypoint']['params']} args - Arguments passed to the agent skill - defined in plugin.json
   */
  handler: async function (args = {}) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      // Developer note:
      // 1. You can use the args object to process in any data you need to the agent skill - this is coming from the LLM when the agent skill is called
      // 2. You should _ALWAYS_ return a string from the handler function. This is the output passed back to the LLM.
      // 3. Agents execute in a NodeJS environment so you have access to all the built in Node modules
      // 4. If you require a library, then you need to manually include it as an import at the top of the file or via local node_modules folder in the plugin folder
      //    this functionality is experimental and will include the entire node_modules folder in the plugin zip file.

      // Do something here!
      // Fetch data from an API
      // Do some processing
      // **if on desktop** access OS level APIs
      // ...

      return "Agent skill executed successfully.";
    } catch (e) {
      this.logger(e)
      this.introspect(
        `${callerId} failed to execute. Reason: ${e.message}`
      );
      return `Failed to execute agent skill. Error ${e.message}`;
    }
  }
};