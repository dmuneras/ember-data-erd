'use strict';

const execa = require('execa');

module.exports = {
  name: require('./package').name,

  works: 'insideProject',

  includedCommands() {
    return {
      'erd:generate': {
        name: 'erd:generate',
        works: 'insideProject',
        description: 'Generates ERD diagram from Ember data models',
        availableOptions: [],

        run() {
          console.log(`\nGENERATING DIAGRAM...\n`);

          const { stdout } = execa.sync('node', [
            './node_modules/ember-data-erd/bin/generate-diagram.js',
          ]);

          console.log(stdout);
        },
      },
    };
  },
};
