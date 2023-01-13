/*
  Main file to execute the diagram generator, this is require because
  Ember somehow is blocking spawn from forking in inner child processes,
  which blocks Graphviz from executing its logic.
*/

import DiagramGenerator from '../lib/generators/erd-generator';
import ConfigFileReader from '../lib/config-reader';
const configFileReader = new ConfigFileReader();
const options = configFileReader.readOptions();
const generator = new DiagramGenerator(options);

generator.generateDiagram();
