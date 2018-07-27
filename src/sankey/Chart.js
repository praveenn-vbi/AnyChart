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
    ['nodeWidth', anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW],
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
 *   name: !string,
 *   level: !number,
 *   incomeValue: !number,
 *   outcomeValue: !number,
 *   incomeNodes: !Array.<anychart.sankeyModule.Chart.NodeMeta>,
 *   outcomeNodes: !Array.<anychart.sankeyModule.Chart.NodeMeta>,
 *   incomeValues: !Array.<number>,
 *   outcomeValues: !Array.<number>,
 *   dropoffValues: !Array.<number>,
 *   conflict: boolean
 * }}
 */
anychart.sankeyModule.Chart.NodeMeta;


/**
 * Update node levels
 * @param {anychart.sankeyModule.Chart.NodeMeta} fromNodeMeta
 */
anychart.sankeyModule.Chart.prototype.shiftNodeLevels = function(fromNodeMeta) {
  var toNodes = fromNodeMeta.outcomeNodes;
  for (var i = 0; i < toNodes.length; i++) {
    var toNodeMeta = toNodes[i];
    if (fromNodeMeta.level <= toNodeMeta.level) {
      toNodeMeta.level = fromNodeMeta.level + 1;
      this.shiftNodeLevels(toNodeMeta);
    }
  }
};


/**
 * Creates flow.
 * @param {anychart.sankeyModule.Chart.NodeMeta} fromNodeMeta
 * @param {anychart.sankeyModule.Chart.NodeMeta} toNodeMeta
 * @param {number} flow
 */
anychart.sankeyModule.Chart.prototype.createFlow = function(fromNodeMeta, toNodeMeta, flow) {
  fromNodeMeta.outcomeValue += flow;
  fromNodeMeta.outcomeValues.push(flow);
  fromNodeMeta.outcomeNodes.push(toNodeMeta);

  toNodeMeta.incomeValue += flow;
  toNodeMeta.incomeValues.push(flow);
  toNodeMeta.incomeNodes.push(fromNodeMeta);
  if (fromNodeMeta.level >= toNodeMeta.level) {
    toNodeMeta.level = fromNodeMeta.level + 1;
    this.shiftNodeLevels(toNodeMeta);
  }
  if (toNodeMeta.level > this.lastLevel)
    this.lastLevel = toNodeMeta.level;
};


/**
 * Creates drop off flow.
 * @param {anychart.sankeyModule.Chart.NodeMeta} fromNodeMeta
 * @param {number} flow
 */
anychart.sankeyModule.Chart.prototype.createDropOffFlow = function(fromNodeMeta, flow) {
  fromNodeMeta.outcomeValue += flow;
  fromNodeMeta.dropoffValues.push(flow);
};


/**
 * Calculate node levels.
 * Правила авторасчета левелов.
 * 1) Автоматический расчет идет линейно по заданным данным (0 to length) - это означает,
 * что в голимой теории разный порядок строк может привести к разному порядку нод в левелах
 * @private
 */
anychart.sankeyModule.Chart.prototype.calculateLevels_ = function() {
  var from, to, flow;

  /**
   * Node metas by node name.
   * @type {Object.<string, anychart.sankeyModule.Chart.NodeMeta>}
   */
  var nodeMetas = {};

  /**
   * @type {anychart.sankeyModule.Chart.NodeMeta}
   */
  var fromNodeMeta;

  /**
   * @type {anychart.sankeyModule.Chart.NodeMeta}
   */
  var toNodeMeta;

  var iterator = this.getIterator().reset();
  this.lastLevel = -1;
  while (iterator.advance()) {
    from = /** @type {string} */ (iterator.get('from'));
    to = /** @type {string} */ (iterator.get('to'));
    flow = /** @type {number} */ (iterator.get('flow'));
    if (this.isMissing_(from, to, flow))
      continue;

    fromNodeMeta = nodeMetas[from];
    if (!fromNodeMeta) {
      nodeMetas[from] = fromNodeMeta = {
        name: from,
        level: 0,
        incomeValue: NaN,
        outcomeValue: 0,
        incomeNodes: [],
        outcomeNodes: [],
        incomeValues: [],
        outcomeValues: [],
        dropoffValues: [],
        conflict: false
      };
    }
    if (to === null) {
      this.createDropOffFlow(fromNodeMeta, flow);
    } else {
      toNodeMeta = nodeMetas[to];
      if (!toNodeMeta) {
        nodeMetas[to] = toNodeMeta = {
          name: to,
          level: -1,
          incomeValue: 0,
          outcomeValue: 0,
          incomeNodes: [],
          outcomeNodes: [],
          incomeValues: [],
          outcomeValues: [],
          dropoffValues: [],
          conflict: false
        };
      }
      this.createFlow(fromNodeMeta, toNodeMeta, flow);
    }
  }
  this.levels = {};
  this.setAsLast = true;
  for (var nodeName in nodeMetas) {
    var nodeMeta = nodeMetas[nodeName];

    // place node without outcome nodes at last level
    if (!nodeMeta.outcomeNodes.length && this.setAsLast)
      nodeMeta.level = this.lastLevel;

    // check whether node in confict
    if (nodeMeta.incomeNodes.length && (nodeMeta.outcomeNodes.length + nodeMeta.dropoffValues.length)) {
      nodeMeta.conflict = (nodeMeta.incomeValue != nodeMeta.outcomeValue);
    }

    //first-level node
    if (isNaN(nodeMeta.incomeValue))
      nodeMeta.nodeHeight = nodeMeta.outcomeValue;
    // last level node
    else if (!(nodeMeta.outcomeNodes.length + nodeMeta.dropoffValues.length))
      nodeMeta.nodeHeight = nodeMeta.incomeValue;
    // other nodes
    else
      nodeMeta.nodeHeight = Math.max(nodeMeta.incomeValue, nodeMeta.outcomeValue);

    var level = nodeMeta.level;
    this.levels[level] ? this.levels[level].push(nodeName) : this.levels[level] = [nodeName];
  }

  console.log(this.levels);
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.calculate = function() {
  if (this.hasInvalidationState(anychart.ConsistencyState.SANKEY_DATA)) {
    this.calculateLevels_();
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


//endregion
//region Drawing


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.drawContent = function(bounds) {
  if (this.isConsistent())
    return;

  // calculates everything that can be calculated from data
  this.calculate();

  // if (!this.hoverRect_) {
  //   this.hoverRect_ = this.rootElement.path().zIndex(1).stroke(null).fill(null);
  // }

  this.rootElement.removeChildren();

  var nodePaths = [];
  var flowPaths = [];
  var dropoffPaths = [];

  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    var level;
    var levelsCount = this.levels.length;
    var levelWidth = bounds.width / levelsCount;
    var nodeWidth = /** @type {string|number} */ (this.getOption('nodeWidth'));
    nodeWidth = anychart.utils.normalizeSize(nodeWidth, levelWidth);
    for (var i = 0; i < this.levels.length; i++) {
      level = this.levels[i];

    }
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
