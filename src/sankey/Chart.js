//region Provide / Require
goog.provide('anychart.sankeyModule.Chart');
goog.require('anychart.core.SeparateChart');
goog.require('anychart.data.Set');
//endregion
//region Constructor



/**
 * Sankey chart class.
 * @constructor
 * @extends {anychart.core.SeparateChart}
 */
anychart.sankeyModule.Chart = function() {
  anychart.sankeyModule.Chart.base(this, 'constructor');
  this.setType(anychart.enums.ChartTypes.SANKEY);

  anychart.core.settings.createDescriptorsMeta(this.descriptorsMeta, anychart.sankeyModule.Chart.OWN_DESCRIPTORS_META);
};
goog.inherits(anychart.sankeyModule.Chart, anychart.core.SeparateChart);


//endregion
//region States/Signals
/**
 * Supported signals.
 * @type {number}
 */
anychart.sankeyModule.Chart.prototype.SUPPORTED_SIGNALS = anychart.core.SeparateChart.prototype.SUPPORTED_SIGNALS;


/**
 * Supported consistency states.
 * @type {number}
 */
anychart.sankeyModule.Chart.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.SeparateChart.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.SANKEY_DATA;


//endregion
//region Properties
/**
 * Properties that should be defined in class prototype.
 * @type {!Object.<string, anychart.core.settings.PropertyDescriptor>}
 */
anychart.sankeyModule.Chart.OWN_DESCRIPTORS = (function() {
  /** @type {!Object.<string, anychart.core.settings.PropertyDescriptor>} */
  var map = {};

  anychart.core.settings.createDescriptors(map, [
    [anychart.enums.PropertyHandlerType.SINGLE_ARG, 'nodeWidth', anychart.core.settings.numberOrPercentNormalizer],
    [anychart.enums.PropertyHandlerType.SINGLE_ARG, 'nodePadding', anychart.core.settings.numberNormalizer],
    [anychart.enums.PropertyHandlerType.SINGLE_ARG, 'levels', anychart.core.settings.asIsNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'nodeFill', anychart.core.settings.fillOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'nodeStroke', anychart.core.settings.strokeOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'flowFill', anychart.core.settings.fillOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'flowStroke', anychart.core.settings.strokeOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'dropFill', anychart.core.settings.fillOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'dropStroke', anychart.core.settings.strokeOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'conflictFill', anychart.core.settings.fillOrFunctionNormalizer],
    [anychart.enums.PropertyHandlerType.MULTI_ARG, 'conflictStroke', anychart.core.settings.strokeOrFunctionNormalizer]
  ]);

  return map;
})();
anychart.core.settings.populate(anychart.sankeyModule.Chart, anychart.sankeyModule.Chart.OWN_DESCRIPTORS);


/**
 * Descriptors meta.
 * @type {!Array.<Array>}
 */
