import { existsSync } from 'fs';
import { join } from 'path';

class ConfigFileReader {
  readOptions() {
    // eslint-disable-next-line no-undef
    const rootPath = process.cwd();
    const configFilePath = join(rootPath, '.ember-data-erd.js');
    const DEFAULT_OPTIONS = {
      include: null,
      outputFormat: 'png',
    };

    if (!existsSync(configFilePath)) {
      return DEFAULT_OPTIONS;
    }

    // eslint-disable-next-line no-undef
    const userOptions = require(configFilePath);

    return Object.assign(DEFAULT_OPTIONS, userOptions);
  }
}

export default ConfigFileReader;
