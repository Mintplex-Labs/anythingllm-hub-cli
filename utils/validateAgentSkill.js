const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const input = require('input');
const archiver = require('archiver');
const ALLOWED_EXTENSIONS = ['js', 'json', 'txt', 'md'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'package.json'];
const PLUGIN_JSON_FIELDS = {
  'hubId': {
    default: null,
    validate: function () {
      return this.default;
    }
  },
  'active': {
    default: false,
    validate: function () {
      return this.default;
    }
  },
  'name': {
    default: null,
    validate: async function ({ name }) {
      if (!name) {
        const newName = await input.text('Please enter a name for the skill:');
        if (!newName) throw new Error('Name is required');
        return newName;
      }
      return name;
    }
  },
  'version': {
    default: '0.0.1',
    validate: function ({ version }) {
      if (!version) return this.default;
      return version;
    }
  },
  'description': {
    default: null,
    validate: async function ({ description }) {
      if (!description) {
        const newDescription = await input.text('Please enter a description for the skill:');
        if (!newDescription) throw new Error('Description is required');
        return newDescription;
      }
      return description;
    }
  },
  'author': {
    default: null,
    validate: function ({ author }) {
      if (!author) return this.default;
      return author;
    }
  },
  'author_url': {
    default: null,
    validate: function ({ author_url }) {
      if (!author_url) return this.default;
      return author_url;
    }
  },
  'license': {
    default: null,
    validate: async function ({ license }) {
      if (!license) {
        const newLicense = await input.select('Please select a license for the skill:', ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Other']);
        if (!newLicense) throw new Error('License is required');
        return newLicense;
      }
      return license;
    }
  },
  'examples': {
    default: [],
    validate: async function ({ examples }) {
      if (!examples || !examples.length) {
        const skip = await input.confirm('No examples provided - providing examples is highly recommended and will help LLMs understand how to use the skill. Continue without examples?');
        if (skip) return this.default;
        throw new Error('Exited by user interrupt');
      }
      return examples;
    }
  },
  'entrypoint': {
    default: {
      file: 'handler.js',
      params: {}
    },
    validate: function ({ entrypoint }) {
      if (!entrypoint) return this.default;
      if (entrypoint.file !== this.default.file) throw new Error('Entrypoint file must be handler.js');
      if (entrypoint.params && typeof entrypoint.params !== 'object') throw new Error('Entrypoint params must be an object');
      return { file: entrypoint.file, params: entrypoint.params || {} };
    }
  }
};

function createArchive(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream)
      ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}


/**
 * Validates an agent skill.
 * @param {import('../AnythingLLMStore')} store - The AnythingLLMStore instance.
 * @param {string} pathToSkillFolder - The path to the skill folder (resolved to an absolute path)
 * @returns {Promise<void>}
 */
async function validateAgentSkill(store, agentSkillFolder) {
  const validFiles = await validateFiles(store, agentSkillFolder);
  console.log(`Found ${validFiles.length} valid files in current directory`);
  const pluginData = validFiles.find(file => file.name === 'plugin.json').content;

  console.log(`--------------------------------
Agent Skill: ${pluginData.name} v${pluginData.version} by @${pluginData.author}
Contains ${validFiles.length} files.
--------------------------------
`)
  const upload = await input.confirm('Would you like to upload this skill to the AnythingLLM Hub?');
  if (!upload) throw new Error('Exited by user interrupt');

  console.log('Registering skill with AnythingLLM Hub...');
  const visibility = await input.select('Do you want this skill to be visible to all users (public), or only you and teams you share it with (private)?', ['public', 'private']);

  const uploadResponse = await store.prepareUpload('agent-skill', visibility);
  if (uploadResponse.error) throw new Error(uploadResponse.error);
  console.log('Acquired registration ID:', uploadResponse.entityId);

  // Update plugin.json with the registration ID and set active to false
  // and prepare for upload by stringifying the object
  pluginData.hubId = uploadResponse.entityId;
  pluginData.active = false;
  validFiles.find(file => file.name === 'plugin.json').content = JSON.stringify(pluginData, null, 2);

  console.log('Creating build directory');
  let outputPath;
  const tempDir = path.join(process.cwd(), uploadResponse.entityId);
  try {
    fs.mkdirSync(tempDir);
    for (const file of validFiles) {
      if (file.name === 'node_modules') {
        console.log(`>>> Copying ${file.name}...`);
        fs.cpSync(path.join(agentSkillFolder, file.name), path.join(tempDir, file.name), { recursive: true });
      } else {
        console.log(`>>> Copying ${file.name}...`);
        fs.writeFileSync(path.join(tempDir, file.name), file.content, { encoding: 'utf8' });
      }
    }

    outputPath = path.join(process.cwd(), `${uploadResponse.entityId}.zip`);
    console.log('Creating archive...');
    await createArchive(tempDir, outputPath);

    console.log('Uploading archive...');
    const ok = await store.uploadFile({ signedUrl: uploadResponse.signedUrl, uri: uploadResponse.uri, debug: store.debug }, outputPath);
    if (!ok) throw new Error('Failed to upload archive');

    console.log('Finalizing the upload...');
    const finalizeResponse = await store.finalizeUpload(
      'agent-skill',
      uploadResponse.entityId,
      {
        name: pluginData.name,
        description: pluginData.description,
        files: validFiles
      }
    );
    if (!finalizeResponse) throw new Error('Failed to finalize the upload');
    console.log(`🎉 Agent skill uploaded! You can find your skill at https://hub.anythingllm.com/i/agent-skill/${uploadResponse.entityId}`);
  } catch (error) {
    console.error('Error creating build directory:', error);
    throw new Error(`Error creating build directory: ${error.message}`);
  } finally {
    // Delete the temp directory
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    if (!!outputPath && fs.existsSync(outputPath)) fs.rmSync(outputPath);
  }
}

