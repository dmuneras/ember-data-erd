const { camelize } = require('./../utils');
const fs = require('fs');
const path = require('path');

class NativeJsClassAnalyzer {
  parseSourceCode(modelSourceCode, modelDefinitionsDirectory) {
    const lines = modelSourceCode.split(/\r?\n/);
    const modelData = {
      type: null,
      attributes: [],
      relationships: {
        hasMany: [],
        belongsTo: []
      }
    };

    this._readModelDataFromCodeLines(lines, modelData, modelDefinitionsDirectory);

    return modelData;
  }

  _readModelDataFromCodeLines(lines, modelData, modelDefinitionsDirectory = null, checkExtendedClass = true) {
    const modelNameRexp = /(?<=\'|\")(.*?)(?=\'|\")/;
    const importLines = [];

    let baseModelName;

    lines.forEach((line, index) => {
      if (/\.extend /.test(line) && checkExtendedClass) {
        const classExtendTokens = line.match(/(?<=default )(.*?)(?=\.extend\()/);

        if (classExtendTokens) {
          baseModelName = classExtendTokens[0]

          modelData.type = baseModelName;
        }
      }

      if (/import /.test(line) && checkExtendedClass) {
        importLines.push(line);
      }

      if (/@attr/.test(line)) {
        let attributeName = line.trim().match(/(@attr(.*)|@attr)\s(.*);/)[3]

        if (!attributeName) {
          attributeName = lines[index+1].trim();
        }

        modelData.attributes.push(attributeName);
      }

      if (/@hasMany/.test(line) || /@fragmentArray/.test(line)) {
        const relationshipDefinitionTokens = line.trim().match(modelNameRexp);

        let relationshipName;

        if (relationshipDefinitionTokens) {
          relationshipName = relationshipDefinitionTokens[0];
        } else {
          relationshipName = line.trim().split(' ')[1];
        }

        if (!relationshipName) {
          relationshipName = lines[index+1].trim();
        }

        if (relationshipName) {
          relationshipName = relationshipName.replace(';','');
          modelData.relationships.hasMany.push(camelize(relationshipName));
        }
      }

      if (/@belongsTo/.test(line) || /@fragment/.test(line)) {
        const relationshipDefinitionTokens = line.trim().match(modelNameRexp);

        let relationshipName;

        if (relationshipDefinitionTokens) {
          relationshipName = relationshipDefinitionTokens[0];
        } else {
          relationshipName = line.trim().split(' ')[1];
        }

        if (!relationshipName) {
          relationshipName = lines[index+1].trim();
        }

        if (relationshipName) {
          relationshipName = relationshipName.replace(';','');
          modelData.relationships.belongsTo.push(camelize(relationshipName));
        }
      }
    });

    if (checkExtendedClass && baseModelName) {
      let parentClassDefinitionPath;

      if (!EMBER_DATA_AND_FRAGMENTS_BASE_CLASSES.includes(baseModelName)) {
        for (let importLine of importLines) {
          if (importLine.includes(`${baseModelName} `)) {
            const parentClassImportTokens = importLine.match(/(?<=\'|\")(.*?)(?=\'|\")/);

            if (parentClassImportTokens) {
              parentClassDefinitionPath = parentClassImportTokens[0];
            }
          }
        }

        const baseModelabsolutePath = path.join(modelDefinitionsDirectory, `${parentClassDefinitionPath}.js`);

        if (fs.existsSync(baseModelabsolutePath)) {
          const baseModelSourceCode = fs.readFileSync(baseModelabsolutePath, 'UTF-8');
          const baseModelLines = baseModelSourceCode.split(/\r?\n/);

          this._readModelDataFromCodeLines(baseModelLines, modelData, modelDefinitionsDirectory);
        } else {
          console.log(`Couldn' find base model: ${baseModelabsolutePath}`);
        }
      }
    }

    return modelData;
  }
}

module.exports = NativeJsClassAnalyzer;
