const { camelize } = require('./../utils');
const fs = require('fs');
const path = require('path');

const EMBER_DATA_AND_FRAGMENTS_BASE_CLASSES = Object.freeze([
  'Model',
  'DS.Model',
  'MF.Fragment',
  'Fragment',
]);

/**
 * @description Analize the source code of a file to extract the information
 * required to render the diagram. This Analyzer understands the following
 * syntaxt to define Ember models:

  export default Model.extend({
    firstName: attr(),
    lastName: attr(),
  }

  export default DS.Model.extend({
    firstName: attr(),
    lastName: attr(),
  }

  It does support Model fragments as well.
*/
class ExtendsSyntaxAnalyzer {
  parseSourceCode(modelSourceCode, modelDefinitionsDirectory) {
    const lines = modelSourceCode.split(/\r?\n/);
    const modelData = {
      type: null,
      attributes: [],
      relationships: {
        hasMany: [],
        belongsTo: [],
      },
    };
    this._readModelDataFromCodeLines(
      lines,
      modelData,
      modelDefinitionsDirectory
    );

    return modelData;
  }

  _readModelDataFromCodeLines(
    lines,
    modelData,
    modelDefinitionsDirectory = null,
    checkExtendedClass = true
  ) {
    const modelNameRexp = /(?<=\'|\")(.*?)(?=\'|\")/;
    const importLines = [];

    let baseModelName;

    lines.forEach((line) => {
      if (/\.extend\(/.test(line) && checkExtendedClass) {
        const classExtendTokens = line.match(
          /(?<=default )(.*?)(?=\.extend\()/
        );

        if (classExtendTokens) {
          baseModelName = classExtendTokens[0];

          modelData.type = baseModelName;
        }
      }

      if (/import /.test(line) && checkExtendedClass) {
        importLines.push(line);
      }

      if (/attr/.test(line) && /:/.test(line)) {
        const attributeName = line.split(':')[0].trim();

        modelData.attributes.push(attributeName);
      }

      if (
        (/fragmentArray/.test(line) || /hasMany/.test(line)) &&
        /:/.test(line)
      ) {
        let relationshipName = line.split(':')[0].trim();

        const modelName = line.split(':')[1].match(modelNameRexp);

        if (modelName) {
          relationshipName = modelName[0];
        }

        modelData.relationships.hasMany.push(camelize(relationshipName));
      }

      if ((/fragment/.test(line) || /belongsTo/.test(line)) && /:/.test(line)) {
        let relationshipName = line.split(':')[0].trim();

        const modelName = line.split(':')[1].match(modelNameRexp);

        if (modelName) {
          relationshipName = modelName[0];
        }

        modelData.relationships.belongsTo.push(camelize(relationshipName));
      }
    });

    if (checkExtendedClass && baseModelName) {
      let parentClassDefinitionPath;

      if (!EMBER_DATA_AND_FRAGMENTS_BASE_CLASSES.includes(baseModelName)) {
        for (let importLine of importLines) {
          if (importLine.includes(`${baseModelName} `)) {
            const parentClassImportTokens = importLine.match(
              /(?<=\'|\")(.*?)(?=\'|\")/
            );

            if (parentClassImportTokens) {
              parentClassDefinitionPath = parentClassImportTokens[0];

              break;
            }
          }
        }

        if (parentClassDefinitionPath.includes('models/')) {
          parentClassDefinitionPath = path.parse(
            parentClassDefinitionPath
          ).name;
        }

        const baseModelabsolutePath = path.join(
          modelDefinitionsDirectory,
          `${parentClassDefinitionPath}.js`
        );

        if (fs.existsSync(baseModelabsolutePath)) {
          const baseModelSourceCode = fs.readFileSync(
            baseModelabsolutePath,
            'UTF-8'
          );
          const baseModelLines = baseModelSourceCode.split(/\r?\n/);

          this._readModelDataFromCodeLines(
            baseModelLines,
            modelData,
            modelDefinitionsDirectory
          );
        } else {
          console.log(`Couldn' find base model: ${baseModelabsolutePath}`);
        }
      }
    }

    return modelData;
  }
}

module.exports = ExtendsSyntaxAnalyzer;
