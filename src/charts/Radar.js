goog.provide('anychart.charts.Radar');

goog.require('anychart'); // otherwise we can't use anychart.chartTypesMap object.
goog.require('anychart.core.SeparateChart');
goog.require('anychart.core.axes.Radar');
goog.require('anychart.core.axes.Radial');
goog.require('anychart.core.grids.Radar');
goog.require('anychart.core.radar.series.Base');
goog.require('anychart.core.utils.OrdinalIterator');
goog.require('anychart.enums');
goog.require('anychart.palettes.DistinctColors');
goog.require('anychart.palettes.HatchFills');
goog.require('anychart.palettes.Markers');
goog.require('anychart.palettes.RangeColors');
goog.require('anychart.scales');



/**
 * Radar chart class.<br/>
 * To get the chart use method {@link anychart.radar}.<br/>
 * Chart can contain any number of series.<br/>
 * Each series is interactive, you can customize click and hover behavior and other params.
 * @extends {anychart.core.SeparateChart}
 * @constructor
 */
anychart.charts.Radar = function() {
  goog.base(this);

  /**
   * Start angle for the first slice of a pie chart.
   * @type {(string|number)}
   * @private
   */
  this.startAngle_ = 0;

  /**
   * @type {anychart.scales.Ordinal}
   * @private
   */
  this.xScale_ = null;

  /**
   * @type {anychart.scales.Base}
   * @private
   */
  this.yScale_ = null;

  /**
   * @type {!Array.<anychart.core.radar.series.Base>}
   * @private
   */
  this.series_ = [];

  /**
   * @type {Array.<anychart.core.grids.Radar>}
   * @private
   */
  this.grids_ = [];

  /**
   * @type {Array.<anychart.core.grids.Radar>}
   * @private
   */
  this.minorGrids_ = [];

  /**
   * Palette for series colors.
   * @type {anychart.palettes.RangeColors|anychart.palettes.DistinctColors}
   * @private
   */
  this.palette_ = null;

  /**
   * @type {anychart.palettes.Markers}
   * @private
   */
  this.markerPalette_ = null;

  /**
   * @type {anychart.palettes.HatchFills}
   * @private
   */
  this.hatchFillPalette_ = null;

  /**
   * Cache of chart data bounds.
   * @type {anychart.math.Rect}
   * @private
   */
  this.dataBounds_ = null;

  // Add handler to listen legend item click for legend and enable/disable series.
  var legend = /** @type {anychart.core.ui.Legend} */ (this.legend());
  legend.listen(anychart.enums.EventType.LEGEND_ITEM_CLICK, function(event) {
    // function that enables or disables series by index of clicked legend item

    var cartesianChart = /** @type {anychart.charts.Radar} */ (this);
    var index = event['index'];
    var series = cartesianChart.getSeries(index);
    if (series) {
      series.enabled(!series.enabled());
    }

  }, false, this);

};
goog.inherits(anychart.charts.Radar, anychart.core.SeparateChart);


/**
 * Supported consistency states. Adds AXES, AXES_MARKERS, GRIDS to anychart.core.SeparateChart states.
 * @type {number}
 */
anychart.charts.Radar.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.SeparateChart.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.PALETTE |
    anychart.ConsistencyState.MARKER_PALETTE |
    anychart.ConsistencyState.HATCH_FILL_PALETTE |
    anychart.ConsistencyState.SCALES |
    anychart.ConsistencyState.SERIES |
    anychart.ConsistencyState.AXES |
    anychart.ConsistencyState.GRIDS;


/**
 * Grid z-index in chart root layer.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_GRID = 10;


/**
 * Series z-index in chart root layer.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_SERIES = 30;


/**
 * Line-like series should have bigger zIndex value than other series.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_LINE_SERIES = 31;


/**
 * Axis z-index in chart root layer.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_AXIS = 35;


/**
 * Marker z-index in chart root layer.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_MARKER = 40;


/**
 * Label z-index in chart root layer.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_LABEL = 40;


/**
 * Z-index increment multiplier.
 * @type {number}
 */
anychart.charts.Radar.ZINDEX_INCREMENT_MULTIPLIER = 0.00001;


//----------------------------------------------------------------------------------------------------------------------
//
//  Scale map properties.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * @type {!Object.<!Array.<anychart.core.radar.series.Base>>}
 * @private
 */
anychart.charts.Radar.prototype.seriesOfStackedScaleMap_;


/**
 * @type {!Object.<anychart.scales.Base>}
 * @private
 */
anychart.charts.Radar.prototype.yScales_;


/**
 * @type {!Object.<anychart.scales.Base>}
 * @private
 */
anychart.charts.Radar.prototype.xScales_;


/**
 * @type {!Object.<!Array.<anychart.core.radar.series.Base>>}
 * @private
 */
anychart.charts.Radar.prototype.seriesOfXScaleMap_;


/**
 * @type {!Object.<!Array.<anychart.core.radar.series.Base>>}
 * @private
 */
anychart.charts.Radar.prototype.seriesOfYScaleMap_;


/**
 * Set chart start angle.
 * @example
 * var chart = anychart.radar([1, 1.2, 1.4, 1.6, 1.2]);
 * chart.startAngle(45);
 * chart.container(stage).draw();
 * @param {(string|number)=} opt_value .
 * @return {(string|number|anychart.charts.Radar)} .
 */
anychart.charts.Radar.prototype.startAngle = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = goog.math.standardAngle((goog.isNull(opt_value) || isNaN(+opt_value)) ? 0 : +opt_value);
    if (this.startAngle_ != opt_value) {
      this.startAngle_ = opt_value;
      this.invalidate(anychart.ConsistencyState.BOUNDS, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  } else {
    return this.startAngle_;
  }
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Scales.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter for default chart X scale.
 * @example
 * var chart = anychart.radar();
 * chart.line([10, 12, 1, 4, 14, 5]);
 * chart.xScale().inverted(true);
 * chart.container(stage).draw();
 * @return {!anychart.scales.Ordinal} Default chart scale value.
 *//**
 * Setter for default chart X scale.<br/>
 * <b>Note:</b> This scale will be passed to all scale dependent chart elements if they don't have their own scales.
 * @param {anychart.scales.Ordinal=} opt_value X Scale to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {anychart.scales.Ordinal=} opt_value X Scale to set.
 * @return {!(anychart.scales.Ordinal|anychart.charts.Radar)} Default chart scale value or itself for method chaining.
 */
anychart.charts.Radar.prototype.xScale = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.xScale_ != opt_value) {
      this.xScale_ = opt_value;
      this.invalidate(anychart.ConsistencyState.SCALES, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  } else {
    if (!this.xScale_) {
      this.xScale_ = new anychart.scales.Ordinal();
    }
    return this.xScale_;
  }
};


