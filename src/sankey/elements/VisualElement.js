goog.provide('anychart.sankeyModule.elements.VisualElement');

goog.require('anychart.core.Base');
goog.require('anychart.core.StateSettings');
goog.require('anychart.core.settings');



/**
 * Sankey visual element base settings.
 * @constructor
 * @param {anychart.sankeyModule.Chart} chart Sankey chart.
 * @extends {anychart.core.Base}
 * @implements {anychart.core.settings.IObjectWithSettings}
 */
anychart.sankeyModule.elements.VisualElement = function(chart) {
  anychart.sankeyModule.elements.VisualElement.base(this, 'constructor');

  this.chart = chart;

  var descriptorsMap = {};
  anychart.core.settings.createDescriptorsMeta(descriptorsMap, [
    ['fill', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE],
    ['stroke', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE],
    ['hatchFill', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE]
  ]);

  this.normal_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.NORMAL);
  this.hovered_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.HOVER);
  this.selected_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.SELECT);
};
goog.inherits(anychart.sankeyModule.elements.VisualElement, anychart.core.Base);
anychart.core.settings.populateAliases(anychart.sankeyModule.elements.VisualElement, ['fill', 'stroke', 'hatchFill'/*, 'labels'*/], 'normal');


/**
 * Supported signals mask.
 * @type {number}
 */
anychart.sankeyModule.elements.VisualElement.prototype.SUPPORTED_SIGNALS =
    anychart.core.Base.prototype.SUPPORTED_SIGNALS |
    anychart.Signal.NEEDS_REDRAW_APPEARANCE;


/**
 * Normal state settings.
 * @param {!Object=} opt_value
 * @return {anychart.core.StateSettings|anychart.sankeyModule.elements.VisualElement}
 */
anychart.sankeyModule.elements.VisualElement.prototype.normal = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.normal_.setup(opt_value);
    return this;
  }
  return this.normal_;
};


/**
 * Hovered state settings.
 * @param {!Object=} opt_value
 * @return {anychart.core.StateSettings|anychart.sankeyModule.elements.VisualElement}
 */
anychart.sankeyModule.elements.VisualElement.prototype.hovered = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.hovered_.setup(opt_value);
    return this;
  }
  return this.hovered_;
};


/**
 * Selected state settings.
 * @param {!Object=} opt_value
 * @return {anychart.core.StateSettings|anychart.sankeyModule.elements.VisualElement}
 */
anychart.sankeyModule.elements.VisualElement.prototype.selected = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.selected_.setup(opt_value);
    return this;
  }
  return this.selected_;
};


/**
 * Returns fill for the element.
 * @param {anychart.PointState|number} state
 * @param {Object} context
 * @return {acgraph.vector.Fill|acgraph.vector.Stroke}
 */
anychart.sankeyModule.elements.VisualElement.prototype.getFill = function(state, context) {
  return this.resolveColor('fill', state, context);
};


/**
 * Returns stroke for the element.
 * @param {anychart.PointState|number} state
 * @param {Object} context
 * @return {acgraph.vector.Fill|acgraph.vector.Stroke}
 */
anychart.sankeyModule.elements.VisualElement.prototype.getStroke = function(state, context) {
  return this.resolveColor('stroke', state, context);
};


/**
 * Returns hatchFill for the element.
 * @param {anychart.PointState|number} state
 * @param {Object} context
 * @return {acgraph.vector.Fill|acgraph.vector.Stroke}
 */
anychart.sankeyModule.elements.VisualElement.prototype.getHatchFill = function(state, context) {
  return this.resolveColor('hatchFill', state, context);
};


/**
 * Returns auto hatch fill.
 * @return {acgraph.vector.HatchFill}
 */
anychart.sankeyModule.elements.VisualElement.prototype.getAutoHatchFill = function() {
  return /** @type {acgraph.vector.HatchFill} */ ('none');
};


/**
 * Resolves color for element (node, conflict, flow, dropoff).
 * @param {string} name Color name - fill, stroke, hatchFill
 * @param {anychart.PointState|number} state
 * @param {Object} context color resolution context.
 * @return {acgraph.vector.Fill|acgraph.vector.Stroke}
 */
anychart.sankeyModule.elements.VisualElement.prototype.resolveColor = function(name, state, context) {
  var result;
  var stateObject = state == anychart.PointState.NORMAL ? this.normal_ : state == anychart.PointState.HOVER ? this.hovered_ : this.selected_;
  result = stateObject.getOption(name) || this.normal_.getOption(name);

  if (goog.isFunction(result)) {
    result = result.call(context, context);
  } else if (result == true) {
    return this.getAutoHatchFill();
  }

  return result;
};


//region Serialize / Setup / Dispose
/** @inheritDoc */
anychart.sankeyModule.elements.VisualElement.prototype.serialize = function() {
  var json = anychart.sankeyModule.elements.VisualElement.base(this, 'serialize');
  json['normal'] = this.normal_.serialize();
  json['hovered'] = this.hovered_.serialize();
  json['selected'] = this.selected_.serialize();

  return json;
};


/** @inheritDoc */
anychart.sankeyModule.elements.VisualElement.prototype.setupByJSON = function(config, opt_default) {
  anychart.sankeyModule.elements.VisualElement.base(this, 'setupByJSON', config, opt_default);

  this.normal_.setupInternal(!!opt_default, config);
  this.normal_.setupInternal(!!opt_default, config['normal']);
  this.hovered_.setupInternal(!!opt_default, config['hovered']);
  this.selected_.setupInternal(!!opt_default, config['selected']);
};


/** @inheritDoc */
anychart.sankeyModule.elements.VisualElement.prototype.disposeInternal = function() {
  goog.disposeAll(this.normal_, this.hovered_, this.selected_);
  anychart.sankeyModule.elements.VisualElement.base(this, 'disposeInternal');
};


//endregion
