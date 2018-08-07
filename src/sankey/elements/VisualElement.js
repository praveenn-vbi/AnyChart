goog.provide('anychart.sankeyModule.elements.Node');

goog.require('anychart.core.Base');
goog.require('anychart.core.StateSettings');
goog.require('anychart.core.settings');



/**
 * Sankey visual element base settings.
 * @constructor
 * @extends {anychart.core.Base}
 * @implements {anychart.core.settings.IObjectWithSettings}
 */
anychart.sankeyModule.elements.VisualElement = function() {
  anychart.sankeyModule.elements.VisualElement.base(this, 'constructor');

  var descriptorsMap = {};
  anychart.core.settings.createDescriptorsMeta(descriptorsMap, [
    ['fill', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE],
    ['stroke', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE],
    ['hatchFill', 0, anychart.Signal.NEEDS_REDRAW_APPEARANCE]//,
    // ['labels', 0, 0]
  ]);

  this.normal_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.NORMAL);
  // this.normal_.setOption(anychart.core.StateSettings.LABELS_AFTER_INIT_CALLBACK, this.labelsAfterInitCallback);
  this.hovered_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.HOVER);
  // this.hovered_.setOption(anychart.core.StateSettings.LABELS_AFTER_INIT_CALLBACK, this.labelsAfterInitCallback);
  this.selected_ = new anychart.core.StateSettings(this, descriptorsMap, anychart.PointState.SELECT);
  // this.selected_.setOption(anychart.core.StateSettings.LABELS_AFTER_INIT_CALLBACK, this.labelsAfterInitCallback);
};
goog.inherits(anychart.sankeyModule.elements.VisualElement, anychart.core.Base);
anychart.core.settings.populateAliases(anychart.sankeyModule.elements.VisualElement, ['fill', 'stroke', 'hatchFill'/*, 'labels'*/], 'normal');


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
