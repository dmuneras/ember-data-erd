const fs = require('fs');
const path = require('path');

class ConfigFileReader {
  readOptions() {
    const rootPath = process.cwd();
    const configFilePath = path.join(rootPath, '.ember-data-erd.js');
    const DEFAULT_OPTIONS = {
      include: null,
      outputFormat: 'png',
    };

    if (!fs.existsSync(configFilePath)) {
      return DEFAULT_OPTIONS;
    }

    const userOptions = require(configFilePath);

    return Object.assign(DEFAULT_OPTIONS, userOptions);
  }
}

module.exports = ConfigFileReader;
