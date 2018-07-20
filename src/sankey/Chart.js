//region Provide / Require
goog.provide('anychart.sankeyModule.Chart');
goog.require('anychart.core.SeparateChart');
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
 * @type {Array.<Array>}
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
});


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


//endregion
//region Infrastructure
/**
 * @typedef {{
 *   level: number,
 *   incomeValue: number,
 *   outcomeValue: number,
 *   incomeNodes: Array.<string>,
 *   outcomeNodes: Array.<string>,
 *   dropoffValues: Array.<string>
 * }}
 */
anychart.sankeyModule.Chart.NodeMeta;


/**
 * Calculate node levels.
 * @private
 */
anychart.sankeyModule.Chart.prototype.calculateLevels_ = function() {
  this.levelsInternal_ = [];
  var levels = this.getOption('levels');
  if (!goog.isDef(levels)) {
    var iterator = this.getIterator().reset();
  }
};


/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.calculate = function() {
  if (this.hasInvalidationState(anychart.ConsistencyState.SANKEY_DATA)) {
    this.calculateLevels_();
    this.markConsistent(anychart.ConsistencyState.SANKEY_DATA);
  }
};


//endregion
//region Drawing
/** @inheritDoc */
anychart.sankeyModule.Chart.prototype.drawContent = function(bounds) {
  if (this.isConsistent())
    return;

  // calculates everything that can be calculated from data
  this.calculate();

  /*

  ADD TO DOM
  SET STYLES
  MEASURE

   */

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