/**
 * Getter for default chart Y scale.
 * @example
 * var chart = anychart.radar();
 * chart.line([10, 12, 1, 4, 14, 5]);
 * chart.yScale().inverted(true);
 * chart.container(stage).draw();
 * @return {!anychart.scales.Base} Default chart scale value.
 *//**
 * Setter for default chart Y scale.<br/>
 * <b>Note:</b> This scale will be passed to all scale dependent chart elements if they don't have their own scales.
 * @example
 * var chart = anychart.radar();
 * chart.line([100, 12, 1, 4, 14, 95]);
 * chart.yScale('log');
 * chart.container(stage).draw();
 * @param {(anychart.scales.Base|anychart.enums.ScaleTypes)=} opt_value Y Scale to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(anychart.scales.Base|anychart.enums.ScaleTypes)=} opt_value Y Scale to set.
 * @return {!(anychart.scales.Base|anychart.charts.Radar)} Default chart scale value or itself for method chaining.
 */
anychart.charts.Radar.prototype.yScale = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (goog.isString(opt_value)) {
      opt_value = anychart.scales.Base.fromString(opt_value, false);
    }
    if (this.yScale_ != opt_value) {
      this.yScale_ = opt_value;
      this.invalidate(anychart.ConsistencyState.SCALES, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  } else {
    if (!this.yScale_) {
      this.yScale_ = new anychart.scales.Linear();
    }
    return this.yScale_;
  }
};


/**
 * Sets default scale for layout based element depending on barChartMode.
 * @param {anychart.core.grids.Radar} item Item to set scale.
 * @private
 */
anychart.charts.Radar.prototype.setDefaultScaleForLayoutBasedElements_ = function(item) {
  if (!!(item.isRadial())) {
    item.xScale(/** @type {anychart.scales.Ordinal} */(this.xScale()));
  } else {
    item.yScale(/** @type {anychart.scales.Base} */(this.yScale()));
    item.xScale(/** @type {anychart.scales.Ordinal} */(this.xScale()));
  }
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Grids.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter for chart grid.
 * @example
 * var chart = anychart.radar();
 * chart.area([1, 4, 5, 7, 2]);
 * chart.grid()
 *     .stroke('2 grey');
 * chart.grid(1)
 *     .oddFill('none')
 *     .evenFill('none')
 *     .stroke('2 blue .5');
 * chart.container(stage).draw();
 * @param {number=} opt_index Chart grid index. If not set - creates a new instance and adds it to the end of array.
 * @return {!anychart.core.grids.Radar} Axis instance by index.
 *//**
 * Setter for chart grid.
 * @example
 * var chart = anychart.radar();
 * chart.area([1, 4, 5, 7, 2]);
 * chart.grid(false);
 * chart.container(stage).draw();
 * @param {(Object|boolean|null)=} opt_value Chart grid settings to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * Setter for chart grid by index.
 * @example
 * var chart = anychart.radar();
 * chart.area([1, 4, 5, 7, 2]);
 * chart.grid(false);
 * chart.grid(1, false);
 * chart.container(stage).draw();
 * @param {number=} opt_index Chart grid index.
 * @param {(Object|boolean|null)=} opt_value Chart grid settings to set.<br/>
 * <b>Note:</b> pass <b>null</b> or <b>'none'</b> to disable the grid.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} class for method chaining.
 *//**
 * @ignoreDoc
 * @param {(Object|boolean|null|number)=} opt_indexOrValue Grid settings.
 * @param {(Object|boolean|null)=} opt_value Grid settings to set.
 * @return {!(anychart.core.grids.Radar|anychart.charts.Radar)} Grid instance by index or itself for method chaining.
 */