anychart.sankeyModule.Chart.OWN_DESCRIPTORS_META = (function() {
  return [
    ['nodeWidth', anychart.ConsistencyState.APPEARANCE | anychart.ConsistencyState.BOUNDS, anychart.Signal.NEEDS_REDRAW],
    ['nodePadding', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['levels', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['nodeFill', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['nodeStroke', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['flowFill', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['flowStroke', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['dropFill', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['dropStroke', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['conflictFill', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
    ['conflictStroke', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW]
  ];
})();


//endregion
//region Data
/**
 * Sets data for sankey chart.
 * @param {?(anychart.data.View|anychart.data.Set|Array|string)=} opt_value Value to set.
 * @param {(anychart.enums.TextParsingMode|anychart.data.TextParsingSettings)=} opt_csvSettings - If CSV string is passed, you can pass CSV parser settings here as a hash map.
 */
anychart.sankeyModule.Chart.prototype.data = function(opt_value, opt_csvSettings) {
  if (goog.isDef(opt_value)) {
    // handle HTML table data
    if (opt_value) {
      var title = opt_value['title'] || opt_value['caption'];
      if (title) this.title(title);
      if (opt_value['rows']) opt_value = opt_value['rows'];
    }

    if (this.rawData_ !== opt_value) {
      this.rawData_ = opt_value;
      goog.dispose(this.data_);
      this.iterator_ = null;
      if (anychart.utils.instanceOf(opt_value, anychart.data.View))
        this.data_ = opt_value.derive();
      else if (anychart.utils.instanceOf(opt_value, anychart.data.Set))
        this.data_ = opt_value.mapAs();
      else
        this.data_ = new anychart.data.Set(
            (goog.isArray(opt_value) || goog.isString(opt_value)) ? opt_value : null, opt_csvSettings).mapAs();
      this.data_.listenSignals(this.dataInvalidated_, this);
      this.invalidate(anychart.ConsistencyState.SANKEY_DATA, anychart.Signal.NEEDS_REDRAW);
    }
  }
};


/**
 * Data invalidation handler.
 * @param {anychart.SignalEvent} e
 * @private
 */
anychart.sankeyModule.Chart.prototype.dataInvalidated_ = function(e) {
  this.invalidate(anychart.ConsistencyState.SANKEY_DATA, anychart.Signal.NEEDS_REDRAW);
};


/**
 * Returns detached iterator.
 * @return {!anychart.data.Iterator}
 */
anychart.sankeyModule.Chart.prototype.getDetachedIterator = function() {
  return this.data_.getIterator();
};


/**
 * Returns new data iterator.
 * @return {!anychart.data.Iterator}
 */
anychart.sankeyModule.Chart.prototype.getResetIterator = function() {
  return this.iterator_ = this.data_.getIterator();
};


/**
 * Returns current data iterator.
 * @return {!anychart.data.Iterator}
 */
anychart.sankeyModule.Chart.prototype.getIterator = function() {
  return this.iterator_ || (this.iterator_ = this.data_.getIterator());
};


/**
 * Checks if value is missing.
 * @param {*} from From value to check.
 * @param {*} to To value to check.
 * @param {*} flow Flow value to check.
 * @return {boolean} Is point missing.
 * @private
 */
anychart.sankeyModule.Chart.prototype.isMissing_ = function(from, to, flow) {
  var valueMissing = !(goog.isNumber(flow) && flow > 0);
  var fromMissing = !(goog.isString(from) && from.length > 0);
  var toMissing = !goog.isNull(to) && !(goog.isString(to) && to.length > 0);
  return valueMissing && fromMissing && toMissing;
};


//endregion
//region Infrastructure
/**
 * @typedef {{
 *   id: (number|undefined),
 *   name: !string,
 *   level: !number,
 *   weight: (number|undefined),
 *   incomeValue: !number,
 *   outcomeValue: !number,
 *   dropoffValue: !number,
 *   incomeNodes: !Array.<anychart.sankeyModule.Chart.Node>,
 *   outcomeNodes: !Array.<anychart.sankeyModule.Chart.Node>,
 *   incomeValues: !Array.<number>,
 *   outcomeValues: !Array.<number>,
 *   dropoffValues: !Array.<number>,
 *   incomeCoords: Array.<{x: number, y1: number, y2: number}>,
 *   outcomeCoords: Array.<{x: number, y1: number, y2: number}>,
 *   conflict: boolean,
 *   top: (number|undefined),
 *   right: (number|undefined),
 *   bottom: (number|undefined),
 *   left: (number|undefined)
 * }}
 */
anychart.sankeyModule.Chart.Node;


/**
 * @typedef {{
 *   nodes: Array.<anychart.sankeyModule.Chart.Node>,
 *   weightsSum: number,
 *   top: number
 * }}
 */
anychart.sankeyModule.Chart.Level;


/**
 * Update node levels
 * @param {anychart.sankeyModule.Chart.Node} fromNode
 */
anychart.sankeyModule.Chart.prototype.shiftNodeLevels = function(fromNode) {
  var toNodes = fromNode.outcomeNodes;
  for (var i = 0; i < toNodes.length; i++) {
    var toNode = toNodes[i];
    if (fromNode.level <= toNode.level) {
      toNode.level = fromNode.level + 1;
      this.shiftNodeLevels(toNode);
    }
  }
};


/**
 * Creates flow.
 * @param {anychart.sankeyModule.Chart.Node} fromNode
 * @param {anychart.sankeyModule.Chart.Node} toNode
 * @param {number} flow
 */
anychart.sankeyModule.Chart.prototype.createFlow = function(fromNode, toNode, flow) {
  fromNode.outcomeValue += flow;
  fromNode.outcomeValues.push(flow);
  fromNode.outcomeNodes.push(toNode);

  toNode.incomeValue += flow;
  toNode.incomeValues.push(flow);
  toNode.incomeNodes.push(fromNode);
  if (fromNode.level >= toNode.level) {
    toNode.level = fromNode.level + 1;
    this.shiftNodeLevels(toNode);
  }
  if (toNode.level > this.lastLevel)
    this.lastLevel = toNode.level;
};


/**
 * Creates drop off flow.
 * @param {anychart.sankeyModule.Chart.Node} fromNodeMeta
 * @param {number} flow
 */
anychart.sankeyModule.Chart.prototype.createDropOffFlow = function(fromNodeMeta, flow) {
  fromNodeMeta.outcomeValue += flow;
  fromNodeMeta.dropoffValue += flow;
  fromNodeMeta.dropoffValues.push(flow);
};


/**
 * Calculate node levels.
 * @private
 */
anychart.sankeyModule.Chart.prototype.calculateLevels_ = function() {
  /** @type {!string} */
  var from;

  /** @type {?string} */
  var to;

  /** @type {number} */
  var flow;

  /**
   * Nodes information by node name.
   * @type {Object.<string, anychart.sankeyModule.Chart.Node>}
   */
  this.nodes = {};

  /**
   * @type {anychart.sankeyModule.Chart.Node}
   */
  var fromNode;

  /**
   * @type {anychart.sankeyModule.Chart.Node}
   */
  var toNode;

  /**
   * Number of the last level.
   * @type {number}
   */
  this.lastLevel = -1;

  var iterator = this.getIterator().reset();
  while (iterator.advance()) {
    from = /** @type {string} */ (iterator.get('from'));
    to = /** @type {string} */ (iterator.get('to'));
    flow = /** @type {number} */ (iterator.get('flow'));
    if (this.isMissing_(from, to, flow))
      continue;

    fromNode = this.nodes[from];
    if (!fromNode) {
      this.nodes[from] = fromNode = {
        name: from,
        level: 0,
        incomeValue: NaN,
        outcomeValue: 0,
        dropoffValue: 0,
        incomeNodes: [],
        outcomeNodes: [],
        incomeValues: [],
        outcomeValues: [],
        dropoffValues: [],
        incomeCoords: [],
        outcomeCoords: [],
        conflict: false
      };
    }
    if (to === null) {
      this.createDropOffFlow(fromNode, flow);
    } else {
      toNode = this.nodes[to];
      if (!toNode) {
        this.nodes[to] = toNode = {
          name: /** @type {!string} */ (to),
          level: -1,
          incomeValue: 0,
          outcomeValue: 0,
          dropoffValue: 0,
          incomeNodes: [],
          outcomeNodes: [],
          incomeValues: [],
          outcomeValues: [],
          dropoffValues: [],
          incomeCoords: [],
          outcomeCoords: [],
          conflict: false
        };
      }
      this.createFlow(fromNode, toNode, flow);
    }
  }
  /**
   * Levels meta.
   * @type {Array.<anychart.sankeyModule.Chart.Level>}
   */
  this.levels = [];

  this.setAsLast = true;
  this.maxLevelWeight = 0;

  /** @type {number} */
  var levelNumber;

  /** @type {anychart.sankeyModule.Chart.Level} */
  var level;

  for (var name in this.nodes) {
    var node = this.nodes[name];

    var outLength = node.outcomeNodes.length + node.dropoffValues.length;

    // place node without outcome nodes at last level
    if (this.setAsLast && !outLength)
      node.level = this.lastLevel;

    // check whether node in confict
    if (node.incomeNodes.length && outLength) {
      node.conflict = (node.incomeValue != node.outcomeValue);
    }

    // first-level node
    if (isNaN(node.incomeValue))
      node.weight = node.outcomeValue;
    // last level node (nor outcome nor dropoff)
    else if (!outLength)
      node.weight = node.incomeValue;
    // other nodes
    else
      node.weight = Math.max(node.incomeValue, node.outcomeValue);

    levelNumber = node.level;
    level = this.levels[levelNumber];
    if (!this.levels[levelNumber]) {
      this.levels[levelNumber] = level = {
        nodes: [],
        weightsSum: 0,
        top: NaN
      };
    }
    level.nodes.push(node);
    level.weightsSum += node.weight;
    // calculating max level weight
    if (level.weightsSum > this.maxLevelWeight) {
      this.maxLevelWeight = level.weightsSum;
    }
  }

  this.maxNodesCount = 0;
  this.maxLevel = 0;
  var linearId = 0;
  for (var i = 0; i < this.levels.length; i++) {
    level = this.levels[i];

    var nodesLength = level.nodes.length;
    if ((level.weightsSum == this.maxLevelWeight) && (nodesLength > this.maxNodesCount)) {
      this.maxNodesCount = nodesLength;
      this.maxLevel = i;
    }
    for (var j = 0; j < nodesLength; j++) {
      level.nodes[j].id = linearId++;
    }
  }
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.calculate = function() {
  if (this.hasInvalidationState(anychart.ConsistencyState.SANKEY_DATA)) {
    this.calculateLevels_();
    this.invalidate(anychart.ConsistencyState.BOUNDS);
    this.markConsistent(anychart.ConsistencyState.SANKEY_DATA);
  }
};


//endregion
//region Interactivity
/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.onInteractivitySignal = function() {

};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.handleMouseOverAndMove = function() {

};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.unhover = function() {

};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.getSeriesStatus = function() {

};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.getAllSeries = function() {
  return [];
};


//endregion
//region Drawing
/**
 * Calculate coords for flows.
 * @param {Array.<number>} values Flow values
 * @param {number} x
 * @param {number} top
 * @return {Array}
 */
anychart.sankeyModule.Chart.prototype.calculateCoords = function(values, x, top) {
  var rv = [];
  for (var i = 0; i < values.length; i++) {
    rv.push({
      x: x,
      y1: top,
      y2: top += values[i] * this.weightAspect
    });
  }
  return rv;
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.drawContent = function(bounds) {
  if (this.isConsistent())
    return;

  // calculates everything that can be calculated from data
  this.calculate();

  this.rootElement.removeChildren();

  var nodePaths = [];
  var flowPaths = [];
  var dropoffPaths = [];

  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    var level;
    var levelsCount = this.levels.length;
    var levelWidth = bounds.width / levelsCount;

    var baseNodePadding = /** @type {number} */ (this.getOption('nodePadding')) || 20;
    var nodeWidth = /** @type {string|number} */ (this.getOption('nodeWidth')) || '12%';
    nodeWidth = anychart.utils.normalizeSize(nodeWidth, levelWidth);
    var dropOffPadding = nodeWidth * 0.3;

    // if we have dropoff on last node we should count it in calculations to show it correctly
    var lastNodeDropOffPadding = this.levels[this.maxLevel].nodes[this.maxNodesCount - 1].dropoffValue ? dropOffPadding : 0;
    this.weightAspect = (bounds.height - (this.maxNodesCount - 1) * baseNodePadding - lastNodeDropOffPadding) / this.maxLevelWeight;

    var nodesPerLevel;
    var levelPadding = baseNodePadding;


    /**
     * Default ascending compare function to sort nodes/values for
     * better user experience on drawing flows.
     * @param {anychart.sankeyModule.Chart.Node} node1
     * @param {anychart.sankeyModule.Chart.Node} node2
     * @return {number}
     */
    var nodeCompareFunction = function(node1, node2) {
      return node1.id - node2.id;
    };

    var i, j;
    for (i = 0; i < this.levels.length; i++) {
      level = this.levels[i];
      nodesPerLevel = level.nodes.length;
      var pixelHeight = level.weightsSum * this.weightAspect;
      lastNodeDropOffPadding = level.nodes[nodesPerLevel - 1].dropoffValue ? dropOffPadding : 0;

      var height = (nodesPerLevel - 1) * levelPadding + pixelHeight + lastNodeDropOffPadding;
      if (height > bounds.height) {
        height = bounds.height;
        levelPadding = (height - pixelHeight - lastNodeDropOffPadding) / (nodesPerLevel - 1);
      }
      level.top = bounds.top + (bounds.height - height) / 2;

      var lastTop = level.top;
      var index;
      for (j = 0; j < level.nodes.length; j++) {
        var node = level.nodes[j];
        var nodeHeight = node.weight * this.weightAspect;

        var path = this.rootElement.path().zIndex(0).fill(null).stroke('black');
        var nodeLeft = (i * levelWidth) + (levelWidth - nodeWidth) / 2;
        var nodeTop = lastTop;
        var nodeRight = nodeLeft + nodeWidth;
        var nodeBottom = nodeTop + nodeHeight;

        node.top = nodeTop;
        node.right = nodeRight;
        node.bottom = nodeBottom;
        node.left = nodeLeft;

        var sortedNodes, sortedValues, k;
        if (!isNaN(node.incomeValue) && node.incomeValue) {
          sortedNodes = Array.prototype.slice.call(node.incomeNodes, 0);
          goog.array.sort(sortedNodes, nodeCompareFunction);
          sortedValues = [];
          for (k = 0; k < sortedNodes.length; k++) {
            index = goog.array.indexOf(node.incomeNodes, sortedNodes[k]);
            sortedValues.push(node.incomeValues[index]);
          }

          node.incomeValues = sortedValues;
          node.incomeNodes = sortedNodes;

          node.incomeCoords = this.calculateCoords(node.incomeValues, nodeLeft, nodeTop);
        }

        if (node.outcomeValue) {
          sortedNodes = Array.prototype.slice.call(node.outcomeNodes, 0);
          goog.array.sort(sortedNodes, nodeCompareFunction);
          sortedValues = [];
          for (k = 0; k < sortedNodes.length; k++) {
            index = goog.array.indexOf(node.outcomeNodes, sortedNodes[k]);
            sortedValues.push(node.outcomeValues[index]);
          }

          node.outcomeValues = sortedValues;
          node.outcomeNodes = sortedNodes;

          node.outcomeCoords = this.calculateCoords(node.outcomeValues, nodeRight, nodeTop);
        }

        path
            .moveTo(nodeLeft, nodeTop)
            .lineTo(nodeRight, nodeTop)
            .lineTo(nodeRight, nodeBottom)
            .lineTo(nodeLeft, nodeBottom)
            .lineTo(nodeLeft, nodeTop)
            .close();

        // just for presentation
        var text = this.rootElement.text().zIndex(1);
        text.text(node.name + '\n' + node.weight);
        var textBounds = text.getBounds();
        var textWidth = textBounds.width;
        var textHeight = textBounds.height;
        var x = nodeLeft + nodeWidth / 2 - textWidth / 2;
        var y = nodeTop + nodeHeight / 2 - textHeight / 2;
        text.x(x).y(y);

        lastTop = nodeBottom + levelPadding;
      }
    }

    var curvy = 0.33 * (bounds.width - nodeWidth) / (this.levels.length - 1);

    for (var name in this.nodes) {
      var fromNode = this.nodes[name];

      var len = fromNode.outcomeNodes.length;
      for (i = 0; i < len; i++) {
        var fromCoords = fromNode.outcomeCoords[i];
        var toNode = fromNode.outcomeNodes[i];

        index = goog.array.findIndex(toNode.incomeNodes, function(item) {
          return item.name == name;
        });
        var toCoords = toNode.incomeCoords[index];

        path = this.rootElement.path().zIndex(1).fill('gray 0.3').stroke(null);
        path
            .moveTo(fromCoords.x, fromCoords.y1)
            .curveTo(fromCoords.x + curvy, fromCoords.y1, toCoords.x - curvy, toCoords.y1, toCoords.x, toCoords.y1)
            .lineTo(toCoords.x, toCoords.y2)
            .curveTo(toCoords.x - curvy, toCoords.y2, fromCoords.x + curvy, fromCoords.y2, fromCoords.x, fromCoords.y2)
            .lineTo(fromCoords.x, fromCoords.y1)
            .close();

        /*path
            .moveTo(fromCoords.x, fromCoords.y1)
            .lineTo(toCoords.x, toCoords.y1)
            .lineTo(toCoords.x, toCoords.y2)
            .lineTo(fromCoords.x, fromCoords.y2)
            .lineTo(fromCoords.x, fromCoords.y1)
            .close();*/
      }

      if (fromNode.dropoffValues.length) {
        x = fromNode.right;
        height = fromNode.dropoffValue * this.weightAspect;
        var y2 = fromNode.bottom;
        var y1 = y2 - height;
        var gradient = {
          angle: -90,
          keys: [
            {color: 'red', offset: 0},
            {color: 'white', offset: 1}
          ]
        };
        path = this.rootElement.path().zIndex(1).fill(gradient).stroke(null);

        path
            .moveTo(x, y1)
            .arcTo(nodeWidth / 2, height, -90, 90)
            .lineTo(x + nodeWidth / 4, y2 + dropOffPadding)
            // .lineTo(x, y2 + 0.3 * height)
            .lineTo(x, y2)
            .close();
      }
    }

    console.log(this.levels);
    console.log(this.nodes);

    this.markConsistent(anychart.ConsistencyState.BOUNDS);
  }


  if (this.hasInvalidationState(anychart.ConsistencyState.APPEARANCE)) {
    //
    this.markConsistent(anychart.ConsistencyState.APPEARANCE);
  }
};


//endregion
//region Serialize / Setup / Dispose
/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.serialize = function() {
  var json = anychart.sankeyModule.Chart.base(this, 'serialize');
  anychart.core.settings.serialize(this, anychart.sankeyModule.Chart.OWN_DESCRIPTORS, json);
  return json;
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.setupByJSON = function(config, opt_default) {
  anychart.sankeyModule.Chart.base(this, 'setupByJSON', config, opt_default);
  anychart.core.settings.deserialize(this, anychart.sankeyModule.Chart.OWN_DESCRIPTORS, config, opt_default);
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.disposeInternal = function() {
  goog.disposeAll();
  anychart.sankeyModule.Chart.base(this, 'disposeInternal');
};


//endregion
//region Exports
//exports
(function() {
  var proto = anychart.sankeyModule.Chart.prototype;
})();
//endregion
