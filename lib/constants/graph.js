const DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS = Object.freeze({
  color: '#4682B4',
  taillabel: '1',
  headlabel: '*',
  arrowhead: 'vee',
  arrowtail: 'none',
  labeldistance: '1',
  fontsize: '10',
  arrowsize: '0.6',
});

const DEFAULT_BELONGS_TO_GRAPH_OPTIONS = Object.freeze({
  taillabel: '1',
  headlabel: '1',
  arrowhead: 'vee',
  arrowtail: 'none',
  labeldistance: '1',
  fontsize: '10',
  arrowsize: '0.6',
});

const DEFAULT_GRAPH_OPTIONS = Object.freeze({
  orientation: 'TB',
  overlap: false,
  esep: '10',
  concentrate: false,
});

export default {
  DEFAULT_HAS_MANY_GRAPH_TO_OPTIONS,
  DEFAULT_BELONGS_TO_GRAPH_OPTIONS,
  DEFAULT_GRAPH_OPTIONS,
};