anychart.charts.Radar.prototype.grid = function(opt_indexOrValue, opt_value) {
  var index, value;
  index = anychart.utils.toNumber(opt_indexOrValue);
  if (isNaN(index)) {
    index = 0;
    value = opt_indexOrValue;
  } else {
    index = opt_indexOrValue;
    value = opt_value;
  }
  var grid = this.grids_[index];
  if (!grid) {
    grid = new anychart.core.grids.Radar();
    grid.drawLastLine(false);
    grid.zIndex(anychart.charts.Radar.ZINDEX_GRID);
    this.grids_[index] = grid;
    this.registerDisposable(grid);
    grid.listenSignals(this.onGridSignal_, this);
    this.invalidate(anychart.ConsistencyState.GRIDS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(value)) {
    grid.setup(value);
    return this;
  } else {
    return grid;
  }
};


/**
 * Getter for chart minor grid.
 * @example
 * var chart = anychart.radar();
 * chart.area([1, 4, 5, 7, 2]);
 * chart.minorGrid()
 *     .enabled(true)
 *     .stroke('2 grey');
 * chart.minorGrid(1)
 *     .enabled(true)
 *     .oddFill('none')
 *     .evenFill('none')
 *     .stroke('2 blue .5');
 * chart.container(stage).draw();
 * @param {number=} opt_index Chart grid index. If not set - creates a new instance and adds it to the end of array.
 * @return {!anychart.core.grids.Radar} Axis instance by index.
 *//**
 * Setter for chart minor grid.
 * @example
 * var chart = anychart.radar();
 * chart.area([1, 4, 5, 7, 2]);
 * chart.minorGrid(true);
 * chart.container(stage).draw();
 * @param {(Object|boolean|null)=} opt_value Chart grid settings to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * Setter for chart minor grid by index.
 * @param {number=} opt_index Chart grid index.
 * @param {(Object|boolean|null)=} opt_value Chart grid settings to set.<br/>
 * <b>Note:</b> pass <b>null</b> or <b>'none'</b> to disable the grid.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} class for method chaining.
 *//**
 * @ignoreDoc
 * @param {(Object|boolean|null|number)=} opt_indexOrValue Grid settings.
 * @param {(Object|boolean|null)=} opt_value Grid settings to set.
 * @return {!(anychart.core.grids.Radar|anychart.charts.Radar)} Grid instance by index or itself for method chaining.
 */
anychart.charts.Radar.prototype.minorGrid = function(opt_indexOrValue, opt_value) {
  var index, value;
  index = anychart.utils.toNumber(opt_indexOrValue);
  if (isNaN(index)) {
    index = 0;
    value = opt_indexOrValue;
  } else {
    index = opt_indexOrValue;
    value = opt_value;
  }
  var grid = this.minorGrids_[index];
  if (!grid) {
    grid = new anychart.core.grids.Radar();
    grid.drawLastLine(false);
    grid.zIndex(anychart.charts.Radar.ZINDEX_GRID);
    grid.isMinor(true);
    this.minorGrids_[index] = grid;
    this.registerDisposable(grid);
    grid.listenSignals(this.onGridSignal_, this);
    this.invalidate(anychart.ConsistencyState.GRIDS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(value)) {
    grid.setup(value);
    return this;
  } else {
    return grid;
  }
};


/**
 * Listener for grids invalidation.
 * @param {anychart.SignalEvent} event Invalidation event.
 * @private
 */
anychart.charts.Radar.prototype.onGridSignal_ = function(event) {
  this.invalidate(anychart.ConsistencyState.GRIDS, anychart.Signal.NEEDS_REDRAW);
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Axes.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter for chart X-axis.
 * @example
 * var chart = anychart.radar();
 * chart.line([1, 4, 5, 7, 2]);
 * chart.xAxis().stroke('red');
 * chart.container(stage).draw();
 * @return {!anychart.core.axes.Radar} Axis instance by index.
 *//**
 * Setter for chart X-axis by index.
 * @example
 * var chart = anychart.radar();
 * chart.line([1, 4, 5, 7, 2]);
 * chart.xAxis(false);
 * chart.container(stage).draw();
 * @param {(Object|boolean|null)=} opt_value Chart axis settings to set.<br/>
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(Object|boolean|null)=} opt_value Chart axis settings to set.
 * @return {!(anychart.core.axes.Radar|anychart.charts.Radar)} Axis instance by index or itself for method chaining.
 */
anychart.charts.Radar.prototype.xAxis = function(opt_value) {
  if (!this.xAxis_) {
    this.xAxis_ = new anychart.core.axes.Radar();
    this.xAxis_.zIndex(anychart.charts.Radar.ZINDEX_AXIS);
    this.registerDisposable(this.xAxis_);
    this.xAxis_.listenSignals(this.onAxisSignal_, this);
    this.invalidate(anychart.ConsistencyState.AXES | anychart.ConsistencyState.BOUNDS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(opt_value)) {
    this.xAxis_.setup(opt_value);
    return this;
  } else {
    return this.xAxis_;
  }
};


/**
 * Getter for chart Y-axis.
 * @example
 * var chart = anychart.radar();
 * chart.line([1, 4, 5, 7, 2]);
 * chart.yAxis().stroke('red');
 * chart.container(stage).draw();
 * @return {!anychart.core.axes.Radar} Axis instance by index.
 *//**
 * Setter for chart Y-axis by index.
 * @example
 * var chart = anychart.radar();
 * chart.line([1, 4, 5, 7, 2]);
 * chart.yAxis(null);
 * chart.container(stage).draw();
 * @param {(Object|boolean|null)=} opt_value Chart axis settings to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(Object|boolean|null)=} opt_value Chart axis settings to set.
 * @return {!(anychart.core.axes.Radial|anychart.charts.Radar)} Axis instance by index or itself for method chaining.
 */
anychart.charts.Radar.prototype.yAxis = function(opt_value) {
  if (!this.yAxis_) {
    this.yAxis_ = new anychart.core.axes.Radial();
    this.yAxis_.zIndex(anychart.charts.Radar.ZINDEX_AXIS);
    this.registerDisposable(this.yAxis_);
    this.yAxis_.listenSignals(this.onAxisSignal_, this);
    this.invalidate(anychart.ConsistencyState.AXES | anychart.ConsistencyState.BOUNDS, anychart.Signal.NEEDS_REDRAW);
  }

  if (goog.isDef(opt_value)) {
    this.yAxis_.setup(opt_value);
    return this;
  } else {
    return this.yAxis_;
  }
};


/**
 * Listener for axes invalidation.
 * @param {anychart.SignalEvent} event Invalidation event.
 * @private
 */
anychart.charts.Radar.prototype.onAxisSignal_ = function(event) {
  var state = 0;
  var signal = 0;
  if (event.hasSignal(anychart.Signal.NEEDS_REDRAW)) {
    state |= anychart.ConsistencyState.AXES;
    signal |= anychart.Signal.NEEDS_REDRAW;
  }
  if (event.hasSignal(anychart.Signal.BOUNDS_CHANGED)) {
    state |= anychart.ConsistencyState.BOUNDS;
  }
  // if there are no signals, state == 0 and nothing happens.
  this.invalidate(state, signal);
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Series constructors
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Adds Area series.
 * @example
 * var chart = anychart.radar();
 * chart.area([10, 4, 17, 20, 12]);
 * chart.container(stage).draw();
 * @param {!(anychart.data.View|anychart.data.Set|Array)} data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @return {anychart.core.radar.series.Base} {@link anychart.core.radar.series.Area} instance for method chaining.
 */
anychart.charts.Radar.prototype.area = function(data, opt_csvSettings) {
  return this.createSeriesByType_(
      anychart.enums.RadarSeriesType.AREA,
      data,
      opt_csvSettings
  );
};


/**
 * Adds Line series.
 * @example
 * var chart = anychart.radar();
 * chart.line([10, 4, 17, 20, 12]);
 * chart.container(stage).draw();
 * @param {!(anychart.data.View|anychart.data.Set|Array|string)} data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @return {anychart.core.radar.series.Base} {@link anychart.core.radar.series.Line} instance for method chaining.
 */
anychart.charts.Radar.prototype.line = function(data, opt_csvSettings) {
  return this.createSeriesByType_(
      anychart.enums.RadarSeriesType.LINE,
      data,
      opt_csvSettings,
      anychart.charts.Radar.ZINDEX_LINE_SERIES
  );
};


/**
 * Adds Marker series.
 * @example
 * var chart = anychart.radar();
 * chart.marker([10, 4, 17, 20, 12]);
 * chart.container(stage).draw();
 * @param {!(anychart.data.View|anychart.data.Set|Array|string)} data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @return {anychart.core.radar.series.Base} {@link anychart.core.radar.series.Marker} instance for method chaining.
 */
anychart.charts.Radar.prototype.marker = function(data, opt_csvSettings) {
  return this.createSeriesByType_(
      anychart.enums.RadarSeriesType.MARKER,
      data,
      opt_csvSettings
  );
};


/**
 * @param {string} type Series type.
 * @param {!(anychart.data.View|anychart.data.Set|Array|string)} data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @param {number=} opt_zIndex Optional series zIndex.
 * @private
 * @return {anychart.core.radar.series.Base}
 */
anychart.charts.Radar.prototype.createSeriesByType_ = function(type, data, opt_csvSettings, opt_zIndex) {
  var ctl;
  type = ('' + type).toLowerCase();
  for (var i in anychart.core.radar.series.Base.SeriesTypesMap) {
    if (i.toLowerCase() == type)
      ctl = anychart.core.radar.series.Base.SeriesTypesMap[i];
  }
  var instance;

  if (ctl) {
    instance = new ctl(data, opt_csvSettings);
    this.registerDisposable(instance);
    this.series_.push(instance);
    var index = this.series_.length - 1;
    var inc = index * anychart.charts.Radar.ZINDEX_INCREMENT_MULTIPLIER;
    instance.index(index);
    instance.setAutoZIndex((goog.isDef(opt_zIndex) ? opt_zIndex : anychart.charts.Radar.ZINDEX_SERIES) + inc);
    var markerType = /** @type {anychart.enums.MarkerType} */(this.markerPalette().markerAt(this.series_.length - 1));
    if (instance.hasMarkers()) {
      instance.markers().setAutoZIndex(anychart.charts.Radar.ZINDEX_MARKER + inc);
      instance.markers().setAutoType(markerType);
    } else {
      // this else would be only if instance is Marker series
      instance.type(markerType);
    }
    instance.labels().setAutoZIndex(anychart.charts.Radar.ZINDEX_LABEL + inc + anychart.charts.Radar.ZINDEX_INCREMENT_MULTIPLIER / 2);
    instance.setAutoColor(this.palette().colorAt(this.series_.length - 1));
    instance.setAutoMarkerType(markerType);
    instance.setAutoHatchFill(/** @type {acgraph.vector.HatchFill|acgraph.vector.PatternFill} */(this.hatchFillPalette().hatchFillAt(this.series_.length - 1)));
    instance.restoreDefaults();
    instance.listenSignals(this.seriesInvalidated_, this);
    this.invalidate(
        anychart.ConsistencyState.SERIES |
        anychart.ConsistencyState.LEGEND |
        anychart.ConsistencyState.SCALES,
        anychart.Signal.NEEDS_REDRAW);
  } else {
    anychart.utils.error(anychart.enums.ErrorCode.NO_FEATURE_IN_MODULE, null, [type + ' series']);
    instance = null;
  }

  return instance;
};


/**
 * Getter series by index.
 * @example
 * var data = [
 *     [1, 2, 3, 4],
 *     [2, 3, 4, 1],
 *     [3, 4, 1, 2],
 *     [4, 1, 2, 3],
 *     [5, 5, 5, 5]
 * ];
 * var chart = anychart.radar.apply(this, data);
 * var series, i=0;
 * while (series = chart.getSeries(i)){
 *     series.markers().type('circle');
 *     i++;
 * }
 * chart.container(stage).draw();
 * @param {number} index
 * @return {anychart.core.radar.series.Base}
 */
anychart.charts.Radar.prototype.getSeries = function(index) {
  return this.series_[index] || null;
};


/**
 * Series signals handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.charts.Radar.prototype.seriesInvalidated_ = function(event) {
  var state = 0;
  if (event.hasSignal(anychart.Signal.NEEDS_REDRAW)) {
    state = anychart.ConsistencyState.SERIES;
  }
  if (event.hasSignal(anychart.Signal.DATA_CHANGED)) {
    state |= anychart.ConsistencyState.SERIES;
    this.invalidateSeries_();
  }
  if (event.hasSignal(anychart.Signal.NEEDS_RECALCULATION)) {
    state |= anychart.ConsistencyState.SCALES;
  }
  this.invalidate(state, anychart.Signal.NEEDS_REDRAW);
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Calculation.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Calculate cartesian chart properties.
 */
anychart.charts.Radar.prototype.calculate = function() {
  /** @type {number} */
  var i;
  /** @type {number} */
  var j;
  /** @type {anychart.scales.Base} */
  var scale;
  /** @type {!Array.<anychart.core.radar.series.Base>} */
  var series;
  /** @type {anychart.core.radar.series.Base} */
  var aSeries;
  /** @type {!Array.<*>|boolean} */
  var categories;
  /** @type {anychart.data.Iterator} */
  var iterator;
  /** @type {anychart.scales.Base} */
  var xScale;
  /** @type {number} */
  var id;
  /** @type {number} */
  var xId;
  /** @type {Array.<anychart.scales.Base>} */
  var yScalesToCalc;
  /** @type {Object.<!Array.<anychart.core.radar.series.Base>>} */
  var xScales;
  /** @type {anychart.core.utils.ScatterIterator} */
  var syncIterator;
  /** @type {*} */
  var value;

  if (this.hasInvalidationState(anychart.ConsistencyState.SCALES)) {
    anychart.core.Base.suspendSignalsDispatching(this.series_);

    this.makeScaleMaps_();

    yScalesToCalc = [];

    // parsing y scales map and getting lists of scales that need to be calculated and resetting them.
    for (id in this.yScales_) {
      scale = this.yScales_[id];
      if (scale.needsAutoCalc()) {
        scale.startAutoCalc(); // starting autocalc for stacked scales too.
        if (scale.stackMode() != anychart.enums.ScaleStackMode.VALUE)
          yScalesToCalc.push(scale);
      }
    }
    // parsing x scales map and calculating them if needed as they cannot be stacked.
    for (id in this.xScales_) {
      scale = this.xScales_[id];
      series = this.seriesOfXScaleMap_[goog.getUid(scale)];
      for (i = 0; i < series.length; i++)
        series[i].resetCategorisation();
      // we can crash or warn user here if the scale is stacked, if we want.
      if (scale.needsAutoCalc()) {
        scale.startAutoCalc();
        for (i = 0; i < series.length; i++) {
          aSeries = series[i];
          iterator = aSeries.getResetIterator();
          while (iterator.advance()) {
            value = iterator.get('x');
            if (goog.isDef(value))
              scale.extendDataRange(value);
          }
        }
      }
      // categorise series data if needed.
      categories = scale.getCategorisation();
      for (i = 0; i < series.length; i++)
        series[i].categoriseData(categories);
    }

    // calculate non-stacked y scales.
    for (i = 0; i < yScalesToCalc.length; i++) {
      scale = yScalesToCalc[i];
      series = this.seriesOfYScaleMap_[goog.getUid(scale)];
      if (scale.stackMode() == anychart.enums.ScaleStackMode.PERCENT) {
        var hasPositive = false;
        var hasNegative = false;
        for (j = 0; j < series.length; j++) {
          aSeries = series[j];
          if (aSeries.supportsStack()) {
            iterator = aSeries.getResetIterator();
            while (iterator.advance()) {
              value = aSeries.getReferenceScaleValues();
              if (goog.isDef(value)) {
                if ((/** @type {number} */(value)) > 0)
                  hasPositive = true;
                else if ((/** @type {number} */(value)) < 0)
                  hasNegative = true;
              }
            }
          }
        }
        scale.extendDataRange(0);
        if (hasPositive || (!hasPositive && !hasNegative))
          scale.extendDataRange(100);
        if (hasNegative)
          scale.extendDataRange(-100);
      } else {
        for (j = 0; j < series.length; j++) {
          aSeries = series[j];
          iterator = aSeries.getResetIterator();
          while (iterator.advance()) {
            value = aSeries.getReferenceScaleValues();
            if (goog.isDef(value))
              scale.extendDataRange(value);
          }
        }
      }
    }

    // calculate stacked y scales.
    for (id in this.seriesOfStackedScaleMap_) {
      series = this.seriesOfStackedScaleMap_[id];
      scale = this.yScales_[id];
      xScales = {};
      for (i = 0; i < series.length; i++) {
        xId = goog.getUid(series[i].xScale());
        if (xId in xScales)
          xScales[xId].push(series[i]);
        else
          xScales[xId] = [series[i]];
      }
      for (xId in xScales) {
        xScale = this.xScales_[xId];
        var cats = xScale.getCategorisation();
        var pointCallback = goog.bind(
            function(series) {
              var value = series.getReferenceScaleValues();
              if (goog.isDef(value)) {
                if (series.supportsStack())
                  this.extendDataRange(this.applyStacking(value));
                else
                  this.extendDataRange(value);
              }
            }, scale);
        var beforePointCallback = goog.bind(
            function() {
              this.resetStack();
            }, scale);
        if (goog.isArray(cats)) {
          syncIterator = new anychart.core.utils.OrdinalIterator(xScales[xId], /** @type {!Array} */(cats),
              pointCallback, null, beforePointCallback);
        }
        while (syncIterator.advance()) {
        }
      }
    }

    // calculate auto names for scales with predefined names field
    for (id in this.ordinalScalesWithNamesField_) {
      var ordScale = /** @type {anychart.scales.Ordinal} */ (this.ordinalScalesWithNamesField_[id]);
      series = this.seriesOfOrdinalScalesWithNamesField_[goog.getUid(ordScale)];
      var fieldName = ordScale.getNamesField();
      var autoNames = [];
      for (i = 0; i < series.length; i++) {
        aSeries = series[i];
        iterator = aSeries.getResetIterator();
        while (iterator.advance()) {
          var valueIndex = ordScale.getIndexByValue(iterator.get('x'));
          var name = iterator.get(fieldName);
          if (!goog.isDef(autoNames[valueIndex]))
            autoNames[valueIndex] = name || iterator.get('x') || iterator.get('value');
        }
      }
      ordScale.setAutoNames(autoNames);
    }

    var max = -Infinity;
    var min = Infinity;
    var sum = 0;
    var pointsCount = 0;

    for (i = 0; i < this.series_.length; i++) {
      //----------------------------------calc statistics for series
      aSeries = this.series_[i];
      aSeries.calculateStatistics();
      max = Math.max(max, /** @type {number} */(aSeries.statistics('seriesMax')));
      min = Math.min(min, /** @type {number} */ (aSeries.statistics('seriesMin')));
      sum += /** @type {number} */(aSeries.statistics('seriesSum'));
      pointsCount += /** @type {number} */(aSeries.statistics('seriesPointsCount'));
      //----------------------------------end calc statistics for series
    }

    //----------------------------------calc statistics for series
    //todo (Roman Lubushikin): to avoid this loop on series we can store this info in the chart instance and provide it to all series
    var average = sum / pointsCount;
    for (i = 0; i < this.series_.length; i++) {
      aSeries = this.series_[i];
      aSeries.statistics('max', max);
      aSeries.statistics('min', min);
      aSeries.statistics('sum', sum);
      aSeries.statistics('average', average);
      aSeries.statistics('pointsCount', pointsCount);
    }
    //----------------------------------end calc statistics for series

    anychart.core.Base.resumeSignalsDispatchingTrue(this.series_);

    this.markConsistent(anychart.ConsistencyState.SCALES);
    this.scalesFinalization_ = true;
  }
};


/**
 * Prepares scale maps.
 * @private
 */
anychart.charts.Radar.prototype.makeScaleMaps_ = function() {
  var i;
  var id;
  var count;
  var xScales = {};
  var yScales = {};
  var ordinalScalesWithNamesField = {};
  var seriesOfOrdinalScalesWithNamesField = {};
  var seriesOfStackedScaleMap = {};
  var seriesOfXScaleMap = {};
  var seriesOfYScaleMap = {};
  var scale;
  var series;

  //search for scales in series
  for (i = 0, count = this.series_.length; i < count; i++) {
    series = this.series_[i];

    //series X scale
    if (!series.xScale()) {
      series.xScale(/** @type {anychart.scales.Base} */(this.xScale()));
      this.invalidateSeries_();
      this.invalidate(anychart.ConsistencyState.SERIES);
    }
    scale = series.xScale();

    id = goog.getUid(scale);
    xScales[id] = scale;
    if (id in seriesOfXScaleMap)
      seriesOfXScaleMap[id].push(series);
    else
      seriesOfXScaleMap[id] = [series];

    // series ordinal scales with predefined field name for scale names.
    if (scale instanceof anychart.scales.Ordinal && scale.getNamesField()) {
      ordinalScalesWithNamesField[id] = scale;
      if (id in seriesOfOrdinalScalesWithNamesField)
        seriesOfOrdinalScalesWithNamesField[id].push(series);
      else
        seriesOfOrdinalScalesWithNamesField[id] = [series];
    }

    //series Y scale
    if (!series.yScale()) {
      series.yScale(/** @type {anychart.scales.Base} */(this.yScale()));
      this.invalidateSeries_();
      this.invalidate(anychart.ConsistencyState.SERIES);
    }
    scale = series.yScale();

    id = goog.getUid(scale);
    if (scale.stackMode() == anychart.enums.ScaleStackMode.VALUE) {
      if (id in seriesOfStackedScaleMap)
        seriesOfStackedScaleMap[id].push(series);
      else
        seriesOfStackedScaleMap[id] = [series];
    }

    yScales[id] = scale;
    if (id in seriesOfYScaleMap)
      seriesOfYScaleMap[id].push(series);
    else
      seriesOfYScaleMap[id] = [series];

    // series ordinal scales with predefined field name for scale names.
    if (scale instanceof anychart.scales.Ordinal && scale.getNamesField()) {
      ordinalScalesWithNamesField[id] = scale;
      if (id in seriesOfOrdinalScalesWithNamesField)
        seriesOfOrdinalScalesWithNamesField[id].push(series);
      else
        seriesOfOrdinalScalesWithNamesField[id] = [series];
    }

  }

  this.seriesOfStackedScaleMap_ = seriesOfStackedScaleMap;
  this.yScales_ = yScales;
  this.xScales_ = xScales;
  this.seriesOfXScaleMap_ = seriesOfXScaleMap;
  this.seriesOfYScaleMap_ = seriesOfYScaleMap;
  this.ordinalScalesWithNamesField_ = ordinalScalesWithNamesField;
  this.seriesOfOrdinalScalesWithNamesField_ = seriesOfOrdinalScalesWithNamesField;
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Coloring
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter for series colors palette.
 * @return {!(anychart.palettes.RangeColors|anychart.palettes.DistinctColors)} Current palette.
 *//**
 * Setter for series colors palette.
 * @example
 * chart = anychart.radar();
 * chart.palette(['red', 'green', 'blue']);
 * chart.line([1, -4, 5, 7, 5]);
 * chart.line([11, 0, 15, 4, 3]);
 * chart.line([21, -4, 9, 0, 4]);
 * chart.container(stage).draw();
 * @param {(anychart.palettes.RangeColors|anychart.palettes.DistinctColors|Object|Array.<string>)=} opt_value Value to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(anychart.palettes.RangeColors|anychart.palettes.DistinctColors|Object|Array.<string>)=} opt_value .
 * @return {!(anychart.palettes.RangeColors|anychart.palettes.DistinctColors|anychart.charts.Radar)} .
 */
anychart.charts.Radar.prototype.palette = function(opt_value) {
  if (opt_value instanceof anychart.palettes.RangeColors) {
    this.setupPalette_(anychart.palettes.RangeColors, opt_value);
    return this;
  } else if (opt_value instanceof anychart.palettes.DistinctColors) {
    this.setupPalette_(anychart.palettes.DistinctColors, opt_value);
    return this;
  } else if (goog.isObject(opt_value) && opt_value['type'] == 'range') {
    this.setupPalette_(anychart.palettes.RangeColors);
  } else if (goog.isObject(opt_value) || this.palette_ == null)
    this.setupPalette_(anychart.palettes.DistinctColors);

  if (goog.isDef(opt_value)) {
    this.palette_.setup(opt_value);
    return this;
  }
  return /** @type {!(anychart.palettes.RangeColors|anychart.palettes.DistinctColors)} */(this.palette_);
};


/**
 * Getter markers palette settings.
 * @return {!anychart.palettes.Markers} Current palette.
 *//**
 * Setter for markers palette settings.
 * @example
 * chart = anychart.radar();
 * chart.markerPalette(['star4', 'star5', 'star10']);
 * chart.line([1, -4, 5, 7, 5]);
 * chart.line([11, 0, 15, 4, 7]);
 * chart.line([21, -4, 9, 0, 4]);
 * chart.container(stage).draw();
 * @param {(anychart.palettes.Markers|Object|Array.<anychart.enums.MarkerType>)=} opt_value Value to set.
 * @return {!anychart.charts.Radar} {@link anychart.charts.Radar} instance for method chaining.
 *//**
 * @ignoreDoc
 * Chart markers palette settings.
 * @param {(anychart.palettes.Markers|Object|Array.<anychart.enums.MarkerType>)=} opt_value Chart marker palette settings to set.
 * @return {!(anychart.palettes.Markers|anychart.charts.Radar)} Return current chart markers palette or itself for chaining call.
 */
anychart.charts.Radar.prototype.markerPalette = function(opt_value) {
  if (!this.markerPalette_) {
    this.markerPalette_ = new anychart.palettes.Markers();
    this.markerPalette_.listenSignals(this.markerPaletteInvalidated_, this);
    this.registerDisposable(this.markerPalette_);
  }

  if (goog.isDef(opt_value)) {
    this.markerPalette_.setup(opt_value);
    return this;
  } else {
    return this.markerPalette_;
  }
};


/**
 * Chart hatch fill palette settings.
 * @param {(Array.<acgraph.vector.HatchFill.HatchFillType>|Object|anychart.palettes.HatchFills)=} opt_value Chart
 * hatch fill palette settings to set.
 * @return {!(anychart.palettes.HatchFills|anychart.charts.Radar)} Return current chart hatch fill palette or itself
 * for chaining call.
 */
anychart.charts.Radar.prototype.hatchFillPalette = function(opt_value) {
  if (!this.hatchFillPalette_) {
    this.hatchFillPalette_ = new anychart.palettes.HatchFills();
    this.hatchFillPalette_.listenSignals(this.hatchFillPaletteInvalidated_, this);
    this.registerDisposable(this.hatchFillPalette_);
  }

  if (goog.isDef(opt_value)) {
    this.hatchFillPalette_.setup(opt_value);
    return this;
  } else {
    return this.hatchFillPalette_;
  }
};


/**
 * @param {Function} cls Palette constructor.
 * @param {(anychart.palettes.RangeColors|anychart.palettes.DistinctColors)=} opt_cloneFrom Settings to clone from.
 * @private
 */
anychart.charts.Radar.prototype.setupPalette_ = function(cls, opt_cloneFrom) {
  if (this.palette_ instanceof cls) {
    if (opt_cloneFrom)
      this.palette_.setup(opt_cloneFrom);
  } else {
    goog.dispose(this.palette_);
    this.palette_ = new cls();
    if (opt_cloneFrom)
      this.palette_.setup(opt_cloneFrom);
    this.palette_.listenSignals(this.paletteInvalidated_, this);
    this.registerDisposable(this.palette_);
  }
};


/**
 * Internal palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.charts.Radar.prototype.paletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.PALETTE, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Internal marker palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.charts.Radar.prototype.markerPaletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.MARKER_PALETTE, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Internal marker palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.charts.Radar.prototype.hatchFillPaletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.HATCH_FILL_PALETTE, anychart.Signal.NEEDS_REDRAW);
  }
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Drawing.
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Draw cartesian chart content items.
 * @param {anychart.math.Rect} bounds Bounds of cartesian content area.
 */
anychart.charts.Radar.prototype.drawContent = function(bounds) {
  var i, count;

  this.calculate();
  if (this.scalesFinalization_) {
    var scale;
    var scalesChanged = false;
    for (i in this.xScales_) {
      scale = this.xScales_[i];
      if (scale.needsAutoCalc())
        scalesChanged |= scale.finishAutoCalc();
    }
    for (i in this.yScales_) {
      scale = this.yScales_[i];
      if (scale.needsAutoCalc())
        scalesChanged |= scale.finishAutoCalc();
    }
    this.scalesFinalization_ = false;
    if (scalesChanged) {
      this.invalidateSeries_();
    }
  }

  if (this.isConsistent())
    return;

  anychart.core.Base.suspendSignalsDispatching(this.series_, this.xAxis_, this.yAxis_);

  if (this.hasInvalidationState(anychart.ConsistencyState.PALETTE)) {
    for (i = this.series_.length; i--;) {
      this.series_[i].setAutoColor(this.palette().colorAt(i));
    }
    this.invalidateSeries_();
    this.invalidate(anychart.ConsistencyState.SERIES);
    this.markConsistent(anychart.ConsistencyState.PALETTE);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.MARKER_PALETTE)) {
    for (i = this.series_.length; i--;) {
      this.series_[i].setAutoMarkerType(/** @type {anychart.enums.MarkerType} */(this.markerPalette().markerAt(i)));
    }
    this.invalidateSeries_();
    this.invalidate(anychart.ConsistencyState.SERIES);
    this.markConsistent(anychart.ConsistencyState.MARKER_PALETTE);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.HATCH_FILL_PALETTE)) {
    for (i = this.series_.length; i--;) {
      this.series_[i].setAutoHatchFill(
          /** @type {acgraph.vector.HatchFill|acgraph.vector.PatternFill} */(this.hatchFillPalette().hatchFillAt(i)));
    }
    this.invalidateSeries_();
    this.invalidate(anychart.ConsistencyState.SERIES);
    this.markConsistent(anychart.ConsistencyState.HATCH_FILL_PALETTE);
  }

  // set default scales for axis if they not set
  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS | anychart.ConsistencyState.AXES)) {
    if (this.xAxis() && !this.xAxis().scale())
      this.xAxis().scale(/** @type {anychart.scales.Base} */(this.xScale()));

    if (this.yAxis() && !this.yAxis().scale())
      this.yAxis().scale(/** @type {anychart.scales.Base} */(this.yScale()));
  }

  //calculate axes space first, the result is data bounds
  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    //total bounds of content area
    var contentAreaBounds = bounds.clone().round();
    this.xAxis().parentBounds(contentAreaBounds);
    this.xAxis().startAngle(this.startAngle_);
    this.dataBounds_ = this.xAxis().getRemainingBounds().round();

    this.invalidateSeries_();
    this.invalidate(anychart.ConsistencyState.AXES);
    this.invalidate(anychart.ConsistencyState.GRIDS);
    this.invalidate(anychart.ConsistencyState.AXES_MARKERS);
    this.invalidate(anychart.ConsistencyState.SERIES);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.GRIDS)) {
    var grids = goog.array.concat(this.grids_, this.minorGrids_);

    for (i = 0, count = grids.length; i < count; i++) {
      var grid = grids[i];
      if (grid) {
        grid.suspendSignalsDispatching();
        if (!grid.xScale())
          this.setDefaultScaleForLayoutBasedElements_(grid);
        grid.parentBounds(this.dataBounds_);
        grid.container(this.rootElement);
        grid.startAngle(this.startAngle_);
        grid.draw();
        grid.resumeSignalsDispatching(false);
      }
    }
    this.markConsistent(anychart.ConsistencyState.GRIDS);
  }

  //draw axes outside of data bounds
  //only inside axes ticks can intersect data bounds
  if (this.hasInvalidationState(anychart.ConsistencyState.AXES)) {
    var xAxis = this.xAxis();
    xAxis.container(this.rootElement);
    xAxis.startAngle(this.startAngle_);
    xAxis.parentBounds(bounds.clone().round());
    xAxis.draw();

    var yAxis = this.yAxis();
    yAxis.container(this.rootElement);
    yAxis.startAngle(this.startAngle_);
    yAxis.parentBounds(this.dataBounds_.clone());
    yAxis.draw();

    this.markConsistent(anychart.ConsistencyState.AXES);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.SERIES)) {
    for (i = 0, count = this.series_.length; i < count; i++) {
      var series = this.series_[i];
      series.container(this.rootElement);
      series.startAngle(this.startAngle_);
      series.parentBounds(this.dataBounds_);
    }

    this.drawSeries_();
    this.markConsistent(anychart.ConsistencyState.SERIES);
  }

  anychart.core.Base.resumeSignalsDispatchingFalse(this.series_, this.xAxis_, this.yAxis_);
};


