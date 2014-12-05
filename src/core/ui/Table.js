goog.provide('anychart.core.ui.Table');
goog.provide('anychart.core.ui.Table.Cell');
goog.require('acgraph');
goog.require('anychart.color');
goog.require('anychart.core.VisualBaseWithBounds');
goog.require('anychart.core.ui.LabelsFactory');
goog.require('anychart.core.ui.MarkersFactory');
goog.require('anychart.core.utils.Padding');
goog.require('anychart.enums');
goog.require('anychart.utils');



/**
 * Declares table element.<br/>
 * <b>Note:</b> Better to use methods in {@link anychart.ui.table}.
 * @param {number=} opt_rowsCount Number of rows in the table.
 * @param {number=} opt_colsCount Number of columns in the table.
 * @constructor
 * @extends {anychart.core.VisualBaseWithBounds}
 */
anychart.core.ui.Table = function(opt_rowsCount, opt_colsCount) {
  goog.base(this);

  /**
   * Cells array.
   * @type {Array.<anychart.core.ui.Table.Cell>}
   * @private
   */
  this.cells_ = [];

  /**
   * Current columns count.
   * @type {number}
   * @private
   */
  this.colsCount_ = anychart.utils.normalizeToNaturalNumber(opt_colsCount, 4);

  /**
   * Current rows count.
   * @type {number}
   * @private
   */
  this.rowsCount_ = anychart.utils.normalizeToNaturalNumber(opt_rowsCount, 5);

  /**
   * This number tells the table how to rebuild the cells_ array.
   * If it is NaN - nothing to rebuild. In other cases it stores the previous number of columns.
   * @type {number}
   * @private
   */
  this.currentColsCount_ = 0;

  /**
   * Cells that should be disposed.
   * @type {Array.<anychart.core.ui.Table.Cell>}
   * @private
   */
  this.cellsPool_ = [];

  /**
   * Row height settings. Array can contain holes.
   * @type {Array.<number|string>}
   * @private
   */
  this.rowHeightSettings_ = [];

  /**
   * Col width settings. Array can contain holes.
   * @type {Array.<number|string>}
   * @private
   */
  this.colWidthSettings_ = [];

  /**
   * Incremental row heights array. rowBottoms_[i] = rowBottoms_[i-1] + rowHeight[i] in pixels.
   * @type {Array.<number>}
   * @private
   */
  this.rowBottoms_ = [];

  /**
   * Incremental col widths array. colRights_[i] = colRights_[i-1] + colWidth[i] in pixels.
   * @type {Array.<number>}
   * @private
   */
  this.colRights_ = [];

  /**
   * Factory for cell text content wrappers.
   * @type {anychart.core.ui.LabelsFactory}
   * @private
   */
  this.labelsFactory_ = null;

  /**
   * Table layer.
   * @type {acgraph.vector.Layer}
   * @private
   */
  this.layer_ = null;

  /**
   * Cell contents container.
   * @type {acgraph.vector.Layer}
   * @private
   */
  this.contentLayer_ = null;

  /**
   * Internal flag used by table to mark that row heights or col widths changed and should be rebuilt.
   * @type {boolean}
   */
  this.shouldRebuildSizes = true;

  /**
   * Internal flag used by cells to mark that row or col span changed.
   * @type {boolean}
   */
  this.shouldDropOverlap = false;

  /**
   * Internal flag used by cells to mark that table grid changed and should be rebuilt.
   * @type {boolean}
   */
  this.shouldRedrawBorders = true;

  /**
   * Internal flag used by cells to mark that table grid changed and should be rebuilt.
   * @type {boolean}
   */
  this.shouldRedrawFills = true;

  /**
   * Internal flag used by cells to mark that cell content should be redrawn.
   * @type {boolean}
   */
  this.shouldRedrawContent = true;

  /**
   * Border paths dictionary by stroke object hash.
   * @type {Object.<string, !acgraph.vector.Path>}
   * @private
   */
  this.borderPaths_ = null;

  /**
   * Cell fill paths dictionary by fill object hash.
   * @type {Object.<string, !acgraph.vector.Path>}
   * @private
   */
  this.fillPaths_ = null;

  /**
   * Pool of freed paths that can be reused.
   * @type {Array.<acgraph.vector.Path>}
   * @private
   */
  this.pathsPool_ = null;

  /**
   * Default cell fill.
   * @type {acgraph.vector.Fill}
   * @private
   */
  this.cellFill_ = 'none';

  /**
   * Default odd cell fill.
   * @type {acgraph.vector.Fill|undefined}
   * @private
   */
  this.cellOddFill_ = undefined;

  /**
   * Default even cell fill.
   * @type {acgraph.vector.Fill|undefined}
   * @private
   */
  this.cellEvenFill_ = undefined;

  /**
   * Default cell border.
   * @type {acgraph.vector.Stroke}
   * @private
   */
  this.cellBorder_ = acgraph.vector.normalizeStroke('1 black');

  /**
   * Default cell top border.
   * @type {acgraph.vector.Stroke|undefined}
   * @private
   */
  this.cellTopBorder_ = undefined;

  /**
   * Default cell bottom border.
   * @type {acgraph.vector.Stroke|undefined}
   * @private
   */
  this.cellBottomBorder_ = undefined;

  /**
   * Default cell left border.
   * @type {acgraph.vector.Stroke|undefined}
   * @private
   */
  this.cellLeftBorder_ = undefined;

  /**
   * Default cell right border.
   * @type {acgraph.vector.Stroke|undefined}
   * @private
   */
  this.cellRightBorder_ = undefined;

  /**
   * Default cell padding.
   * @type {anychart.core.utils.Padding}
   * @private
   */
  this.cellPadding_ = null;

  /**
   * @type {Array.<anychart.core.ui.Table.CellContent>|undefined}
   * @private
   */
  this.contentToDispose_ = undefined;

  this.cellPadding(0);
};
goog.inherits(anychart.core.ui.Table, anychart.core.VisualBaseWithBounds);


/**
 * Supported consistency states.
 * @type {number}
 */
anychart.core.ui.Table.prototype.SUPPORTED_SIGNALS =
    anychart.core.VisualBaseWithBounds.prototype.SUPPORTED_SIGNALS;


/**
 * Supported consistency states.
 * @type {number}
 */
anychart.core.ui.Table.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.VisualBaseWithBounds.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.APPEARANCE;


/**
 * An instance of {@link anychart.core.ui.LabelsFactory.Label} class, {@link anychart.core.ui.MarkersFactory.Marker} class
 * or {@link anychart.core.VisualBase} class.
 * @includeDoc
 * @typedef {anychart.core.ui.LabelsFactory.Label|anychart.core.ui.MarkersFactory.Marker|anychart.core.VisualBase}
 */
anychart.core.ui.Table.CellContent;


/**
 * Getter for table rows count.
 * @return {number} Current rows count.
 *//**
 * Setter for table rows count.<br/>
 * <b>Note:</b> Calculated from the contents if not defined explicitly.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.rowsCount(3);
 * table.container(stage).draw();
 * @param {number=} opt_value [5] Value to set.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for table rows count.
 * @param {number=} opt_value Rows count to set.
 * @return {!anychart.core.ui.Table|number}
 */
anychart.core.ui.Table.prototype.rowsCount = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = anychart.utils.normalizeToNaturalNumber(opt_value, this.rowsCount_);
    if (this.rowsCount_ != opt_value) {
      if (isNaN(this.currentColsCount_)) // mark that we should rebuild the table
        this.currentColsCount_ = this.colsCount_;
      this.rowsCount_ = opt_value;
      this.shouldDropOverlap = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.rowsCount_;
};


/**
 * Getter for table columns count.
 * @return {number} Current columns count.
 *//**
 * Setter for table columns count..<br/>
 * <b>Note:</b> Calculated from the contents if not defined explicitly.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.colsCount(2);
 * table.container(stage).draw();
 * @param {number=} opt_value [4] Value to set.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for table columns count.
 * @param {number=} opt_value columns count to set.
 * @return {!anychart.core.ui.Table|number}
 */
anychart.core.ui.Table.prototype.colsCount = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = anychart.utils.normalizeToNaturalNumber(opt_value, this.colsCount_);
    if (this.colsCount_ != opt_value) {
      if (isNaN(this.currentColsCount_)) // mark that we should rebuild the table
        this.currentColsCount_ = this.colsCount_;
      this.colsCount_ = opt_value;
      this.shouldDropOverlap = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.colsCount_;
};


/**
 * Getter for row height settings.
 * @param {number} row Row number.
 * @return {string|number|null} Current column width.
 *//**
 * Setter for row height settings. <br/>
 * <b>Note:</b> Pass <b>null</b> to set default value.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.rowHeight(1, 50);
 * table.container(stage).draw();
 * @param {number} row Row number.
 * @param {(string|number|null)=} opt_value Value to set.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for row height settings. Null sets row height to the default value.
 * @param {number} row Row number.
 * @param {(string|number|null)=} opt_value Value to set.
 * @return {string|number|null|anychart.core.ui.Table}
 */
