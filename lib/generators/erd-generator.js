const fs = require('fs');
const path = require('path');
const inflection = require('inflection');
const graphviz = require('graphviz');
const { camelize } = require('../utils');
const ExtendsSyntaxAnalyzer = require('../analyzers/extends-syntax');
const {
  DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS,
  DEFAULT_BELONGS_TO_GRAPH_OPTIONS,
  DEFAULT_GRAPH_OPTIONS
} = require('../constants/graph');

/**
 * @description Generates a Entity Relationship diagram by reading the
 * source code and creating a Graph that Graphviz can render.
 */
class ErdGenerator {
  constructor(options) {
    this.options = options || {};
    this.directory = this.options.directory || 'app/models/';
    this.absolutePath = process.cwd();
  }

  generateDiagram() {
    this.parsedModels = this.readSourceCode();
    this.graph = this.createGraph();

    this.renderGraph();
  }

  readSourceCode() {
    const { absolutePath: mainDirectory, options } = this;
    const directory = 'app/models/';
    const modelDefinitionsDirectory = path.join(mainDirectory, directory);
    const modelFileDefinitions = fs.readdirSync(modelDefinitionsDirectory);
    const models = {};
    const analyzer = new ExtendsSyntaxAnalyzer();

    for (let i = 0; i < modelFileDefinitions.length; i++) {
      if (/\.js/.test(modelFileDefinitions[i])) {
        const modelName = camelize(modelFileDefinitions[i].split('.')[0]);

        if (options.include && !options.include.includes(modelName)) {
          continue;
        }

        const file = `${directory}${modelFileDefinitions[i]}`;

        try {
          const filePath = path.join(mainDirectory, file);
          const modelSourceCode = fs.readFileSync(filePath, 'UTF-8');

          models[modelName] = analyzer.parseSourceCode(modelSourceCode, modelDefinitionsDirectory);
        } catch (err) {
          console.log(`🔴  There was an error parsing the source code`);
          console.error(err);
        }
      }
    }

    return models;
  }

  createGraph() {
    const graph = graphviz.digraph('G');

    this._applyOptions(graph, DEFAULT_GRAPH_OPTIONS);
    this._addNodes(graph);
    this._addEdges(graph);

    return graph;
  }

  renderGraph() {
    const diagramsFolderRelativePath = this.options.diagramsFolder || 'diagrams';
    const diagramsFolder = `${this.absolutePath}/${diagramsFolderRelativePath}`;

    if (!fs.existsSync(diagramsFolder)) {
      fs.mkdirSync(diagramsFolder);
    }

    const { outputFormat }  = this.options;

    console.log(`\n🛠️   Exporting to ${outputFormat}`);

    this.graph.render(outputFormat, function (render) {
      const filePath = path.join(diagramsFolder, `erd-diagram.${outputFormat}`);

      console.log('\n✅  Diagram exported!');
      console.log(`|---> ${filePath}`);

      fs.writeFileSync(filePath, render);
    }, function(code, out, err) {
      console.log(`🔴  There was an error rendering the diagram`);
      console.log(code, out, err);
    });
  }

  _addEdges(graph) {
    const { parsedModels: models, options } = this;

    for (let modelName in models) {
      const modelInfo = models[modelName];
      const currentModelNode = graph.getNode(modelName);

      for (let relatedModelName of modelInfo.relationships.hasMany) {
        if (options.include && !options.include.includes(relatedModelName)) {
          continue;
        }

        let relatedModelNode = graph.getNode(relatedModelName);

        if (!relatedModelNode) {
          relatedModelName = inflection.singularize(
            relatedModelName
          );

          relatedModelNode = graph.getNode(relatedModelName);
        }

        if (relatedModelNode) {
          const relatedModelHasManyRelationships = models[relatedModelName].relationships.hasMany;
          const isBidirectional = !!relatedModelHasManyRelationships.find((relationship) => {
            return relationship === modelName
          });

          if (isBidirectional) {
            const edgeId = `${relatedModelName}-has-many-${modelName}`
            const relationshipEdge = graph.edges.find((edge) =>  {
              return edge.get('id') === edgeId;
            });


            if (relationshipEdge) {
              relationshipEdge.set('dir', 'both');

              continue;
            }
          }

          const relationship = graph.addEdge(currentModelNode, relatedModelNode);

          relationship.set('id', `${modelName}-has-many-${relatedModelName}`);

          this._applyOptions(relationship, DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS);

          if (isBidirectional) {
            relationship.set('dir', 'both');
          }
        } else {
          console.log(`Missing model ${modelName} has many ${relatedModelNode}`);
        }
      }

      for (let relatedModelName of modelInfo.relationships.belongsTo) {
        if (options.include && !options.include.includes(relatedModelName)) {
          continue;
        }
        const relatedModelNameBelongsToRelationships = models[relatedModelName].relationships.belongsTo;
        const isBidirectional = !!relatedModelNameBelongsToRelationships.find((relationship) => {
          return relationship === modelName
        });

        if (isBidirectional) {
          const edgeId = `${relatedModelName}-belongs-to-${modelName}`
          const relationshipEdge = graph.edges.find((edge) =>  {
            return edge.get('id') === edgeId;
          });


          if (relationshipEdge) {
            relationshipEdge.set('dir', 'both');

            continue;
          }
        }

        let relatedModelNode = graph.getNode(relatedModelName);

        if (relatedModelNode) {
          const relationship = graph.addEdge(currentModelNode, relatedModelNode);

          relationship.set('id', `${modelName}-belongs-to-${relatedModelName}`);

          this._applyOptions(relationship, DEFAULT_BELONGS_TO_GRAPH_OPTIONS);

          if (isBidirectional) {
            relationship.set('dir', 'both');
          }
        } else {
          console.log(`Missing  model:  ${modelName} belongs to ${relatedModelNode}`);
        }
      }
    }
  }

  _addNodes(graph) {
    const { parsedModels: models } = this;

    for (let modelName in models) {
      const modelInfo = models[modelName];
      let nodeTitle = modelName;

      if (modelInfo.type) {
        nodeTitle = `${modelName} (${modelInfo.type})`
      }

      let nodeContent = `${nodeTitle}|{`;

      const { attributes } = modelInfo;

      for (let index = 0; index < attributes.length; index++) {
        if (index === 0) {
          const attribute = modelInfo.attributes[index];

          nodeContent += attribute;

          continue;
        }

        const attribute = modelInfo.attributes[index];

        nodeContent += `|${attribute}`;
      }

      nodeContent += '}';

      graph.addNode(modelName, {
        id: modelName,
        label: nodeContent,
        color: 'black',
        shape: 'Mrecord'
      });
    }
  }

  _applyOptions(object, options) {
    for (let option in options) {
      object.set(option, options[option]);
    }
  }
}

module.exports = ErdGenerator;
