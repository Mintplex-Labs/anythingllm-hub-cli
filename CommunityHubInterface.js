const fetch = require('node-fetch');
const fs = require('fs');

class CommunityHubInterface {
  apiBaseDev = "http://127.0.0.1:5001/anythingllm-hub/us-central1/external";
  apiBaseProd = "https://hub.external.anythingllm.com";

  constructor({ debug = false } = {}) {
    this.debug = debug;
    this.apiBase = debug ? this.apiBaseDev : this.apiBaseProd;
  }

  _debugLog(message) {
    if (this.debug) console.log(`[CommunityHubInterface:DEBUG] ${message}`);
  }

  _log(message, ...args) {
    console.log(`[CommunityHubInterface] ${message}`, ...args);
  }

  /**
   * Checks if the connection key is valid.
   * @param {string} connectionKey
   * @returns {Promise<boolean>}
   */
  async authCheck(connectionKey) {
    if (!this.debug) this._log(`Logging into hub.anythingllm.com...`);
    this._debugLog(`Checking auth for connection key against ${new URL(this.apiBase).origin}`);
    return await fetch(`${this.apiBase}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${connectionKey}`
      }
    })
      .then(response => response.ok)
      .catch(error => {
        console.error('Error checking auth:', error);
        return false;
      });
  }

  /**
   * Gets the user info.
   * @returns {Promise<{id: string, username: string, author_url: string}>}
   */
  async getUserInfo() {
    return fetch(`${this.apiBase}/v1/me`, {
      headers: { 'Authorization': `Bearer ${this.connectionKey}` }
    }).then(response => response.json())
      .catch(error => {
        console.error('Error getting user info:', error);
        return null;
      });
  }

  /**
   * Registers a skill with the AnythingLLM Hub.
   * @param {('agent-skill')} entityType - The type of entity to register.
   * @returns {Promise<{signedUrl: string, uri: string, entityId: string, error?: string}>}
   */
  async prepareUpload(entityType, visibility) {
    return fetch(`${this.apiBase}/v1/${entityType}/prepare`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.connectionKey}` },
      body: JSON.stringify({ visibility })
    })
      .then(response => {
        if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
        return response.json();
      })
      .catch(error => {
        console.error('Error preparing upload:', error);
        return { error: error.message };
      });
  }

  /**
   * Uploads a file to the AnythingLLM Hub.
   * @param {Object} uploadResponse - The response from the prepareUpload method.
   * @param {Object} uploadResponse.signedUrl - The signed URL to upload the file to.
   * @param {string} filePath - The path to the file to upload.
   * @returns {Promise<void>}
   */
  async uploadFile({ signedUrl, uri, debug = false }, zipBundlePath) {
    const uploadUrl = new URL(signedUrl);
    if (debug) uploadUrl.searchParams.set('uri', uri);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: fs.readFileSync(zipBundlePath),
      headers: {
        'Content-Type': 'application/zip',
      }
    });
    return response.ok;
  }

  /**
   * Finalizes an upload to the AnythingLLM Hub.
   * @param {('agent-skill')} entityType - The type of entity to finalize.
   * @param {string} entityId - The ID of the entity to finalize.
   * @param {{name: string, description: string, files: {path: string, name: string, size: number, content: string}[]}[]} manifestData - The manifest data to finalize the upload with.
   * @returns {Promise<boolean>}
   */
  async finalizeUpload(entityType, entityId, manifestData) {
    return fetch(`${this.apiBase}/v1/${entityType}/finalize/${entityId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.connectionKey}` },
      body: JSON.stringify(manifestData)
    })
      .then(response => response.ok)
      .catch(error => {
        console.error('Error finalizing upload:', error);
        return false;
      });
  }
}

module.exports = CommunityHubInterface;