anychart.core.ui.Table.prototype.rowHeight = function(row, opt_value) {
  if (goog.isDef(opt_value)) {
    row = goog.isNull(row) ? NaN : +row;
    if (!isNaN(row) && this.rowHeightSettings_[row] != opt_value) {
      if (goog.isNull(opt_value))
        delete this.rowHeightSettings_[row];
      else
        this.rowHeightSettings_[row] = opt_value;
      this.shouldRebuildSizes = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return row in this.rowHeightSettings_ ? this.rowHeightSettings_[row] : null;
};


/**
 * Getter for column width settings.
 * @param {number} col Column number.
 * @return {string|number|null} Current column width.
 *//**
 * Setter for column width settings. <br/>
 * <b>Note:</b> Pass <b>null</b> to set the default value.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.colWidth(0, 200);
 * table.container(stage).draw();
 * @param {number} col Column number.
 * @param {(string|number|null)=} opt_value Value to set.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for column height settings. Null sets column width to default value.
 * @param {number} col Column number.
 * @param {(string|number|null)=} opt_value Value to set.
 * @return {string|number|null|anychart.core.ui.Table}
 */
anychart.core.ui.Table.prototype.colWidth = function(col, opt_value) {
  if (goog.isDef(opt_value)) {
    col = goog.isNull(col) ? NaN : +col;
    if (!isNaN(col) && this.colWidthSettings_[col] != opt_value) {
      if (goog.isNull(opt_value))
        delete this.colWidthSettings_[col];
      else
        this.colWidthSettings_[col] = opt_value;
      this.shouldRebuildSizes = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return col in this.colWidthSettings_ ? this.colWidthSettings_[col] : null;
};


/**
 * Returns cell by its row and column number.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * var cell = table.getCell(1,1);
 * cell.content( anychart.ui.label().text('Text element'));
 * table.container(stage).draw();
 * @param {number} row Row index.
 * @param {number} col Coumn index.
 * @return {anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 */
anychart.core.ui.Table.prototype.getCell = function(row, col) {
  this.checkTable_();
  // defaulting to NaN to return null when incorrect arguments are passed.
  row = anychart.utils.normalizeToNaturalNumber(row, NaN, true);
  col = anychart.utils.normalizeToNaturalNumber(col, NaN, true);
  return this.cells_[row * this.colsCount_ + col] || null;
};


/**
 * Getter for table content.<br/>
 * <b>Note:</b> Returns cells content ignored rowSpan and colSpan.
 * @return {Array.<Array.<(anychart.core.ui.Table.CellContent)>>} Current table content.
 *//**
 * Setter for table content.<br/>
 * <b>Note:</b> Pass <b>null</b> to drop table content.
 * @example
 * var dataSet = [
 *   [1.1, 2.3, 1.7, 1.9],
 *   [1.2, 2.1, 2.7, 1.3],
 *   [1.0, 1.2, 0.7, 1.1],
 *   [1.3, 2.4, 1.7, 1.9]
 * ];
 * var pie = anychart.pie(dataSet).legend(null);
 * var palette = pie.palette().colors();
 * var table = anychart.ui.table();
 * table.contents([
 *     [pie, anychart.core.cartesian.series.line(dataSet[0]).color(palette[0])],
 *     [null, anychart.core.cartesian.series.line(dataSet[1]).color(palette[1])],
 *     [null, anychart.core.cartesian.series.line(dataSet[2]).color(palette[2])],
 *     [null, anychart.core.cartesian.series.line(dataSet[3]).color(palette[3])]
 * ]);
 * table.getCell(0,0).rowSpan(4);
 * table.container(stage).draw();
 * @param {Array.<Array.<(anychart.core.ui.Table.CellContent|string|number|undefined)>>=} opt_tableValues Values to set.
 * @param {boolean=} opt_demergeCells [false] Pass <b>true</b> to demerge all cells.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {Array.<Array.<(anychart.core.ui.Table.CellContent|string|number|undefined)>>=} opt_tableValues
 * @param {boolean=} opt_demergeCells
 * @return {Array.<Array.<(anychart.core.ui.Table.CellContent)>>|anychart.core.ui.Table}
 */
anychart.core.ui.Table.prototype.contents = function(opt_tableValues, opt_demergeCells) {
  var row, col, cell, rowArr;
  if (goog.isDef(opt_tableValues)) {
    var fail = !goog.isArray(opt_tableValues);
    var colsCount = 0, rowsCount;
    if (!fail) {
      rowsCount = opt_tableValues.length;
      for (row = 0; row < rowsCount; row++) {
        rowArr = opt_tableValues[row];
        if (goog.isArray(rowArr)) {
          if (rowArr.length > colsCount)
            colsCount = rowArr.length;
        } else {
          fail = true;
          break;
        }
      }
    }
    if (fail || !rowsCount || !colsCount) {
      anychart.utils.error(anychart.enums.ErrorCode.WRONG_TABLE_CONTENTS);
    } else {
      this.suspendSignalsDispatching();
      this.rowsCount(rowsCount);
      this.colsCount(colsCount);
      if (!!opt_demergeCells) {
        for (row = 0; row < rowsCount; row++) {
          for (col = 0; col < colsCount; col++) {
            cell = this.getCell(row, col);
            cell.rowSpan(1);
            cell.colSpan(1);
          }
        }
      }
      for (row = 0; row < rowsCount; row++) {
        rowArr = opt_tableValues[row];
        for (col = 0; col < colsCount; col++) {
          cell = this.getCell(row, col);
          cell.content(rowArr[col] || null);
        }
      }
      this.resumeSignalsDispatching(true);
    }
    return this;
  } else {
    // we have no cache here, because we want to return new arrays here anyway. So caching is useless.
    var result = [];
    for (row = 0; row < this.rowsCount_; row++) {
      rowArr = [];
      for (col = 0; col < this.colsCount_; col++) {
        rowArr.push(this.getCell(row, col).content());
      }
      result.push(rowArr);
    }
    return result;
  }
};


//region Cell settings
//----------------------------------------------------------------------------------------------------------------------
//
//  Cell settings
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter for table cell text factory.
 * @return {anychart.core.ui.LabelsFactory|anychart.core.ui.Table} Current table text factory.
 *//**
 * You can setup the default text appearance for entire table.
 * These settings apply to cells with content set as string or number. If you want to set text appearance
 * for the particular cell, set cell content as string first, and then feel free to get the content and tune it.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * var textSettings = anychart.ui.labelsFactory();
 * textSettings.fontColor('blue');
 * textSettings.fontWeight('bold');
 * textSettings.fontSize(13);
 * table.cellTextFactory(textSettings);
 * table.container(stage).draw();
 * @shortDescription Setter for table cell text factory.
 * @param {anychart.core.ui.LabelsFactory=} opt_value
 * @return {anychart.core.ui.LabelsFactory|anychart.core.ui.Table}
 *//**
 * @ignoreDoc
 * Getter and setter for table cell text factory.
 * @param {anychart.core.ui.LabelsFactory=} opt_value
 * @return {anychart.core.ui.LabelsFactory|anychart.core.ui.Table}
 */
anychart.core.ui.Table.prototype.cellTextFactory = function(opt_value) {
  if (!this.labelsFactory_) {
    this.labelsFactory_ = new anychart.core.ui.LabelsFactory();
    this.labelsFactory_.anchor(anychart.enums.Anchor.CENTER);
    this.labelsFactory_.position(anychart.enums.Position.CENTER);
    this.registerDisposable(this.labelsFactory_);
  }
  if (goog.isDef(opt_value)) {
    var shouldRedraw = true;
    if (opt_value instanceof anychart.core.ui.LabelsFactory) {
      this.labelsFactory_.setup(opt_value.serialize());
    } else if (goog.isObject(opt_value)) {
      this.labelsFactory_.setup(opt_value);
    } else if (anychart.utils.isNone(opt_value)) {
      this.labelsFactory_.enabled(false);
    } else {
      shouldRedraw = false;
    }
    if (shouldRedraw) {
      this.shouldRedrawContent = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.labelsFactory_;
};


/**
 * Getter for the cell padding settings.
 * @return {anychart.core.utils.Padding} {@link anychart.core.utils.Padding} instance for method chaining.
 *//**
 * Setter for the cell paddings in pixels using a single value.<br/>
 * @example <t>listingOnly</t>
 * // all paddings 15px
 * table.cellPadding(15);
 * // all paddings 15px
 * table.cellPadding('15px');
 * // top and bottom 5px ,right and left 15px
 * table.cellPadding(anychart.utils.space(5,15));
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellPadding(10);
 * table.container(stage).draw();
 * @param {(string|number|anychart.core.utils.Space)=} opt_value Value to set.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Setter for the cell paddings in pixels using several numbers.<br/>
 * @example <t>listingOnly</t>
 * // 1) top and bottom 10px, left and right 15px
 * table.cellPadding(10, '15px');
 * // 2) top 10px, left and right 15px, bottom 5px
 * table.cellPadding(10, '15px', 5);
 * // 3) top 10px, right 15px, bottom 5px, left 12px
 * table.cellPadding(10, '15px', '5px', 12);
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellPadding(10, '15px', '5px', 12);
 * table.container(stage).draw();
 * @param {(string|number)=} opt_value1 Top or top-bottom space.
 * @param {(string|number)=} opt_value2 Right or right-left space.
 * @param {(string|number)=} opt_value3 Bottom space.
 * @param {(string|number)=} opt_value4 Left space.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * Cell padding settings.
 * @param {(string|number|Object|anychart.core.utils.Space)=} opt_spaceOrTopOrTopAndBottom .
 * @param {(string|number)=} opt_rightOrRightAndLeft .
 * @param {(string|number)=} opt_bottom .
 * @param {(string|number)=} opt_left .
 * @return {anychart.core.ui.Table|anychart.core.utils.Padding} .
 */
anychart.core.ui.Table.prototype.cellPadding = function(opt_spaceOrTopOrTopAndBottom, opt_rightOrRightAndLeft, opt_bottom, opt_left) {
  if (!this.cellPadding_) {
    this.cellPadding_ = new anychart.core.utils.Padding();
    this.cellPadding_.listenSignals(this.cellPaddingInvalidated_, this);
    this.registerDisposable(this.cellPadding_);
  }

  if (goog.isDef(opt_spaceOrTopOrTopAndBottom)) {
    this.cellPadding_.setup.apply(this.cellPadding_, arguments);
    return this;
  } else {
    return this.cellPadding_;
  }
};


/**
 * Getter for current series fill color.
 * @return {!acgraph.vector.Fill} Current fill color.
 *//**
 * Sets fill settings using an object or a string.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <c>Solid fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill('green 0.2');
 * table.container(stage).draw();
 * @example <c>Linear gradient fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill(['green 0.2', 'yellow 0.2']);
 * table.container(stage).draw();
 * @param {acgraph.vector.Fill} value [null] Color as an object or a string.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Fill color with opacity.<br/>
 * <b>Note:</b> If color is set as a string (e.g. 'red .5') it has a priority over opt_opacity, which
 * means: <b>color</b> set like this <b>rect.fill('red 0.3', 0.7)</b> will have 0.3 opacity.
 * @shortDescription Fill as a string or an object.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill('green', 0.3);
 * table.container(stage).draw();
 * @param {string} color Color as a string.
 * @param {number=} opt_opacity Color opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Linear gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill(['black', 'yellow'], 45, true, 0.5);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Gradient keys.
 * @param {number=} opt_angle Gradient angle.
 * @param {(boolean|!acgraph.vector.Rect|!{left:number,top:number,width:number,height:number})=} opt_mode Gradient mode.
 * @param {number=} opt_opacity Gradient opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Radial gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill(['black', 'yellow'], .5, .5, null, .9, 0.3, 0.81);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Color-stop gradient keys.
 * @param {number} cx X ratio of center radial gradient.
 * @param {number} cy Y ratio of center radial gradient.
 * @param {acgraph.math.Rect=} opt_mode If defined then userSpaceOnUse mode, else objectBoundingBox.
 * @param {number=} opt_opacity Opacity of the gradient.
 * @param {number=} opt_fx X ratio of focal point.
 * @param {number=} opt_fy Y ratio of focal point.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Image fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellFill({
 *    src: 'http://static.anychart.com/underwater.jpg',
 *    mode: acgraph.vector.ImageFillMode.STRETCH
 * });
 * table.container(stage).draw();
 * @param {!acgraph.vector.Fill} imageSettings Object with settings.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(!acgraph.vector.Fill|!Array.<(acgraph.vector.GradientKey|string)>|Function|null)=} opt_fillOrColorOrKeys .
 * @param {number=} opt_opacityOrAngleOrCx .
 * @param {(number|boolean|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number})=} opt_modeOrCy .
 * @param {(number|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number}|null)=} opt_opacityOrMode .
 * @param {number=} opt_opacity .
 * @param {number=} opt_fx .
 * @param {number=} opt_fy .
 * @return {acgraph.vector.Fill|anychart.core.ui.Table|Function} .
 */
anychart.core.ui.Table.prototype.cellFill = function(opt_fillOrColorOrKeys, opt_opacityOrAngleOrCx, opt_modeOrCy, opt_opacityOrMode, opt_opacity, opt_fx, opt_fy) {
  if (goog.isDef(opt_fillOrColorOrKeys)) {
    var shouldInvalidate = false;
    if (this.cellOddFill_ || this.cellEvenFill_) {
      this.cellOddFill_ = undefined;
      this.cellEvenFill_ = undefined;
      shouldInvalidate = true;
    }
    var fill = acgraph.vector.normalizeFill.apply(null, arguments);
    if (fill != this.cellFill_) {
      this.cellFill_ = fill;
      shouldInvalidate = true;
    }
    if (shouldInvalidate) {
      this.shouldRedrawFills = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellFill_;
};


/**
 * Getter for current series fill color.
 * @return {!acgraph.vector.Fill} Current fill color.
 *//**
 * Sets fill settings using an object or a string.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <c>Solid fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill('green 0.2');
 * table.container(stage).draw();
 * @example <c>Linear gradient fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill(['green 0.2', 'yellow 0.2']);
 * table.container(stage).draw();
 * @param {acgraph.vector.Fill} value [null] Color as an object or a string.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Fill color with opacity.<br/>
 * <b>Note:</b> If color is set as a string (e.g. 'red .5') it has a priority over opt_opacity, which
 * means: <b>color</b> set like this <b>rect.fill('red 0.3', 0.7)</b> will have 0.3 opacity.
 * @shortDescription Fill as a string or an object.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill('green', 0.3);
 * table.container(stage).draw();
 * @param {string} color Color as a string.
 * @param {number=} opt_opacity Color opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Linear gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill(['black', 'yellow'], 45, true, 0.5);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Gradient keys.
 * @param {number=} opt_angle Gradient angle.
 * @param {(boolean|!acgraph.vector.Rect|!{left:number,top:number,width:number,height:number})=} opt_mode Gradient mode.
 * @param {number=} opt_opacity Gradient opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Radial gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill(['black', 'yellow'], .5, .5, null, .9, 0.3, 0.81);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Color-stop gradient keys.
 * @param {number} cx X ratio of center radial gradient.
 * @param {number} cy Y ratio of center radial gradient.
 * @param {acgraph.math.Rect=} opt_mode If defined then userSpaceOnUse mode, else objectBoundingBox.
 * @param {number=} opt_opacity Opacity of the gradient.
 * @param {number=} opt_fx X ratio of focal point.
 * @param {number=} opt_fy Y ratio of focal point.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Image fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill({
 *    src: 'http://static.anychart.com/underwater.jpg',
 *    mode: acgraph.vector.ImageFillMode.STRETCH
 * });
 * table.container(stage).draw();
 * @param {!acgraph.vector.Fill} imageSettings Object with settings.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(!acgraph.vector.Fill|!Array.<(acgraph.vector.GradientKey|string)>|Function|null)=} opt_fillOrColorOrKeys .
 * @param {number=} opt_opacityOrAngleOrCx .
 * @param {(number|boolean|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number})=} opt_modeOrCy .
 * @param {(number|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number}|null)=} opt_opacityOrMode .
 * @param {number=} opt_opacity .
 * @param {number=} opt_fx .
 * @param {number=} opt_fy .
 * @return {acgraph.vector.Fill|anychart.core.ui.Table|undefined} .
 */
anychart.core.ui.Table.prototype.cellOddFill = function(opt_fillOrColorOrKeys, opt_opacityOrAngleOrCx, opt_modeOrCy, opt_opacityOrMode, opt_opacity, opt_fx, opt_fy) {
  if (goog.isDef(opt_fillOrColorOrKeys)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_fillOrColorOrKeys)) {
      this.cellOddFill_ = undefined;
      shouldInvalidate = true;
    } else {
      var fill = acgraph.vector.normalizeFill.apply(null, arguments);
      if (fill != this.cellOddFill_) {
        this.cellOddFill_ = fill;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawFills = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellOddFill_;
};


/**
 * Getter for current series fill color.
 * @return {!acgraph.vector.Fill} Current fill color.
 *//**
 * Sets fill settings using an object or a string.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <c>Solid fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellEvenFill('green 0.2');
 * table.container(stage).draw();
 * @example <c>Linear gradient fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellOddFill(['green 0.2', 'yellow 0.2']);
 * table.container(stage).draw();
 * @param {acgraph.vector.Fill} value [null] Color as an object or a string.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Fill color with opacity.<br/>
 * <b>Note:</b> If color is set as a string (e.g. 'red .5') it has a priority over opt_opacity, which
 * means: <b>color</b> set like this <b>rect.fill('red 0.3', 0.7)</b> will have 0.3 opacity.
 * @shortDescription Fill as a string or an object.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellEvenFill('green', 0.3);
 * table.container(stage).draw();
 * @param {string} color Color as a string.
 * @param {number=} opt_opacity Color opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Linear gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellEvenFill(['black', 'yellow'], 45, true, 0.5);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Gradient keys.
 * @param {number=} opt_angle Gradient angle.
 * @param {(boolean|!acgraph.vector.Rect|!{left:number,top:number,width:number,height:number})=} opt_mode Gradient mode.
 * @param {number=} opt_opacity Gradient opacity.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Radial gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellEvenFill(['black', 'yellow'], .5, .5, null, .9, 0.3, 0.81);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Color-stop gradient keys.
 * @param {number} cx X ratio of center radial gradient.
 * @param {number} cy Y ratio of center radial gradient.
 * @param {acgraph.math.Rect=} opt_mode If defined then userSpaceOnUse mode, else objectBoundingBox.
 * @param {number=} opt_opacity Opacity of the gradient.
 * @param {number=} opt_fx X ratio of focal point.
 * @param {number=} opt_fy Y ratio of focal point.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * Image fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellEvenFill({
 *    src: 'http://static.anychart.com/underwater.jpg',
 *    mode: acgraph.vector.ImageFillMode.STRETCH
 * });
 * table.container(stage).draw();
 * @param {!acgraph.vector.Fill} imageSettings Object with settings.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(!acgraph.vector.Fill|!Array.<(acgraph.vector.GradientKey|string)>|Function|null)=} opt_fillOrColorOrKeys .
 * @param {number=} opt_opacityOrAngleOrCx .
 * @param {(number|boolean|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number})=} opt_modeOrCy .
 * @param {(number|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number}|null)=} opt_opacityOrMode .
 * @param {number=} opt_opacity .
 * @param {number=} opt_fx .
 * @param {number=} opt_fy .
 * @return {acgraph.vector.Fill|anychart.core.ui.Table|undefined} .
 */
anychart.core.ui.Table.prototype.cellEvenFill = function(opt_fillOrColorOrKeys, opt_opacityOrAngleOrCx, opt_modeOrCy, opt_opacityOrMode, opt_opacity, opt_fx, opt_fy) {
  if (goog.isDef(opt_fillOrColorOrKeys)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_fillOrColorOrKeys)) {
      this.cellEvenFill_ = undefined;
      shouldInvalidate = true;
    } else {
      var fill = acgraph.vector.normalizeFill.apply(null, arguments);
      if (fill != this.cellEvenFill_) {
        this.cellEvenFill_ = fill;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawFills = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellEvenFill_;
};


/**
 * Getter for current cell border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> The last usage of leftBorder(), rightBorder(), topBorder() and bottomBorder() methods determines
 * the border for the corresponding side.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.prototype.cellBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
    if (stroke != this.cellBorder_) {
      this.cellBorder_ = stroke;
      this.shouldRedrawBorders = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellBorder_;
};


/**
 * Getter for current cell left border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell left border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> The last usage of leftBorder(), rightBorder(), topBorder() and bottomBorder() methods determines
 * the border for the corresponding side.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell left border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellLeftBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.prototype.cellLeftBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.cellLeftBorder_) {
        this.cellLeftBorder_ = undefined;
        shouldInvalidate = true;
      }
    } else {
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.cellLeftBorder_) {
        this.cellLeftBorder_ = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawBorders = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellLeftBorder_;
};


/**
 * Getter for current cell right border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell right border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> The last usage of leftBorder(), rightBorder(), topBorder() and bottomBorder() methods determines
 * the border for the corresponding side.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell right border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellRightBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.prototype.cellRightBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.cellRightBorder_) {
        this.cellRightBorder_ = undefined;
        shouldInvalidate = true;
      }
    } else {
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.cellRightBorder_) {
        this.cellRightBorder_ = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawBorders = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellRightBorder_;
};


/**
 * Getter for current cell top border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell top border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> The last usage of leftBorder(), rightBorder(), topBorder() and bottomBorder() methods determines
 * the border for the corresponding side.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell top border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellTopBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.prototype.cellTopBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.cellTopBorder_) {
        this.cellTopBorder_ = undefined;
        shouldInvalidate = true;
      }
    } else {
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.cellTopBorder_) {
        this.cellTopBorder_ = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawBorders = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellTopBorder_;
};


/**
 * Getter for current cell bottom border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell bottom border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> The last usage of leftBorder(), rightBorder(), topBorder() and bottomBorder() methods determines
 * the border for the corresponding side.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell bottom border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11]]);
 * table.cellBottomBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.prototype.cellBottomBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.cellBottomBorder_) {
        this.cellBottomBorder_ = undefined;
        shouldInvalidate = true;
      }
    } else {
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.cellBottomBorder_) {
        this.cellBottomBorder_ = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.shouldRedrawBorders = true;
      this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.cellBottomBorder_;
};
//endregion


/**
 * Draws the table.
 * @return {anychart.core.ui.Table} {@link anychart.core.ui.Table} instance for method chaining.
 */
anychart.core.ui.Table.prototype.draw = function() {
  if (!this.checkDrawingNeeded())
    return this;

  if (!this.layer_) {
    this.layer_ = acgraph.layer();
    this.contentLayer_ = this.layer_.layer();
    this.registerDisposable(this.layer_);
    this.registerDisposable(this.contentLayer_);
  }

  var stage = this.layer_.getStage();
  var manualSuspend = stage && !stage.isSuspended();
  if (manualSuspend) stage.suspend();

  if (this.hasInvalidationState(anychart.ConsistencyState.BOUNDS)) {
    this.shouldRebuildSizes = true; // if sizes changed, it will be checked in drawing
    this.invalidate(anychart.ConsistencyState.APPEARANCE);
    this.markConsistent(anychart.ConsistencyState.BOUNDS);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.APPEARANCE)) {
    if (this.labelsFactory_) // we don't want to create it if no cell use it
      this.labelsFactory_.suspendSignalsDispatching();
    this.checkTable_();
    this.checkSizes_();
    this.checkOverlap_();
    this.checkFills_();
    this.checkBorders_();
    this.checkContent_();
    if (this.labelsFactory_)
      this.labelsFactory_.resumeSignalsDispatching(false);
    this.markConsistent(anychart.ConsistencyState.APPEARANCE);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.Z_INDEX)) {
    this.layer_.zIndex(/** @type {number} */(this.zIndex()));
    this.markConsistent(anychart.ConsistencyState.Z_INDEX);
  }

  if (this.hasInvalidationState(anychart.ConsistencyState.CONTAINER)) {
    this.layer_.parent(/** @type {acgraph.vector.ILayer} */(this.container()));
    if (this.container() && this.container().getStage()) {
      //listen resize event
      stage = this.container().getStage();
      if (this.bounds().dependsOnContainerSize()) {
        this.container().getStage().listen(
            acgraph.vector.Stage.EventType.STAGE_RESIZE,
            this.resizeHandler_,
            false,
            this
        );
      } else {
        this.container().getStage().unlisten(
            acgraph.vector.Stage.EventType.STAGE_RESIZE,
            this.resizeHandler_,
            false,
            this
        );
      }
    }
    this.markConsistent(anychart.ConsistencyState.CONTAINER);
  }

  if (manualSuspend) stage.resume();

  //todo(Anton Saukh): refactor this mess!
  this.listenSignals(this.invalidateHandler_, this);
  //end mess

  return this;
};


/**
 * @private
 */
anychart.core.ui.Table.prototype.resizeHandler_ = function() {
  this.invalidate(anychart.ConsistencyState.BOUNDS, anychart.Signal.NEEDS_REDRAW | anychart.Signal.BOUNDS_CHANGED);
};


/**
 * @private
 */
anychart.core.ui.Table.prototype.invalidateHandler_ = function() {
  anychart.globalLock.onUnlock(this.draw, this);
};


//region Drawing phases
//----------------------------------------------------------------------------------------------------------------------
//
//  Drawing phases
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Rebuilds table, applying new rows and cols count.
 * @private
 */
anychart.core.ui.Table.prototype.checkTable_ = function() {
  if (isNaN(this.currentColsCount_))
    return;
  var newCells = [];
  var currentRowsCount = this.currentColsCount_ ? this.cells_.length / this.currentColsCount_ : 0;
  var row, col;
  var rowsFromCells = Math.min(currentRowsCount, this.rowsCount_);
  var colsFromCells = Math.min(this.currentColsCount_, this.colsCount_);
  for (row = 0; row < rowsFromCells; row++) { // processing rows that are both in current in new tables
    for (col = 0; col < colsFromCells; col++) // adding cells from current cells_ array.
      newCells.push(this.cells_[row * this.colsCount_ + col]);
    for (col = colsFromCells; col < this.colsCount_; col++) // adding new cells to the row if needed.
      newCells.push(this.allocCell_(row, col));
    for (col = colsFromCells; col < this.currentColsCount_; col++) // clearing cells that are not needed anymore.
      this.freeCell_(this.cells_[row * this.colsCount_ + col]);
  }

  for (row = rowsFromCells; row < this.rowsCount_; row++) { // rows that should be added entirely
    for (col = 0; col < this.colsCount_; col++) // adding new cells if needed.
      newCells.push(this.allocCell_(row, col));
  }

  for (row = rowsFromCells; row < currentRowsCount; row++) { // rows that should be removed entirely
    for (col = 0; col < this.currentColsCount_; col++) // clearing cells that are not needed anymore.
      this.freeCell_(this.cells_[row * this.colsCount_ + col]);
  }

  this.cells_ = newCells;
  this.currentColsCount_ = NaN;
  this.shouldRebuildSizes = true;
  this.shouldDropOverlap = true;
  this.shouldRedrawBorders = true;
  this.shouldRedrawFills = true;
  this.shouldRedrawContent = true;
};


/**
 * Rebuilds cell sizes.
 * @private
 */
anychart.core.ui.Table.prototype.checkSizes_ = function() {
  if (this.shouldRebuildSizes) {
    var newColRights = new Array(this.colsCount_);
    var newRowBottoms = new Array(this.rowsCount_);
    var i, len, val, size, needsRedraw = false;
    var pixelBounds = this.getPixelBounds();

    var distributedSize = 0;
    var fixedSizes = [];
    var autoSizesCount = 0;
    var tableSize = pixelBounds.width;
    for (i = 0, len = this.colsCount_; i < len; i++) {
      size = anychart.utils.normalizeSize(this.colWidthSettings_[i], tableSize);
      if (isNaN(size)) {
        autoSizesCount++;
      } else {
        distributedSize += size;
        fixedSizes[i] = size;
      }
    }
    // min to 3px per autoColumn to make them visible, but not good-looking.
    var autoSize = Math.max(3 * autoSizesCount, tableSize - distributedSize) / autoSizesCount;
    var current = 0;
    for (i = 0, len = this.colsCount_; i < len; i++) {
      if (i in fixedSizes)
        size = fixedSizes[i];
      else
        size = autoSize;
      current += size;
      val = Math.round(current) - 1;
      newColRights[i] = val;
      if (val != this.colRights_[i]) needsRedraw = true;
    }

    distributedSize = 0;
    fixedSizes.length = 0;
    autoSizesCount = 0;
    tableSize = pixelBounds.height;
    for (i = 0, len = this.rowsCount_; i < len; i++) {
      size = anychart.utils.normalizeSize(this.rowHeightSettings_[i], tableSize);
      if (isNaN(size)) {
        autoSizesCount++;
      } else {
        distributedSize += size;
        fixedSizes[i] = size;
      }
    }
    // min to 3px per autorow to make them visible, but not good-looking.
    autoSize = Math.max(3 * autoSizesCount, tableSize - distributedSize) / autoSizesCount;
    current = 0;
    for (i = 0, len = this.rowsCount_; i < len; i++) {
      if (i in fixedSizes)
        size = fixedSizes[i];
      else
        size = autoSize;
      current += size;
      val = Math.round(current) - 1;
      newRowBottoms[i] = val;
      if (val != this.rowBottoms_[i]) needsRedraw = true;
    }

    this.shouldRebuildSizes = false;
    if (needsRedraw) {
      this.colRights_ = newColRights;
      this.rowBottoms_ = newRowBottoms;
      this.shouldRedrawBorders = true;
      this.shouldRedrawFills = true;
      this.shouldRedrawContent = true;
    }
  }
};


/**
 * Renews overlapping cells marking.
 * @private
 */
anychart.core.ui.Table.prototype.checkOverlap_ = function() {
  if (this.shouldDropOverlap) {
    var i, j;
    for (i = 0; i < this.cells_.length; i++) {
      this.cells_[i].overlapper = NaN;
    }
    for (var row = 0; row < this.rowsCount_; row++) {
      for (var col = 0; col < this.colsCount_; col++) {
        var index = row * this.colsCount_ + col;
        var cell = this.cells_[index];
        if (isNaN(cell.overlapper) && (cell.colSpan() > 1 || cell.rowSpan() > 1)) {
          for (i = Math.min(this.rowsCount_, row + cell.rowSpan()); i-- > row;) {
            for (j = Math.min(this.colsCount_, col + cell.colSpan()); j-- > col;) {
              this.cells_[i * this.colsCount_ + j].overlapper = index;
            }
          }
          cell.overlapper = NaN;
        }
      }
    }
    this.shouldDropOverlap = false;
    this.shouldRedrawBorders = true;
    this.shouldRedrawFills = true;
    this.shouldRedrawContent = true;
  }
};


/**
 * Redraws cell filling.
 * @private
 */
anychart.core.ui.Table.prototype.checkFills_ = function() {
  if (this.shouldRedrawFills) {
    this.resetFillPaths_();
    for (var row = 0; row < this.rowsCount_; row++) {
      for (var col = 0; col < this.colsCount_; col++) {
        var cell = this.cells_[row * this.colsCount_ + col];
        if (isNaN(cell.overlapper)) {
          var bounds = this.getCellBounds(row, col,
              /** @type {number} */(cell.rowSpan()),
              /** @type {number} */(cell.colSpan()), bounds); // rect will be created one time and then reused
          var fill = this.getCellFill_(cell, row);
          if (fill) {
            var path = this.getFillPath_(fill);
            var l = bounds.getLeft(), r = bounds.getRight() + 1, t = bounds.getTop(), b = bounds.getBottom() + 1;
            path.moveTo(l, t);
            path.lineTo(r, t);
            path.lineTo(r, b);
            path.lineTo(l, b);
            path.close();
          }
        }
      }
    }
    this.shouldRedrawFills = false;
  }
};


/**
 * Redraws cell filling.
 * @private
 */
anychart.core.ui.Table.prototype.checkBorders_ = function() {
  if (this.shouldRedrawBorders) {
    this.resetBorderPaths_();
    var row, col, cell1, cell2, index;
    // drawing top borders for top cells
    for (col = 0; col < this.colsCount_; col++) {
      cell1 = this.cells_[col];
      if (isNaN(cell1.overlapper))
        this.drawBorder_(0, col, 1, /** @type {number} */(cell1.colSpan()),
            this.getCellHorizontalBorder_(undefined, cell1), 0);
    }
    // drawing left borders for left cells
    for (row = 0; row < this.rowsCount_; row++) {
      cell1 = this.cells_[row * this.colsCount_];
      if (isNaN(cell1.overlapper))
        this.drawBorder_(row, 0, /** @type {number} */(cell1.rowSpan()), 1,
            this.getCellVerticalBorder_(undefined, cell1), 3);
    }
    // drawing right and bottom borders for all cells
    for (row = 0; row < this.rowsCount_; row++) {
      for (col = 0; col < this.colsCount_; col++) {
        // bottom border
        index = row * this.colsCount_ + col;
        cell1 = this.cells_[index]; // always exists
        cell2 = this.cells_[index + this.colsCount_]; // can be undefined if this is a last row
        if (cell2) {
          if (isNaN(cell1.overlapper)) {
            if (!isNaN(cell2.overlapper)) {
              if (cell2.overlapper == index)
                cell1 = cell2 = undefined;
              else
                cell2 = this.cells_[cell2.overlapper];
            }
          } else {
            if (isNaN(cell2.overlapper)) {
              cell1 = this.cells_[cell1.overlapper];
            } else {
              if (cell1.overlapper == cell2.overlapper) {
                cell1 = cell2 = undefined;
              } else {
                cell1 = this.cells_[cell1.overlapper];
                cell2 = this.cells_[cell2.overlapper];
              }
            }
          }
        } else if (!isNaN(cell1.overlapper))
          cell1 = this.cells_[cell1.overlapper];
        this.drawBorder_(row, col, 1, 1, this.getCellHorizontalBorder_(cell1, cell2), 2);
        // right border
        index = row * this.colsCount_ + col;
        cell1 = this.cells_[index]; // always exists
        cell2 = ((col + 1) == this.colsCount_) ? undefined : this.cells_[index + 1]; // can be undefined if this is a last col
        if (cell2) {
          if (isNaN(cell1.overlapper)) {
            if (!isNaN(cell2.overlapper)) {
              if (cell2.overlapper == index)
                cell1 = cell2 = undefined;
              else
                cell2 = this.cells_[cell2.overlapper];
            }
          } else {
            if (isNaN(cell2.overlapper)) {
              cell1 = this.cells_[cell1.overlapper];
            } else {
              if (cell1.overlapper == cell2.overlapper) {
                cell1 = cell2 = undefined;
              } else {
                cell1 = this.cells_[cell1.overlapper];
                cell2 = this.cells_[cell2.overlapper];
              }
            }
          }
        } else if (!isNaN(cell1.overlapper))
          cell1 = this.cells_[cell1.overlapper];
        this.drawBorder_(row, col, 1, 1, this.getCellVerticalBorder_(cell1, cell2), 1);
      }
    }
    this.shouldRedrawBorders = false;
  }
};


/**
 * Draws table cells content.
 * @private
 */
anychart.core.ui.Table.prototype.checkContent_ = function() {
  var content, bounds, label, marker;
  if (this.shouldRedrawContent) {
    if (this.contentToDispose_) {
      while (this.contentToDispose_.length) {
        content = this.contentToDispose_.pop();
        content.suspendSignalsDispatching();
        if (content instanceof anychart.core.ui.LabelsFactory.Label) {
          label = /** @type {anychart.core.ui.LabelsFactory.Label} */(content);
          if (label.parentLabelsFactory())
            label.parentLabelsFactory().clear(label.getIndex());
        } else if (content instanceof anychart.core.ui.MarkersFactory.Marker) {
          marker = /** @type {anychart.core.ui.MarkersFactory.Marker} */(content);
          if (marker.parentMarkersFactory())
            marker.parentMarkersFactory().clear(marker.getIndex());
        } else if (content instanceof anychart.core.VisualBase) {
          if (content instanceof anychart.core.Chart)
            (/** @type {anychart.core.Chart} */(content)).autoRedraw(true);
          content.container(null);
          content.remove();
          // no draw here to avoid drawing in to a null container
        }
        content.resumeSignalsDispatching(false);
      }
    }

    for (var row = 0; row < this.rowsCount_; row++) {
      for (var col = 0; col < this.colsCount_; col++) {
        var cell = this.cells_[row * this.colsCount_ + col];
        content = /** @type {anychart.core.ui.Table.CellContent} */(cell.content());
        if (content) {
          if (isNaN(cell.overlapper)) {
            bounds = this.getCellBounds(row, col,
                /** @type {number} */(cell.rowSpan()), /** @type {number} */(cell.colSpan()), bounds);
            var padding = cell.getPaddingOverride() || this.cellPadding_;
            bounds = padding.tightenBounds(bounds);
            content.suspendSignalsDispatching();
            content.container(this.contentLayer_);
            if (content instanceof anychart.core.ui.LabelsFactory.Label) {
              label = /** @type {anychart.core.ui.LabelsFactory.Label} */(content);
              label.anchor(anychart.enums.Anchor.LEFT_TOP);
              label.width(bounds.width);
              label.height(bounds.height);
              label.positionProvider({'value': {'x': bounds.left, 'y': bounds.top}});
            } else if (content instanceof anychart.core.ui.MarkersFactory.Marker) {
              marker = /** @type {anychart.core.ui.MarkersFactory.Marker} */(content);
              // here is proper label position determining. It is done in this way, because we are not sure, that
              // the label in the cell was created by the table labels factory, so we need to use label's own
              // methods to determine the correct behaviour. And also, as we don't use this.cellTextFactory() here,
              // the table factory is not created if it is not used.
              var position = /** @type {string} */(
                  marker.position() ||
                  (marker.currentMarkersFactory() && marker.currentMarkersFactory().position()) ||
                  (marker.parentMarkersFactory() && marker.parentMarkersFactory().position()));
              var positionProvider = {'value': anychart.utils.getCoordinateByAnchor(bounds, position)};
              marker.positionProvider(positionProvider);
              marker.draw();
            } else if (content instanceof anychart.core.VisualBase) {
              if (content instanceof anychart.core.Chart)
                (/** @type {anychart.core.Chart} */(content)).autoRedraw(false);
              var element = /** @type {anychart.core.VisualBase} */(content);
              element.parentBounds(bounds);
              element.draw();
            }
            content.resumeSignalsDispatching(false);
          } else {
            content.enabled(false);
            content.draw();
          }
        }
      }
    }
    if (this.labelsFactory_) {
      this.labelsFactory_.container(this.contentLayer_);
      this.labelsFactory_.parentBounds(/** @type {anychart.math.Rect} */(this.getPixelBounds()));
      this.labelsFactory_.draw();
    }
    this.shouldRedrawContent = false;
  }
};
//endregion


//region Drawing routines
//----------------------------------------------------------------------------------------------------------------------
//
//  Drawing routines
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Draws one cell border side by passed params.
 * @param {number} row
 * @param {number} col
 * @param {number} rowSpan
 * @param {number} colSpan
 * @param {?acgraph.vector.Stroke} stroke
 * @param {number} side 0-top, 1-right, 2-bottom, 3-left.
 * @private
 */
anychart.core.ui.Table.prototype.drawBorder_ = function(row, col, rowSpan, colSpan, stroke, side) {
  if (stroke && stroke != 'none') {
    var lineThickness = stroke['thickness'] ? stroke['thickness'] : 1;
    var pixelShift = (lineThickness % 2) ? 0.5 : 0;
    var bounds = this.getCellBounds(row, col, rowSpan, colSpan, bounds);
    var path = this.getBorderPath_(stroke);
    switch (side) {
      case 0: // top
        path.moveTo(bounds.getLeft(), bounds.getTop() + pixelShift);
        path.lineTo(bounds.getRight() + 1, bounds.getTop() + pixelShift);
        break;
      case 1: // right
        path.moveTo(bounds.getRight() + pixelShift, bounds.getTop());
        path.lineTo(bounds.getRight() + pixelShift, bounds.getBottom() + 1);
        break;
      case 2: // bottom
        path.moveTo(bounds.getLeft(), bounds.getBottom() + pixelShift);
        path.lineTo(bounds.getRight() + 1, bounds.getBottom() + pixelShift);
        break;
      case 3: // left
        path.moveTo(bounds.getLeft() + pixelShift, bounds.getTop());
        path.lineTo(bounds.getLeft() + pixelShift, bounds.getBottom() + 1);
        break;
    }
  }
};


/**
 * Return final fill for the cell.
 * @param {anychart.core.ui.Table.Cell} cell
 * @param {number} row
 * @return {acgraph.vector.Fill}
 * @private
 */
anychart.core.ui.Table.prototype.getCellFill_ = function(cell, row) {
  var fill = /** @type {acgraph.vector.Fill|undefined} */(cell.fill());
  if (goog.isDef(fill)) return fill;
  fill = (row % 2) ? this.cellOddFill_ : this.cellEvenFill_;
  if (goog.isDef(fill)) return fill;
  return this.cellFill_;
};


/**
 * Returns final horizontal border stroke settings between two cells.
 * @param {anychart.core.ui.Table.Cell|undefined} topCell
 * @param {anychart.core.ui.Table.Cell|undefined} bottomCell
 * @return {acgraph.vector.Stroke}
 * @private
 */
anychart.core.ui.Table.prototype.getCellHorizontalBorder_ = function(topCell, bottomCell) {
  if (topCell || bottomCell) {
    var upperStroke, lowerStroke;
    // upper cell settings have advantage on same settings level.
    // checking specific border overrides
    upperStroke = topCell && topCell.bottomBorder();
    lowerStroke = bottomCell && bottomCell.topBorder();
    if (upperStroke) return /** @type {acgraph.vector.Stroke} */(upperStroke);
    if (lowerStroke) return /** @type {acgraph.vector.Stroke} */(lowerStroke);
    //checking cell border overrides
    upperStroke = topCell && topCell.border();
    lowerStroke = bottomCell && bottomCell.border();
    if (upperStroke) return /** @type {acgraph.vector.Stroke} */(upperStroke);
    if (lowerStroke) return /** @type {acgraph.vector.Stroke} */(lowerStroke);
    //checking table-level specific borders
    upperStroke = topCell && this.cellBottomBorder_;
    lowerStroke = bottomCell && this.cellTopBorder_;
    if (upperStroke) return /** @type {acgraph.vector.Stroke} */(upperStroke);
    if (lowerStroke) return /** @type {acgraph.vector.Stroke} */(lowerStroke);
    // fallback to default table cell border
    return this.cellBorder_;
  }
  return 'none';
};


/**
 * Returns final vertical border stroke settings between two cells.
 * @param {anychart.core.ui.Table.Cell|undefined} leftCell
 * @param {anychart.core.ui.Table.Cell|undefined} rightCell
 * @return {acgraph.vector.Stroke}
 * @private
 */
anychart.core.ui.Table.prototype.getCellVerticalBorder_ = function(leftCell, rightCell) {
  if (leftCell || rightCell) {
    var leftStroke, rightStroke;
    // upper cell settings have advantage on same settings level.
    // checking specific border overrides
    leftStroke = leftCell && leftCell.rightBorder();
    rightStroke = rightCell && rightCell.leftBorder();
    if (leftStroke) return /** @type {acgraph.vector.Stroke} */(leftStroke);
    if (rightStroke) return /** @type {acgraph.vector.Stroke} */(rightStroke);
    //checking cell border overrides
    leftStroke = leftCell && leftCell.border();
    rightStroke = rightCell && rightCell.border();
    if (leftStroke) return /** @type {acgraph.vector.Stroke} */(leftStroke);
    if (rightStroke) return /** @type {acgraph.vector.Stroke} */(rightStroke);
    //checking table-level specific borders
    leftStroke = leftCell && this.cellRightBorder_;
    rightStroke = rightCell && this.cellLeftBorder_;
    if (leftStroke) return /** @type {acgraph.vector.Stroke} */(leftStroke);
    if (rightStroke) return /** @type {acgraph.vector.Stroke} */(rightStroke);
    // fallback to default table cell border
    return this.cellBorder_;
  }
  return 'none';
};


/**
 * Removes all border paths and clears hashes.
 * @private
 */
anychart.core.ui.Table.prototype.resetBorderPaths_ = function() {
  if (!this.pathsPool_)
    this.pathsPool_ = [];
  if (this.borderPaths_) {
    for (var hash in this.borderPaths_) {
      var path = this.borderPaths_[hash];
      path.clear();
      path.parent(null);
      this.pathsPool_.push(path);
      delete this.borderPaths_[hash];
    }
  } else
    this.borderPaths_ = {};
};


/**
 * Removes all cell filling paths and clears hashes.
 * @private
 */
anychart.core.ui.Table.prototype.resetFillPaths_ = function() {
  if (!this.pathsPool_)
    this.pathsPool_ = [];
  if (this.fillPaths_) {
    for (var hash in this.fillPaths_) {
      var path = this.fillPaths_[hash];
      path.clear();
      path.parent(null);
      this.pathsPool_.push(path);
      delete this.fillPaths_[hash];
    }
  } else
    this.fillPaths_ = {};
};


/**
 * Returns border path for a stroke.
 * @param {!acgraph.vector.Stroke} stroke
 * @return {!acgraph.vector.Path}
 * @private
 */
anychart.core.ui.Table.prototype.getBorderPath_ = function(stroke) {
  if (goog.isObject(stroke) && ('keys' in stroke) && !goog.isObject(stroke['mode']))
    stroke['mode'] = this.getPixelBounds();
  var hash = anychart.utils.hash(stroke);
  if (hash in this.borderPaths_)
    return this.borderPaths_[hash];
  else {
    var path = this.pathsPool_.length ?
        /** @type {!acgraph.vector.Path} */(this.pathsPool_.pop()) :
        acgraph.path();
    this.layer_.addChild(path);
    path.stroke(stroke);
    path.fill(null);
    this.borderPaths_[hash] = path;
    return path;
  }
};


/**
 * Returns fill path for a fill.
 * @param {!acgraph.vector.Fill} fill
 * @return {!acgraph.vector.Path}
 * @private
 */
anychart.core.ui.Table.prototype.getFillPath_ = function(fill) {
  var hash = anychart.utils.hash(fill);
  if (hash in this.fillPaths_)
    return this.fillPaths_[hash];
  else {
    var path = this.pathsPool_.length ?
        /** @type {!acgraph.vector.Path} */(this.pathsPool_.pop()) :
        acgraph.path();
    this.layer_.addChildAt(path, 0);
    path.fill(fill);
    path.stroke(null);
    this.fillPaths_[hash] = path;
    return path;
  }
};
//endregion


//region Other routines
//----------------------------------------------------------------------------------------------------------------------
//
//  Other routines
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Returns bounds for the cell. Result is placed in opt_outBounds argument, if passed.
 * @param {number} row
 * @param {number} col
 * @param {number} rowSpan
 * @param {number} colSpan
 * @param {anychart.math.Rect=} opt_outBounds Result is placed here.
 * @return {!anychart.math.Rect}
 */
anychart.core.ui.Table.prototype.getCellBounds = function(row, col, rowSpan, colSpan, opt_outBounds) {
  var tableBounds = this.getPixelBounds();
  var outBounds = opt_outBounds instanceof anychart.math.Rect ? opt_outBounds : new anychart.math.Rect(0, 0, 0, 0);
  var start = (this.colRights_[col - 1] + 1) || 0;
  var end = this.colRights_[Math.min(col + colSpan, this.colsCount_) - 1];
  outBounds.width = end - start;
  outBounds.left = tableBounds.left + start;
  start = (this.rowBottoms_[row - 1] + 1) || 0;
  end = this.rowBottoms_[Math.min(row + rowSpan, this.rowsCount_) - 1];
  outBounds.height = end - start;
  outBounds.top = tableBounds.top + start;
  return outBounds;
};


/**
 * This method is used by cells to check table consistency before getting bounds.
 * These calls were not placed to Table.getCellBounds to avoid unneeded overhead.
 */
anychart.core.ui.Table.prototype.checkConsistency = function() {
  this.checkTable_();
  this.checkSizes_();
};


/**
 * Marks content to be cleared. Used by cells.
 * @param {anychart.core.ui.Table.CellContent} content
 */
anychart.core.ui.Table.prototype.clearContent = function(content) {
  this.contentToDispose_ = this.contentToDispose_ || [];
  this.contentToDispose_.push(content);
  this.shouldRedrawContent = true;
};


/**
 * Internal cellPadding invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ui.Table.prototype.cellPaddingInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.shouldRedrawContent = true;
    this.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Marks the cell to be removed on next draw.
 * @param {anychart.core.ui.Table.Cell} cell Cell to free.
 * @private
 */
anychart.core.ui.Table.prototype.freeCell_ = function(cell) {
  cell.content(null);
  this.cellsPool_.push(cell);
};


/**
 * Allocates a new cell or reuses previously freed one.
 * @param {number} row
 * @param {number} col
 * @return {anychart.core.ui.Table.Cell}
 * @private
 */
anychart.core.ui.Table.prototype.allocCell_ = function(row, col) {
  return this.cellsPool_.length ? // checking if there are any cells in pool
      /** @type {anychart.core.ui.Table.Cell} */(this.cellsPool_.pop().reset(row, col)) :
      new anychart.core.ui.Table.Cell(this, row, col);
};
//endregion


/**
 * Creates cell content for text cells. Used by cells.
 * @param {*} value Text to be set for the label.
 * @return {!anychart.core.ui.LabelsFactory.Label}
 */
anychart.core.ui.Table.prototype.createTextCellContent = function(value) {
  value = value + '';
  return this.cellTextFactory().add({'value': value}, {'value': {'x': 0, 'y': 0}});
};


/** @inheritDoc */
anychart.core.ui.Table.prototype.disposeInternal = function() {
  goog.disposeAll(this.cells_, this.cellsPool_);
  goog.base(this, 'disposeInternal');
};



/**
 * Table cell.
 * @param {anychart.core.ui.Table} table
 * @param {number} row
 * @param {number} col
 * @constructor
 * @includeDoc
 * @extends {goog.Disposable}
 */
anychart.core.ui.Table.Cell = function(table, row, col) {
  goog.base(this);
  /**
   * If the content_ should be disposed on reset().
   * @type {boolean}
   * @private
   */
  this.disposableContent_ = false;

  /**
   * Table reference.
   * @type {anychart.core.ui.Table}
   * @private
   */
  this.table_ = table;
  this.reset(row, col);
};
goog.inherits(anychart.core.ui.Table.Cell, goog.Disposable);


/**
 * @typedef {{
 *  fill: acgraph.vector.Fill,
 *  border: acgraph.vector.Stroke,
 *  topBorder: acgraph.vector.Stroke,
 *  rightBorder: acgraph.vector.Stroke,
 *  bottomBorder: acgraph.vector.Stroke,
 *  leftBorder: acgraph.vector.Stroke,
 *  padding: anychart.core.utils.Padding
 * }}
 */
anychart.core.ui.Table.Cell.SettingsObj;


/**
 * Cell settings overrides.
 * @type {!anychart.core.ui.Table.Cell.SettingsObj}
 * @private
 */
anychart.core.ui.Table.Cell.settings_;


/**
 * Resets Cell settings and row/col position.
 * @param {number} row
 * @param {number} col
 * @return {anychart.core.ui.Table.Cell}
 */
anychart.core.ui.Table.Cell.prototype.reset = function(row, col) {
  /**
   * Number of rows the cell spans for.
   * @type {number}
   * @private
   */
  this.rowSpan_ = 1;
  /**
   * Number of columns the cell spans for.
   * @type {number}
   * @private
   */
  this.colSpan_ = 1;
  /**
   * Cell row number. Needed only for getRow() and getBounds().
   * @type {number}
   * @private
   */
  this.row_ = row;
  /**
   * Cell column number. Needed only for getCol() and getBounds().
   * @type {number}
   * @private
   */
  this.col_ = col;

  if (this.disposableContent_)
    goog.dispose(this.content_);
  /**
   * Content.
   * @type {anychart.core.ui.Table.CellContent}
   * @private
   */
  this.content_ = null;
  this.disposableContent_ = false;
  /**
   * Flag used by the table. If not NaN - the cell is overlapped by other cell and shouldn't be drawn.
   * @type {number}
   */
  this.overlapper = NaN;

  delete this.settings_;

  return this;
};


/**
 * Getter for cell content.
 * @return {anychart.core.ui.Table.CellContent} Current cell content.
 *//**
 * Setter for cell content.
 * @example
 * var table = anychart.ui.table(3,2);
 * // resize first column
 * table.colWidth(0, 100);
 * // set content to cell as string
 * table.getCell(0,0)
 *   .content('text');
 * // set content to another cell as number
 * table.getCell(1,0)
 *   .content(2014);
 * // set content to another cell as chart
 * table.getCell(0,1)
 *   .content(anychart.line([1.1, 1.4, 1.2, 1.6]))
 *   .rowSpan(3);
 * table.container(stage).draw();
 * @param {(anychart.core.ui.Table.CellContent|string|number)=} opt_value Value to set.<br/>
 *  <b>Note:</b> Numbers and strings are automaticaly set as instance of {@link anychart.core.ui.LabelsFactory.Label} class.
 * @return {anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} class for method chaining.
 *//**
 * @ignoreDoc
 * @param {(anychart.core.ui.Table.CellContent|string|number)=} opt_value
 * @return {anychart.core.ui.Table.CellContent|anychart.core.ui.Table.Cell}
 */
anychart.core.ui.Table.Cell.prototype.content = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.content_)
      this.table_.clearContent(this.content_);
    this.disposableContent_ = (goog.isNumber(opt_value) || goog.isString(opt_value));
    if (this.disposableContent_)
      opt_value = this.table_.createTextCellContent(opt_value);
    this.content_ = /** @type {anychart.core.Chart|anychart.core.ui.LabelsFactory.Label} */(opt_value);
    this.table_.shouldRedrawContent = true;
    this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    return this;
  }
  return this.content_;
};


/**
 * Returns current cell row number.
 * @return {number}
 */
anychart.core.ui.Table.Cell.prototype.getRow = function() {
  return this.row_;
};


/**
 * Returns current cell column number.
 * @return {number}
 */
anychart.core.ui.Table.Cell.prototype.getCol = function() {
  return this.col_;
};


/**
 * Returns cell bounds without padding counted (bounds which are used for borders drawing).
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.container(stage).draw();
 * stage.rect().fill('red 0.2').setBounds(
 *     table.getCell(1,1).getBounds()
 *   );
 * @return {!anychart.math.Rect}
 */
anychart.core.ui.Table.Cell.prototype.getBounds = function() {
  this.table_.checkConsistency();
  return this.table_.getCellBounds(this.row_, this.col_, this.rowSpan_, this.colSpan_);
};


/**
 * Getter for current series fill color.
 * @return {!acgraph.vector.Fill} Current fill color.
 *//**
 * Sets fill settings using an object or a string.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <c>Solid fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill('green 0.2');
 * table.container(stage).draw();
 * @example <c>Linear gradient fill</c><t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill(['green 0.2', 'yellow 0.2']);
 * table.container(stage).draw();
 * @param {acgraph.vector.Fill} value [null] Color as an object or a string.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * Fill color with opacity.<br/>
 * <b>Note:</b> If color is set as a string (e.g. 'red .5') it has a priority over opt_opacity, which
 * means: <b>color</b> set like this <b>rect.fill('red 0.3', 0.7)</b> will have 0.3 opacity.
 * @shortDescription Fill as a string or an object.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill('green', 0.3);
 * table.container(stage).draw();
 * @param {string} color Color as a string.
 * @param {number=} opt_opacity Color opacity.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * Linear gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill(['black', 'yellow'], 45, true, 0.5);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Gradient keys.
 * @param {number=} opt_angle Gradient angle.
 * @param {(boolean|!acgraph.vector.Rect|!{left:number,top:number,width:number,height:number})=} opt_mode Gradient mode.
 * @param {number=} opt_opacity Gradient opacity.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * Radial gradient fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill(['black', 'yellow'], .5, .5, null, .9, 0.3, 0.81);
 * table.container(stage).draw();
 * @param {!Array.<(acgraph.vector.GradientKey|string)>} keys Color-stop gradient keys.
 * @param {number} cx X ratio of center radial gradient.
 * @param {number} cy Y ratio of center radial gradient.
 * @param {acgraph.math.Rect=} opt_mode If defined then userSpaceOnUse mode, else objectBoundingBox.
 * @param {number=} opt_opacity Opacity of the gradient.
 * @param {number=} opt_fx X ratio of focal point.
 * @param {number=} opt_fy Y ratio of focal point.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * Image fill.<br/>
 * Learn more about coloring at:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Fill}
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).fill({
 *    src: 'http://static.anychart.com/underwater.jpg',
 *    mode: acgraph.vector.ImageFillMode.STRETCH
 * });
 * table.container(stage).draw();
 * @param {!acgraph.vector.Fill} imageSettings Object with settings.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(!acgraph.vector.Fill|!Array.<(acgraph.vector.GradientKey|string)>|Function|null)=} opt_fillOrColorOrKeys .
 * @param {number=} opt_opacityOrAngleOrCx .
 * @param {(number|boolean|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number})=} opt_modeOrCy .
 * @param {(number|!acgraph.math.Rect|!{left:number,top:number,width:number,height:number}|null)=} opt_opacityOrMode .
 * @param {number=} opt_opacity .
 * @param {number=} opt_fx .
 * @param {number=} opt_fy .
 * @return {acgraph.vector.Fill|anychart.core.ui.Table.Cell} .
 */
anychart.core.ui.Table.Cell.prototype.fill = function(opt_fillOrColorOrKeys, opt_opacityOrAngleOrCx, opt_modeOrCy, opt_opacityOrMode, opt_opacity, opt_fx, opt_fy) {
  if (goog.isDef(opt_fillOrColorOrKeys)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_fillOrColorOrKeys)) {
      if (this.settings_ && this.settings_.fill) {
        delete this.settings_.fill;
        shouldInvalidate = true;
      }
    } else {
      var fill = acgraph.vector.normalizeFill.apply(null, arguments);
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      if (fill != this.settings_.fill) {
        this.settings_.fill = fill;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawFills = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.fill;
};


/**
 * Getter for current cell border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> Pass <b>null</b> to reset to default settings.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).border('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table.Cell|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.Cell.prototype.border = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = this.settings_ && (this.settings_.leftBorder || this.settings_.rightBorder ||
        this.settings_.topBorder || this.settings_.bottomBorder);
    if (shouldInvalidate) {
      delete this.settings_.leftBorder;
      delete this.settings_.rightBorder;
      delete this.settings_.topBorder;
      delete this.settings_.bottomBorder;
    }
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.settings_ && this.settings_.border) {
        delete this.settings_.border;
        shouldInvalidate = true;
      }
    } else {
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.settings_.border) {
        this.settings_.border = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawBorders = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.border;
};


/**
 * Getter for current cell left border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell left border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> Pass <b>null</b> to reset to default settings.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell left border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).leftBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table.Cell|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.Cell.prototype.leftBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.settings_ && this.settings_.leftBorder) {
        delete this.settings_.leftBorder;
        shouldInvalidate = true;
      }
    } else {
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.settings_.leftBorder) {
        this.settings_.leftBorder = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawBorders = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.leftBorder;
};


/**
 * Getter for current cell right border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell right border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> Pass <b>null</b> to reset to default settings.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell right border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).rightBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table.Cell|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.Cell.prototype.rightBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.settings_ && this.settings_.rightBorder) {
        delete this.settings_.rightBorder;
        shouldInvalidate = true;
      }
    } else {
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.settings_.rightBorder) {
        this.settings_.rightBorder = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawBorders = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.rightBorder;
};


/**
 * Getter for current cell top border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell top border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> Pass <b>null</b> to reset to default settings.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell top border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).topBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table.Cell|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.Cell.prototype.topBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.settings_ && this.settings_.topBorder) {
        delete this.settings_.topBorder;
        shouldInvalidate = true;
      }
    } else {
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.settings_.topBorder) {
        this.settings_.topBorder = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawBorders = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.topBorder;
};


/**
 * Getter for current cell bottom border settings.
 * @return {!acgraph.vector.Stroke} Current stroke settings.
 *//**
 * Setter for cell bottom border settings.<br/>
 * Learn more about stroke settings:
 * {@link http://docs.anychart.com/__VERSION__/General_settings/Elements_Stroke}<br/>
 * <b>Note:</b> Pass <b>null</b> to reset to default settings.<br/>
 * <b>Note:</b> <u>lineJoin</u> settings not working here.
 * @shortDescription Setter for cell bottom border settings.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * table.getCell(1,1).bottomBorder('orange', 3, '5 2', 'round');
 * table.container(stage).draw();
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|Function|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * @param {(acgraph.vector.Stroke|acgraph.vector.ColoredFill|string|null)=} opt_strokeOrFill Fill settings
 *    or stroke settings.
 * @param {number=} opt_thickness [1] Line thickness.
 * @param {string=} opt_dashpattern Controls the pattern of dashes and gaps used to stroke paths.
 * @param {acgraph.vector.StrokeLineJoin=} opt_lineJoin Line join style.
 * @param {acgraph.vector.StrokeLineCap=} opt_lineCap Line cap style.
 * @return {anychart.core.ui.Table.Cell|acgraph.vector.Stroke|undefined} .
 */
anychart.core.ui.Table.Cell.prototype.bottomBorder = function(opt_strokeOrFill, opt_thickness, opt_dashpattern, opt_lineJoin, opt_lineCap) {
  if (goog.isDef(opt_strokeOrFill)) {
    var shouldInvalidate = false;
    if (goog.isNull(opt_strokeOrFill)) {
      if (this.settings_ && this.settings_.bottomBorder) {
        delete this.settings_.bottomBorder;
        shouldInvalidate = true;
      }
    } else {
      if (!this.settings_) this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});
      var stroke = acgraph.vector.normalizeStroke.apply(null, arguments);
      if (stroke != this.settings_.bottomBorder) {
        this.settings_.bottomBorder = stroke;
        shouldInvalidate = true;
      }
    }
    if (shouldInvalidate) {
      this.table_.shouldRedrawBorders = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.settings_ && this.settings_.bottomBorder;
};


/**
 * Getter for cell columns span.
 * @return {number} Current columns span.
 *//**
 * Setter for cell columns span.<br/>
 * <b>Note:</b> Cells that are overlapped by other cells are not drawn.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]);
 * var cell = table.getCell(1,1);
 * cell.colSpan(2);
 * table.container(stage).draw();
 * @param {number=} opt_value [1] Count of cells to merge right.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for cell rows span.
 * @param {number=} opt_value
 * @return {!anychart.core.ui.Table.Cell|number}
 */
anychart.core.ui.Table.Cell.prototype.colSpan = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = anychart.utils.normalizeToNaturalNumber(opt_value, this.colSpan_);
    if (opt_value != this.colSpan_) {
      this.colSpan_ = opt_value;
      this.table_.shouldDropOverlap = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.colSpan_;
};


/**
 * Getter for cell rows span.
 * @return {number} Current rows span.
 *//**
 * Setter for cell rows span.<br/>
 * <b>Note:</b> Cells that are overlapped by other cells are not drawn.
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]);
 * var cell = table.getCell(1,1);
 * cell.rowSpan(2);
 * table.container(stage).draw();
 * @param {number=} opt_value [1] Count of cells to merge down.
 * @return {!anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * Getter and setter for cell rows span.
 * @param {number=} opt_value
 * @return {!anychart.core.ui.Table.Cell|number}
 */
anychart.core.ui.Table.Cell.prototype.rowSpan = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = anychart.utils.normalizeToNaturalNumber(opt_value, this.rowSpan_);
    if (opt_value != this.rowSpan_) {
      this.rowSpan_ = opt_value;
      this.table_.shouldDropOverlap = true;
      this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.rowSpan_;
};


/**
 * Getter for current cell padding settings.
 * @return {anychart.core.utils.Padding} {@link anychart.core.utils.Padding} instance for method chaining.
 *//**
 * Setter for current cell paddings in pixels using a single value.<br/>
 * @example <t>listingOnly</t>
 * // all paddings 15px
 * cell.padding(15);
 * // all paddings 15px
 * cell.padding('15px');
 * // top and bottom 5px ,right and left 15px
 * cell.padding(anychart.utils.space(5,15));
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]);
 * table.cellTextFactory().background().enabled(true);
 * table.getCell(0,0).padding(0);
 * table.container(stage).draw();
 * @param {(string|number|anychart.core.utils.Space)=} opt_value Value to set.
 * @return {anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * Setter for current cell paddings in pixels using several numbers.<br/>
 * @example <t>listingOnly</t>
 * // 1) top and bottom 10px, left and right 15px
 * table.cellPadding(10, '15px');
 * // 2) top 10px, left and right 15px, bottom 5px
 * table.cellPadding(10, '15px', 5);
 * // 3) top 10px, right 15px, bottom 5px, left 12px
 * table.cellPadding(10, '15px', '5px', 12);
 * @example <t>simple-h100</t>
 * var table = anychart.ui.table();
 * table.contents([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]);
 * table.cellTextFactory().background().enabled(true);
 * table.getCell(0,0).padding(-5, 0, 0, -15);
 * table.container(stage).draw();
 * @param {(string|number)=} opt_value1 Top or top-bottom space.
 * @param {(string|number)=} opt_value2 Right or right-left space.
 * @param {(string|number)=} opt_value3 Bottom space.
 * @param {(string|number)=} opt_value4 Left space.
 * @return {anychart.core.ui.Table.Cell} {@link anychart.core.ui.Table.Cell} instance for method chaining.
 *//**
 * @ignoreDoc
 * Cell padding settings.
 * @param {(string|number|Object|anychart.core.utils.Space)=} opt_spaceOrTopOrTopAndBottom .
 * @param {(string|number)=} opt_rightOrRightAndLeft .
 * @param {(string|number)=} opt_bottom .
 * @param {(string|number)=} opt_left .
 * @return {anychart.core.ui.Table.Cell|anychart.core.utils.Padding} .
 */
anychart.core.ui.Table.Cell.prototype.padding = function(opt_spaceOrTopOrTopAndBottom, opt_rightOrRightAndLeft, opt_bottom, opt_left) {
  if (!this.settings_)
    this.settings_ = /** @type {anychart.core.ui.Table.Cell.SettingsObj} */({});

  var makeDefault = goog.isNull(opt_spaceOrTopOrTopAndBottom);
  if (!makeDefault && !this.settings_.padding) {
    this.settings_.padding = new anychart.core.utils.Padding();
    this.registerDisposable(this.settings_.padding);
    this.settings_.padding.listenSignals(this.paddingInvalidated_, this);
  }
  if (goog.isDef(opt_spaceOrTopOrTopAndBottom)) {
    if (makeDefault)
      goog.dispose(this.settings_.padding);
    else
      this.settings_.padding.setup.apply(this.settings_.padding, arguments);
    return this;
  }
  return this.settings_.padding;
};


/**
 * Internal padding invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ui.Table.Cell.prototype.paddingInvalidated_ = function(event) {
  // whatever has changed in paddings affects chart size, so we need to redraw everything
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.table_.shouldRedrawContent = true;
    this.table_.invalidate(anychart.ConsistencyState.APPEARANCE, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Return cell override of the padding.
 * @return {anychart.core.utils.Padding|undefined}
 */
anychart.core.ui.Table.Cell.prototype.getPaddingOverride = function() {
  return this.settings_ && this.settings_.padding;
};


/** @inheritDoc */
anychart.core.ui.Table.Cell.prototype.disposeInternal = function() {
  if (this.disposableContent_)
    this.content_.dispose();
  goog.base(this, 'disposeInternal');
};


//exports
anychart.core.ui.Table.prototype['rowsCount'] = anychart.core.ui.Table.prototype.rowsCount;//doc|ex
anychart.core.ui.Table.prototype['colsCount'] = anychart.core.ui.Table.prototype.colsCount;//doc|ex
anychart.core.ui.Table.prototype['getCell'] = anychart.core.ui.Table.prototype.getCell;//doc|ex
anychart.core.ui.Table.prototype['draw'] = anychart.core.ui.Table.prototype.draw;//doc
anychart.core.ui.Table.prototype['contents'] = anychart.core.ui.Table.prototype.contents;//doc|ex
anychart.core.ui.Table.prototype['colWidth'] = anychart.core.ui.Table.prototype.colWidth;//doc|ex
anychart.core.ui.Table.prototype['rowHeight'] = anychart.core.ui.Table.prototype.rowHeight;//doc|ex
anychart.core.ui.Table.prototype['cellTextFactory'] = anychart.core.ui.Table.prototype.cellTextFactory;//doc|ex
anychart.core.ui.Table.prototype['cellFill'] = anychart.core.ui.Table.prototype.cellFill;//doc|ex
anychart.core.ui.Table.prototype['cellPadding'] = anychart.core.ui.Table.prototype.cellPadding;//doc|ex
anychart.core.ui.Table.prototype['cellEvenFill'] = anychart.core.ui.Table.prototype.cellEvenFill;//doc|ex
anychart.core.ui.Table.prototype['cellOddFill'] = anychart.core.ui.Table.prototype.cellOddFill;//doc|ex
anychart.core.ui.Table.prototype['cellBorder'] = anychart.core.ui.Table.prototype.cellBorder;//doc|ex
anychart.core.ui.Table.prototype['cellLeftBorder'] = anychart.core.ui.Table.prototype.cellLeftBorder;//doc|ex
anychart.core.ui.Table.prototype['cellRightBorder'] = anychart.core.ui.Table.prototype.cellRightBorder;//doc|ex
anychart.core.ui.Table.prototype['cellTopBorder'] = anychart.core.ui.Table.prototype.cellTopBorder;//doc|ex
anychart.core.ui.Table.prototype['cellBottomBorder'] = anychart.core.ui.Table.prototype.cellBottomBorder;//doc|ex
anychart.core.ui.Table.Cell.prototype['rowSpan'] = anychart.core.ui.Table.Cell.prototype.rowSpan;//doc|ex
anychart.core.ui.Table.Cell.prototype['colSpan'] = anychart.core.ui.Table.Cell.prototype.colSpan;//doc|ex
anychart.core.ui.Table.Cell.prototype['content'] = anychart.core.ui.Table.Cell.prototype.content;//doc|ex|need-tr
anychart.core.ui.Table.Cell.prototype['padding'] = anychart.core.ui.Table.Cell.prototype.padding;//doc|ex
anychart.core.ui.Table.Cell.prototype['fill'] = anychart.core.ui.Table.Cell.prototype.fill;//doc|ex
anychart.core.ui.Table.Cell.prototype['border'] = anychart.core.ui.Table.Cell.prototype.border;//doc|ex
anychart.core.ui.Table.Cell.prototype['leftBorder'] = anychart.core.ui.Table.Cell.prototype.leftBorder;//doc|ex
anychart.core.ui.Table.Cell.prototype['rightBorder'] = anychart.core.ui.Table.Cell.prototype.rightBorder;//doc|ex
anychart.core.ui.Table.Cell.prototype['topBorder'] = anychart.core.ui.Table.Cell.prototype.topBorder;//doc|ex
anychart.core.ui.Table.Cell.prototype['bottomBorder'] = anychart.core.ui.Table.Cell.prototype.bottomBorder;//doc|ex
anychart.core.ui.Table.Cell.prototype['getRow'] = anychart.core.ui.Table.Cell.prototype.getRow;//doc
anychart.core.ui.Table.Cell.prototype['getCol'] = anychart.core.ui.Table.Cell.prototype.getCol;//doc
anychart.core.ui.Table.Cell.prototype['getBounds'] = anychart.core.ui.Table.Cell.prototype.getBounds;//doc|ex