async function validateFiles(store, agentSkillFolder) {
  const validFiles = [];
  const parentFolder = path.basename(agentSkillFolder);
  const requiredFiles = ['handler.js', 'plugin.json'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(agentSkillFolder, file)));
  if (missingFiles.length > 0) throw new Error(`The following required files are missing from the agent skill folder: ${missingFiles.join(', ')}`);

  for (const file of requiredFiles) {
    const content = fs.readFileSync(path.join(agentSkillFolder, file), 'utf8');
    if (file === 'handler.js') {
      try {
        acorn.parse(content, { ecmaVersion: 2020, allowReturnOutsideFunction: false, allowHashBang: false, allowAwaitOutsideFunction: false });
        validFiles.push({
          content,
          path: path.join(agentSkillFolder, file).replace(process.cwd(), parentFolder),
          size: fs.statSync(path.join(agentSkillFolder, file)).size,
          name: file
        });
        console.log(`✅ ${file} is valid.`);
      } catch (error) {
        throw new Error(`Error parsing ${file}: ${error.message}`);
      }
    }

    if (file === 'plugin.json') {
      try {
        const pluginData = {}
        const fileData = JSON.parse(content);
        for (const key in PLUGIN_JSON_FIELDS) {
          pluginData[key] = await PLUGIN_JSON_FIELDS[key].validate({
            ...fileData,
            author: store.userInfo.username,
            author_url: store.userInfo.author_url
          });
        }

        validFiles.push({
          content: pluginData,
          path: path.join(agentSkillFolder, file).replace(process.cwd(), parentFolder),
          size: fs.statSync(path.join(agentSkillFolder, file)).size,
          name: file
        });
        console.log(`✅ ${file} is valid.`);
      } catch (error) {
        throw new Error(`Error parsing ${file}: ${error.message}`);
      }
    }
  }

  fs.readdirSync(agentSkillFolder).forEach(file => {
    if (
      requiredFiles.includes(file) ||
      IGNORED_FILES.includes(file) ||
      (fs.lstatSync(path.join(agentSkillFolder, file)).isDirectory() && file !== 'node_modules')
    ) return;

    if (fs.lstatSync(path.join(agentSkillFolder, file)).isDirectory() && file === 'node_modules') {
      console.log(`✅ Found node_modules directory - it will be bundled with the skill`);
      validFiles.push({
        name: 'node_modules',
        content: "# Node modules imported by this skill:\n" + fs.readdirSync(path.join(agentSkillFolder, file)).map(file => file).join('\n'),
        path: path.join(agentSkillFolder, file).replace(process.cwd(), parentFolder),
        size: fs.statSync(path.join(agentSkillFolder, file)).size,
      });
      return;
    }

    const extension = path.extname(file).slice(1);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      console.warn(`⚠️ ${file} has an unsupported file extension: ${extension} - it will be ignored`);
    } else {
      console.log(`✅ ${file} is valid.`);
      validFiles.push({
        content: fs.readFileSync(path.join(agentSkillFolder, file), 'utf8'),
        path: path.join(agentSkillFolder, file).replace(process.cwd(), parentFolder),
        size: fs.statSync(path.join(agentSkillFolder, file)).size,
        name: file
      });
    }
  });

  return validFiles;
}

module.exports = validateAgentSkill;
