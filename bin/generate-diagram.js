/*
  Main file to execute the diagram generator, this is require because
  Ember somehow is blocking spawn from forking in inner child processes,
  which blocks Graphviz from executing its logic.
*/

const DiagramGenerator = require('../lib/generators/erd-generator');
const ConfigFileReader = require('../lib/config-reader');
const configFileReader =  new ConfigFileReader();
const options = configFileReader.readOptions();
const generator = new DiagramGenerator(options);

generator.generateDiagram();