/**
 * Renders the chart.
 * @private
 */
anychart.charts.Radar.prototype.drawSeries_ = function() {
  var i;
  var iterator;
  for (var id in this.xScales_) {
    var scale = this.xScales_[id];
    var yScales = {};
    var yScalePositiveSumms = {};
    var yScaleNegativeSumms = {};
    var series = this.seriesOfXScaleMap_[goog.getUid(scale)];
    for (i = 0; i < series.length; i++) {
      var yUid = goog.getUid(series[i].yScale());
      yScales[yUid] = series[i].yScale();
      yScalePositiveSumms[yUid] = 0;
      yScaleNegativeSumms[yUid] = 0;
    }
    var pointClb = function(series) {
      series.drawPoint();
    };
    var missingClb = function(series) {
      series.drawMissing();
    };
    var beforeClb = function(activeSeries) {
      var i;
      for (i = activeSeries.length; i--;) {
        var value = anychart.utils.toNumber(activeSeries[i].getReferenceScaleValues());
        if (activeSeries[i].supportsStack() && value) {
          if (value >= 0)
            yScalePositiveSumms[goog.getUid(activeSeries[i].yScale())] += value;
          else if (value < 0)
            yScaleNegativeSumms[goog.getUid(activeSeries[i].yScale())] += value;
        }
      }
      for (i in yScales) {
        yScales[i].resetStack();
        yScales[i].setStackRange(yScaleNegativeSumms[i], yScalePositiveSumms[i]);
      }
    };
    var afterClb = function() {
      for (var i in yScales) {
        yScalePositiveSumms[i] = 0;
        yScaleNegativeSumms[i] = 0;
      }
    };
    iterator = new anychart.core.utils.OrdinalIterator(series, /** @type {!Array} */(scale.getCategorisation()), pointClb,
        missingClb, beforeClb, afterClb);

    for (i = 0; i < series.length; i++) {
      series[i].startDrawing();
    }
    while (iterator.advance()) {
    }
    for (i = 0; i < series.length; i++)
      series[i].finalizeDrawing();
  }
};


