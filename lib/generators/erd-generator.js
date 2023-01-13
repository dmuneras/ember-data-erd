import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { singularize } from 'inflection';
import { digraph } from 'graphviz';
import { camelize } from '../utils';
import ExtendsSyntaxAnalyzer from '../analyzers/extends-syntax';
import NativeJsClassAnalyzer from '../analyzers/native-js-class';
import {
  DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS,
  DEFAULT_BELONGS_TO_GRAPH_OPTIONS,
  DEFAULT_GRAPH_OPTIONS,
} from '../constants/graph';

/**
 * @description Generates a Entity Relationship diagram by reading the
 * source code and creating a Graph that Graphviz can render.
 */
class ErdGenerator {
  constructor(options) {
    this.options = options || {};
    this.directory = this.options.directory || 'app/models/';
    // eslint-disable-next-line no-undef
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
    const modelDefinitionsDirectory = join(mainDirectory, directory);
    const modelFileDefinitions = readdirSync(modelDefinitionsDirectory);
    const models = {};

    for (let i = 0; i < modelFileDefinitions.length; i++) {
      if (/\.js/.test(modelFileDefinitions[i])) {
        const modelName = camelize(modelFileDefinitions[i].split('.')[0]);

        if (options.include && !options.include.includes(modelName)) {
          continue;
        }

        const file = `${directory}${modelFileDefinitions[i]}`;

        try {
          const filePath = join(mainDirectory, file);
          const modelSourceCode = readFileSync(filePath, 'UTF-8');
          const analyzer = this._getModelAnalyzer(modelSourceCode);

          models[modelName] = analyzer.parseSourceCode(
            modelSourceCode,
            modelDefinitionsDirectory
          );
        } catch (err) {
          console.log(`🔴  There was an error parsing the source code`);
          console.error(err);
        }
      }
    }

    return models;
  }

  createGraph() {
    const graph = digraph('G');
    const defaultOptions = Object.assign({}, DEFAULT_GRAPH_OPTIONS);
    const graphOptions = Object.assign(defaultOptions, this.options.graphviz);

    this._applyOptions(graph, graphOptions);
    this._addNodes(graph);
    this._addEdges(graph);

    return graph;
  }

  renderGraph() {
    const diagramsFolderRelativePath =
      this.options.diagramsFolder || 'diagrams';
    const diagramsFolder = `${this.absolutePath}/${diagramsFolderRelativePath}`;

    if (!existsSync(diagramsFolder)) {
      mkdirSync(diagramsFolder);
    }

    const { outputFormat } = this.options;

    console.log(`\n🛠️   Exporting to ${outputFormat}`);

    this.graph.render(
      outputFormat,
      function (render) {
        const filePath = join(diagramsFolder, `erd-diagram.${outputFormat}`);

        console.log('\n✅  Diagram exported!');
        console.log(`|---> ${filePath}`);

        writeFileSync(filePath, render);
      },
      function (code, out, err) {
        console.log(`🔴  There was an error rendering the diagram`);
        console.log(code, out, err);
      }
    );
  }

  _getModelAnalyzer(modelSourceCode) {
    const NATIVE_CLASS_SYNTAX_KEYWORD_PATTERN =
      /class[\s]+(.*)[\s]+(extends{1})[\s]+(.*)[{]{1}/;

    if (modelSourceCode.match(NATIVE_CLASS_SYNTAX_KEYWORD_PATTERN)) {
      return new NativeJsClassAnalyzer();
    }
    return new ExtendsSyntaxAnalyzer();
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
          relatedModelName = singularize(relatedModelName);

          relatedModelNode = graph.getNode(relatedModelName);
        }

        if (relatedModelNode) {
          const relatedModelHasManyRelationships =
            models[relatedModelName].relationships.hasMany;
          const isBidirectional = !!relatedModelHasManyRelationships.find(
            (relationship) => {
              return relationship === modelName || singularize(modelName);
            }
          );

          if (isBidirectional) {
            const edgeId = `${relatedModelName}-has-many-${modelName}`;
            const relationshipEdge = graph.edges.find((edge) => {
              return edge.get('id') === edgeId;
            });

            if (relationshipEdge) {
              // Direction both doesn't seem to be supported
              // https://graphviz.org/doc/info/attrs.html#k:dirType
              relationshipEdge.set('dir', 'none');
              relationshipEdge.set('headlabel', '*');
              relationshipEdge.set('taillabel', '*');

              continue;
            }
          }

          const relationship = graph.addEdge(
            currentModelNode,
            relatedModelNode
          );

          relationship.set('id', `${modelName}-has-many-${relatedModelName}`);

          this._applyOptions(relationship, DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS);

          if (isBidirectional) {
            // Direction both doesn't seem to be supported
            // https://graphviz.org/doc/info/attrs.html#k:dirType
            relationship.set('dir', 'none');
            relationship.set('headlabel', '*');
            relationship.set('taillabel', '*');
          }
        } else {
          console.log(
            `Missing model ${modelName} has many ${relatedModelNode}`
          );
        }
      }

      for (let relatedModelName of modelInfo.relationships.belongsTo) {
        if (options.include && !options.include.includes(relatedModelName)) {
          continue;
        }
        const relatedModelNameBelongsToRelationships =
          models[relatedModelName].relationships.belongsTo;
        const isBidirectional = !!relatedModelNameBelongsToRelationships.find(
          (relationship) => {
            return relationship === modelName;
          }
        );

        if (isBidirectional) {
          const edgeId = `${relatedModelName}-belongs-to-${modelName}`;
          const relationshipEdge = graph.edges.find((edge) => {
            return edge.get('id') === edgeId;
          });

          if (relationshipEdge) {
            // Direction both doesn't seem to be supported
            // https://graphviz.org/doc/info/attrs.html#k:dirType
            relationshipEdge.set('dir', 'none');
            relationshipEdge.set('headlabel', '1');
            relationshipEdge.set('taillabel', '1');

            continue;
          }
        }

        let relatedModelNode = graph.getNode(relatedModelName);

        if (relatedModelNode) {
          const relationship = graph.addEdge(
            currentModelNode,
            relatedModelNode
          );

          relationship.set('id', `${modelName}-belongs-to-${relatedModelName}`);

          this._applyOptions(relationship, DEFAULT_BELONGS_TO_GRAPH_OPTIONS);

          if (isBidirectional) {
            // Direction both doesn't seem to be supported
            // https://graphviz.org/doc/info/attrs.html#k:dirType
            relationship.set('dir', 'none');
            relationship.set('headlabel', '*');
            relationship.set('taillabel', '*');
          }
        } else {
          console.log(
            `Missing  model:  ${modelName} belongs to ${relatedModelNode}`
          );
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
        nodeTitle = `${modelName} (${modelInfo.type})`;
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
        shape: 'Mrecord',
      });
    }
  }

  _applyOptions(object, options) {
    for (let option in options) {
      object.set(option, options[option]);
    }
  }
}

export default ErdGenerator;