/**
 * Invalidates APPEARANCE for all width-based series.
 * @private
 */
anychart.charts.Radar.prototype.invalidateSeries_ = function() {
  for (var i = this.series_.length; i--;)
    this.series_[i].invalidate(anychart.ConsistencyState.APPEARANCE | anychart.ConsistencyState.HATCH_FILL);
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Legend.
//
//----------------------------------------------------------------------------------------------------------------------
/** @inheritDoc */
anychart.charts.Radar.prototype.createLegendItemsProvider = function() {
  /**
   * @type {!Array.<anychart.core.ui.Legend.LegendItemProvider>}
   */
  var data = [];
  for (var i = 0, count = this.series_.length; i < count; i++) {
    /** @type {anychart.core.radar.series.Base} */
    var series = this.series_[i];
    data.push(series.getLegendItemData());
  }

  return data;
};


//----------------------------------------------------------------------------------------------------------------------
//
//  Defaults.
//
//----------------------------------------------------------------------------------------------------------------------
/** @inheritDoc */
anychart.charts.Radar.prototype.restoreDefaults = function() {
  goog.base(this, 'restoreDefaults');
};


/** @inheritDoc */
anychart.charts.Radar.prototype.serialize = function() {
  var json = goog.base(this, 'serialize');
  var i;
  var scalesIds = {};
  var scales = [];
  var scale;
  var config;
  var objId;

  scalesIds[goog.getUid(this.xScale())] = this.xScale().serialize();
  scales.push(scalesIds[goog.getUid(this.xScale())]);
  json['xScale'] = scales.length - 1;
  if (this.xScale() != this.yScale()) {
    scalesIds[goog.getUid(this.yScale())] = this.yScale().serialize();
    scales.push(scalesIds[goog.getUid(this.yScale())]);
  }
  json['yScale'] = scales.length - 1;

  json['type'] = anychart.enums.ChartTypes.RADAR;
  json['palette'] = this.palette().serialize();
  json['markerPalette'] = this.markerPalette().serialize();
  json['hatchFillPalette'] = this.hatchFillPalette().serialize();
  json['startAngle'] = this.startAngle();

  var grids = [];
  for (i = 0; i < this.grids_.length; i++) {
    var grid = this.grids_[i];
    config = grid.serialize();
    scale = grid.xScale();
    if (scale) {
      objId = goog.getUid(scale);
      if (!scalesIds[objId]) {
        scalesIds[objId] = scale.serialize();
        scales.push(scalesIds[objId]);
        config['xScale'] = scales.length - 1;
      } else {
        config['xScale'] = goog.array.indexOf(scales, scalesIds[objId]);
      }
    }

    scale = grid.yScale();
    if (scale) {
      objId = goog.getUid(scale);
      if (!scalesIds[objId]) {
        scalesIds[objId] = scale.serialize();
        scales.push(scalesIds[objId]);
        config['yScale'] = scales.length - 1;
      } else {
        config['yScale'] = goog.array.indexOf(scales, scalesIds[objId]);
      }
    }
    grids.push(config);
  }
  json['grids'] = grids;

  var minorGrids = [];
  for (i = 0; i < this.minorGrids_.length; i++) {
    var minorGrid = this.minorGrids_[i];
    config = minorGrid.serialize();
    scale = minorGrid.xScale();
    if (scale) {
      objId = goog.getUid(scale);
      if (!scalesIds[objId]) {
        scalesIds[objId] = scale.serialize();
        scales.push(scalesIds[objId]);
        config['xScale'] = scales.length - 1;
      } else {
        config['xScale'] = goog.array.indexOf(scales, scalesIds[objId]);
      }
    }

    scale = minorGrid.yScale();
    if (scale) {
      objId = goog.getUid(scale);
      if (!scalesIds[objId]) {
        scalesIds[objId] = scale.serialize();
        scales.push(scalesIds[objId]);
        config['yScale'] = scales.length - 1;
      } else {
        config['yScale'] = goog.array.indexOf(scales, scalesIds[objId]);
      }
    }
    minorGrids.push(config);
  }
  json['minorGrids'] = minorGrids;

  config = this.xAxis_.serialize();
  scale = this.xAxis_.scale();
  objId = goog.getUid(scale);
  if (!scalesIds[objId]) {
    scalesIds[objId] = scale.serialize();
    scales.push(scalesIds[objId]);
    config['scale'] = scales.length - 1;
  } else {
    config['scale'] = goog.array.indexOf(scales, scalesIds[objId]);
  }
  json['xAxis'] = config;

  config = this.yAxis_.serialize();
  scale = this.yAxis_.scale();
  objId = goog.getUid(scale);
  if (!scalesIds[objId]) {
    scalesIds[objId] = scale.serialize();
    scales.push(scalesIds[objId]);
    config['scale'] = scales.length - 1;
  } else {
    config['scale'] = goog.array.indexOf(scales, scalesIds[objId]);
  }
  json['yAxis'] = config;

  var series = [];
  for (i = 0; i < this.series_.length; i++) {
    var series_ = this.series_[i];
    config = series_.serialize();

    scale = series_.xScale();
    objId = goog.getUid(scale);
    if (!scalesIds[objId]) {
      scalesIds[objId] = scale.serialize();
      scales.push(scalesIds[objId]);
      config['xScale'] = scales.length - 1;
    } else {
      config['xScale'] = goog.array.indexOf(scales, scalesIds[objId]);
    }

    scale = series_.yScale();
    objId = goog.getUid(scale);
    if (!scalesIds[objId]) {
      scalesIds[objId] = scale.serialize();
      scales.push(scalesIds[objId]);
      config['yScale'] = scales.length - 1;
    } else {
      config['yScale'] = goog.array.indexOf(scales, scalesIds[objId]);
    }
    series.push(config);
  }
  json['series'] = series;

  json['scales'] = scales;
  return {'chart': json};
};


/** @inheritDoc */
anychart.charts.Radar.prototype.setupByJSON = function(config) {
  goog.base(this, 'setupByJSON', config);

  this.palette(config['palette']);
  this.markerPalette(config['markerPalette']);
  this.hatchFillPalette(config['hatchFillPalette']);
  this.startAngle(config['startAngle']);

  var i, json, scale;
  var grids = config['grids'];
  var minorGrids = config['minorGrids'];
  var series = config['series'];
  var scales = config['scales'];

  var scalesInstances = {};
  if (goog.isArray(scales)) {
    for (i in scales) {
      if (!scales.hasOwnProperty(i)) continue;
      json = scales[i];
      if (goog.isString(json)) {
        scale = anychart.scales.Base.fromString(json, false);
      } else {
        scale = anychart.scales.Base.fromString(json['type'], false);
        scale.setup(json);
      }
      scalesInstances[i] = scale;
    }
  }

  json = config['xScale'];
  if (goog.isNumber(json) || goog.isString(json)) {
    scale = scalesInstances[json];
  } else if (goog.isObject(json)) {
    scale = anychart.scales.ordinal();
    scale.setup(json);
  } else {
    scale = null;
  }
  if (scale instanceof anychart.scales.Ordinal)
    this.xScale(scale);

  json = config['yScale'];
  if (goog.isNumber(json)) {
    scale = scalesInstances[json];
  } else if (goog.isString(json)) {
    scale = anychart.scales.Base.fromString(json, null);
    if (!scale)
      scale = scalesInstances[json];
  } else if (goog.isObject(json)) {
    scale = anychart.scales.Base.fromString(json['type'], false);
    scale.setup(json);
  } else {
    scale = null;
  }
  if (scale)
    this.yScale(scale);

  json = config['xAxis'];
  this.xAxis(json);
  if (goog.isObject(json) && 'scale' in json) this.xAxis().scale(scalesInstances[json['scale']]);

  json = config['yAxis'];
  this.yAxis(json);
  if (goog.isObject(json) && 'scale' in json) this.yAxis().scale(scalesInstances[json['scale']]);

  if (goog.isArray(grids)) {
    for (i = 0; i < grids.length; i++) {
      json = grids[i];
      this.grid(i, json);
      if (goog.isObject(json)) {
        if ('xScale' in json) this.grid(i).xScale(scalesInstances[json['xScale']]);
        if ('yScale' in json) this.grid(i).yScale(scalesInstances[json['yScale']]);
      }
    }
  }

  if (goog.isArray(minorGrids)) {
    for (i = 0; i < minorGrids.length; i++) {
      json = minorGrids[i];
      this.minorGrid(i, json);
      if (goog.isObject(json)) {
        if ('xScale' in json) this.minorGrid(i).xScale(scalesInstances[json['xScale']]);
        if ('yScale' in json) this.minorGrid(i).yScale(scalesInstances[json['yScale']]);
      }
    }
  }

  if (goog.isArray(series)) {
    for (i = 0; i < series.length; i++) {
      json = series[i];
      var seriesType = (json['seriesType'] || anychart.enums.RadarSeriesType.LINE).toLowerCase();
      var data = json['data'];
      var seriesInst = this.createSeriesByType_(seriesType, data);
      if (seriesInst) {
        if (seriesType == anychart.enums.RadarSeriesType.LINE)
          seriesInst.zIndex(anychart.charts.Radar.ZINDEX_LINE_SERIES);
        seriesInst.setup(json);
        if (goog.isObject(json)) {
          if ('xScale' in json) seriesInst.xScale(scalesInstances[json['xScale']]);
          if ('yScale' in json) seriesInst.yScale(scalesInstances[json['yScale']]);
        }
      }
    }
  }
};


//exports
anychart.charts.Radar.prototype['xScale'] = anychart.charts.Radar.prototype.xScale;//doc|ex
anychart.charts.Radar.prototype['yScale'] = anychart.charts.Radar.prototype.yScale;//doc|ex
anychart.charts.Radar.prototype['grid'] = anychart.charts.Radar.prototype.grid;//doc|ex
anychart.charts.Radar.prototype['minorGrid'] = anychart.charts.Radar.prototype.minorGrid;//doc|ex
anychart.charts.Radar.prototype['xAxis'] = anychart.charts.Radar.prototype.xAxis;//doc|ex
anychart.charts.Radar.prototype['yAxis'] = anychart.charts.Radar.prototype.yAxis;//doc|ex
anychart.charts.Radar.prototype['getSeries'] = anychart.charts.Radar.prototype.getSeries;//doc|ex
anychart.charts.Radar.prototype['area'] = anychart.charts.Radar.prototype.area;//doc|ex
anychart.charts.Radar.prototype['line'] = anychart.charts.Radar.prototype.line;//doc|ex
anychart.charts.Radar.prototype['marker'] = anychart.charts.Radar.prototype.marker;//doc|ex
anychart.charts.Radar.prototype['palette'] = anychart.charts.Radar.prototype.palette;//doc|ex
anychart.charts.Radar.prototype['markerPalette'] = anychart.charts.Radar.prototype.markerPalette;//doc|ex
anychart.charts.Radar.prototype['startAngle'] = anychart.charts.Radar.prototype.startAngle;//doc|ex
