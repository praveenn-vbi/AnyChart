goog.provide('anychart.core.utils.InteractivityState');
goog.provide('anychart.core.utils.PieInteractivityState');



/**
 * Interactivity state class.
 * @param {anychart.core.SeriesBase|anychart.core.Chart|anychart.core.gauge.pointers.Base} target Target for integrate interactivity states.
 * Series of chart or series like chart (pie, PyramidFunnelBase charts and e.g.).
 * @constructor
 */
anychart.core.utils.InteractivityState = function(target) {
  /**
   * Link to series for appearance manipulation.
   * @type {anychart.core.SeriesBase|anychart.core.Chart|anychart.core.gauge.pointers.Base}
   */
  this.target = target;

  /**
   * Array of point indexes. Sorted by point index. Sync with this.stateIndex array.
   * @type {Array.<number>}
   */
  this.stateIndex = [];

  /**
   * Array of point states. Sorted by point index. Sync with this.stateIndex array.
   * @type {Array.<anychart.PointState|number>}
   */
  this.stateValue = [];

  /**
   * Series state.
   * @type {anychart.PointState|number}
   */
  this.seriesState = anychart.PointState.NORMAL;
};


/**
 * Set point state.
 * @param {anychart.PointState|number} state .
 * @param {number} index .
 * @param {(anychart.PointState|number)=} opt_stateToChange .
 * @private
 */
anychart.core.utils.InteractivityState.prototype.setPointState_ = function(state, index, opt_stateToChange) {
  if (isNaN(index)) return;

  var arrIndex = goog.array.binarySearch(this.stateIndex, index);
  //if state is normal - remove state.
  if (state == anychart.PointState.NORMAL) {
    if (arrIndex > 0)
      this.doRemovePointState_(state, arrIndex);
  } else {
    //if state by index doesn't found then adds it
    //else updates state.
    var updatePoint = true;
    var updateSeries = this.updateRules(state, NaN);

    if (arrIndex < 0) {
      goog.array.insertAt(this.stateIndex, index, ~arrIndex);
      goog.array.insertAt(this.stateValue, state, ~arrIndex);
    } else {
      updatePoint = !this.isStateContains(this.stateValue[arrIndex], state);
      if (updatePoint) {
        this.stateValue[arrIndex] |= state;
      } else if (goog.isDef(opt_stateToChange)) {
        this.stateValue[arrIndex] = opt_stateToChange;
      }
    }

    if (this.target.enabled() && this.target.getIterator().select(index)) {
      if (!this.target.isDiscreteBased() && this.target.hoverMode() == anychart.enums.HoverMode.SINGLE) {
        if (updateSeries) {
          this.target.applyAppearanceToSeries(state);
        } else if (goog.isDef(opt_stateToChange) && !updateSeries && this.updateRules(state, NaN)) {
          this.target.applyAppearanceToSeries(opt_stateToChange);
        }
      }
      if (updatePoint) {
        this.target.applyAppearanceToPoint(state);
      } else if (goog.isDef(opt_stateToChange)) {
        this.target.applyAppearanceToPoint(opt_stateToChange);
      }
    }
  }
};


/**
 * Rules of update points.
 * @param {anychart.PointState|number} state .
 * @param {number=} opt_index .
 * @return {boolean}
 */
anychart.core.utils.InteractivityState.prototype.updateRules = function(state, opt_index) {
  var stateToCheck;
  if (goog.isDef(opt_index)) {
    if (isNaN(opt_index)) {
      return !this.hasPointState(anychart.PointState.SELECT) && !this.isStateContains(this.seriesState, anychart.PointState.SELECT);
    } else {
      stateToCheck = this.getPointStateByIndex(+opt_index);
    }
  } else {
    stateToCheck = this.seriesState;
  }

  return !this.isStateContains(stateToCheck, anychart.PointState.SELECT);
};


/**
 * Returns series state relative points states.
 * @return {anychart.PointState|number}
 */
anychart.core.utils.InteractivityState.prototype.getSeriesStateForUpdate = function() {
  if (this.hasPointState(anychart.PointState.SELECT)) {
    return anychart.PointState.SELECT;
  } else if (this.hasPointState(anychart.PointState.HOVER)) {
    return anychart.PointState.HOVER;
  } else {
    return anychart.PointState.NORMAL;
  }
};


/**
 * Sets state for points or series.
 * @param {anychart.PointState|number} state State to set for points or series.
 * @param {(number|Array.<number>)=} opt_index If it's passed than it means that points with passed indexes will get
 * state, otherwise series will get passed state.
 * @param {(anychart.PointState|number)=} opt_stateToChange If a value is passed than points that already have a state will change
 * their state to opt_stateToChange.
 */
anychart.core.utils.InteractivityState.prototype.setPointState = function(state, opt_index, opt_stateToChange) {
  var i;
  if (goog.isDef(opt_index)) {
    if (goog.isArray(opt_index)) {
      goog.array.sort(opt_index);
      for (i = opt_index.length; i--;)
        this.setPointState_(state, +opt_index[i], opt_stateToChange);
    } else
      this.setPointState_(state, +opt_index, opt_stateToChange);
  } else if (!this.isStateContains(this.seriesState, state)) {
    var iterator, index, update;
    var removeState = anychart.PointState.NORMAL;
    if (state == anychart.PointState.NORMAL || state == anychart.PointState.HOVER) {
      removeState = anychart.PointState.HOVER;
    } else if (state == anychart.PointState.SELECT) {
      removeState = anychart.PointState.SELECT | anychart.PointState.HOVER;
    }

    for (i = this.stateValue.length; i--;) {
      if (this.removePointStateByIndex(removeState, i)) {
        if (this.target.getIterator().select(this.stateIndex[i])) {
          this.target.applyAppearanceToPoint(anychart.PointState.NORMAL);
        }

        goog.array.splice(this.stateValue, i, 1);
        goog.array.splice(this.stateIndex, i, 1);
      }
    }

    if (this.updateRules(state)) {
      if (this.target.isDiscreteBased()) {
        iterator = this.target.getResetIterator();
        while (iterator.advance()) {
          index = iterator.getIndex();
          if (iterator.select(index)) {
            this.target.applyAppearanceToSeries(state);
          }
        }
      } else {
        if (this.updateRules(state, NaN))
          this.target.applyAppearanceToSeries(state);
      }
      this.seriesState = /** @type {anychart.PointState|number}*/(state);
    }
  }
};


/**
 * @param {anychart.PointState|number} state .
 * @param {number} index .
 * @protected
 */
anychart.core.utils.InteractivityState.prototype.addPointStateInternal = function(state, index) {
  if (!this.target.getIterator().select(index))
    return;

  var arrIndex = goog.array.binarySearch(this.stateIndex, index);
  //if state is normal - do nothing.
  if (state != anychart.PointState.NORMAL) {
    //if state by index doesn't found then adds it
    //else updates state.
    if (arrIndex < 0) {
      goog.array.insertAt(this.stateIndex, index, ~arrIndex);
      goog.array.insertAt(this.stateValue, state, ~arrIndex);

      if (this.seriesState == anychart.PointState.NORMAL)
        this.target.applyAppearanceToPoint(state);

      var updateSeries = this.updateRules(state, NaN);
      if (updateSeries && !this.target.isDiscreteBased() && this.target.hoverMode() == anychart.enums.HoverMode.SINGLE)
        this.target.applyAppearanceToSeries(state);
    } else
      this.stateValue[arrIndex] |= state;
  }
};


/**
 * Adds state to point.
 * @param {anychart.PointState|number} state .
 * @param {(Array.<number>|number)=} opt_index .
 */
anychart.core.utils.InteractivityState.prototype.addPointState = function(state, opt_index) {
  var i;
  if (goog.isDef(opt_index)) {
    if (goog.isArray(opt_index)) {
      goog.array.sort(opt_index);
      for (i = opt_index.length; i--;)
        this.addPointStateInternal(state, +opt_index[i]);
    } else
      this.addPointStateInternal(state, +opt_index);
  } else {
    if (!this.isStateContains(this.seriesState, state)) {
      for (i = this.stateValue.length; i--;) {
        if (this.removePointStateByIndex(state, i)) {
          goog.array.splice(this.stateValue, i, 1);
          goog.array.splice(this.stateIndex, i, 1);
        }
      }
      this.seriesState = /** @type {anychart.PointState|number}*/(state);
    } else if (state == anychart.PointState.HOVER) {
      for (i = this.stateValue.length; i--;) {
        if (this.removePointStateByIndex(state, i)) {
          goog.array.splice(this.stateValue, i, 1);
          goog.array.splice(this.stateIndex, i, 1);
        }
      }
      this.seriesState = anychart.PointState.NORMAL;
    } else if (state == anychart.PointState.SELECT) {
      this.stateValue.length = 0;
      this.stateIndex.length = 0;
      this.seriesState = anychart.PointState.NORMAL;
    }
  }
};


/**
 * Excludes (removes or clears) passed state from current point state.
 * @param {anychart.PointState|number} state State to exclude from current point state.
 * @param {number} index Index of array of states to exclude.
 * @return {boolean} Returns true if state is clear.
 */
anychart.core.utils.InteractivityState.prototype.removePointStateByIndex = function(state, index) {
  return !(this.stateValue[index] &= ~state);
};


/**
 * Apply appearance to target.
 * @param {anychart.PointState|number} state
 * @param {number} arrIndex
 * @private
 */
anychart.core.utils.InteractivityState.prototype.doRemovePointState_ = function(state, arrIndex) {
  var pointIndex = this.stateIndex[arrIndex];
  if (this.removePointStateByIndex(state, arrIndex)) {
    goog.array.splice(this.stateIndex, arrIndex, 1);
    goog.array.splice(this.stateValue, arrIndex, 1);

    if (this.target.enabled() && this.target.getIterator().select(pointIndex) && this.seriesState == anychart.PointState.NORMAL) {
      this.target.applyAppearanceToPoint(anychart.PointState.NORMAL);
    }
  } else {
    if (this.target.enabled() && this.target.getIterator().select(pointIndex) && this.seriesState == anychart.PointState.NORMAL) {
      this.target.applyAppearanceToPoint(this.stateValue[arrIndex]);
    }
  }
};


/**
 * Removes state by index.
 * @param {anychart.PointState|number} state
 * @param {number} index
 * @private
 */
anychart.core.utils.InteractivityState.prototype.removePointState_ = function(state, index) {
  if (isNaN(index)) return;

  var arrIndex = goog.array.binarySearch(this.stateIndex, index);
  if (arrIndex >= 0)
    this.doRemovePointState_(state, arrIndex);
};


/**
 * Removes state for points or series.
 * @param {anychart.PointState|number} state State to remove for points or series.
 * @param {(number|Array.<number>)=} opt_index If it passed then it means that state of points with passed indexes will be
 * removed, otherwise state of series will set as normal.
 */
anychart.core.utils.InteractivityState.prototype.removePointState = function(state, opt_index) {
  var i;
  if (goog.isDef(opt_index)) {
    if (goog.isArray(opt_index)) {
      goog.array.sort(opt_index);
      for (i = opt_index.length; i--;)
        this.removePointState_(state, +opt_index[i]);
    } else if (isNaN(opt_index)) {
      for (i = this.stateIndex.length; i--;)
        this.doRemovePointState_(state, i);
    } else
      this.removePointState_(state, +opt_index);

    if (!this.target.isDiscreteBased() && this.target.hoverMode() == anychart.enums.HoverMode.SINGLE) {
      this.target.applyAppearanceToSeries(this.getSeriesStateForUpdate());
    }
  } else {
    for (i = this.stateValue.length; i--;) {
      if (this.removePointStateByIndex(state, i)) {
        if (this.target.getIterator().select(this.stateIndex[i])) {
          this.target.applyAppearanceToPoint(anychart.PointState.NORMAL);
        }

        goog.array.splice(this.stateIndex, i, 1);
        goog.array.splice(this.stateValue, i, 1);
      }
    }

    this.seriesState &= ~state;

    if (this.target.isDiscreteBased()) {
      var iterator = this.target.getResetIterator();

      while (iterator.advance()) {
        var index = iterator.getIndex();
        if (iterator.select(index)) {
          this.target.applyAppearanceToSeries(this.seriesState);
        }
      }
    } else {
      this.target.applyAppearanceToSeries(this.seriesState);
    }
  }
};


/**
 * Point indexes with passed state.
 * @param {anychart.PointState|number} state Point state.
 * @return {Array.<number>}
 */
anychart.core.utils.InteractivityState.prototype.getIndexByPointState = function(state) {
  var result = [];
  for (var i = 0, len = this.stateValue.length; i < len; i++) {
    if (this.hasPointStateByIndex(state, i))
      result.push(this.stateIndex[i]);
  }
  return result;
};


/**
 * Returns last point index with passed state.
 * @param {anychart.PointState|number} state Point state.
 * @return {number}
 */
anychart.core.utils.InteractivityState.prototype.getLastIndexByPointState = function(state) {
  var lastHoveredArrIndex = goog.array.findIndexRight(this.stateValue, function(item) {
    return !!(item & state);
  });
  return lastHoveredArrIndex >= 0 ? this.stateIndex[lastHoveredArrIndex] : NaN;
};


/**
 * Returns point state for index.
 * @param {number} index Point index.
 * @return {anychart.PointState|number}
 */
anychart.core.utils.InteractivityState.prototype.getPointStateByIndex = function(index) {
  var pointIndex = +index;
  if (!isNaN(pointIndex)) {
    var arrIndex = goog.array.binarySearch(this.stateIndex, pointIndex);
    return /** @type {anychart.PointState|number}*/(arrIndex >= 0 ? this.stateValue[arrIndex] : anychart.PointState.NORMAL);
  }
  return anychart.PointState.NORMAL;
};


/**
 * Whether there is passed state by point index.
 * @param {anychart.PointState|number} state
 * @param {number} pointIndex
 * @return {boolean}
 */
anychart.core.utils.InteractivityState.prototype.hasPointStateByPointIndex = function(state, pointIndex) {
  var arrIndex = goog.array.binarySearch(this.stateIndex, pointIndex);
  return this.hasPointStateByIndex(state, arrIndex);
};


/**
 * Whether there is passed state by internal array index.
 * @param {anychart.PointState|number} state
 * @param {number} index
 * @return {boolean}
 */
anychart.core.utils.InteractivityState.prototype.hasPointStateByIndex = function(state, index) {
  return !!(state & this.stateValue[index]);
};


/**
 * Whether there is at least one with passed state.
 * @param {anychart.PointState|number} state Point state.
 * @return {boolean}
 */
anychart.core.utils.InteractivityState.prototype.hasPointState = function(state) {
  var index = goog.array.findIndex(this.stateValue, function(item) {
    return !!(item & state);
  });
  return index >= 0;
};


/**
 * Returns current series state.
 * @return {anychart.PointState|number}
 */
anychart.core.utils.InteractivityState.prototype.getSeriesState = function() {
  return this.seriesState;
};


/**
 * Check passed state for contains in other state.
 * @param {anychart.PointState|number} state
 * @param {anychart.PointState|number} stateToCheck
 * @return {boolean}
 */
anychart.core.utils.InteractivityState.prototype.isStateContains = function(state, stateToCheck) {
  return !!(state & stateToCheck);
};



/**
 * Interactivity state class for pie. See #addPointStateInternal method.
 * @param {anychart.charts.Pie} target Pie chart.
 * @constructor
 * @extends {anychart.core.utils.InteractivityState}
 */
anychart.core.utils.PieInteractivityState = function(target) {
  goog.base(this, target);
};
goog.inherits(anychart.core.utils.PieInteractivityState, anychart.core.utils.InteractivityState);


/** @inheritDoc */
anychart.core.utils.PieInteractivityState.prototype.addPointStateInternal = function(state, index) {
  if (!this.target.getIterator().select(index))
    return;

  var arrIndex = goog.array.binarySearch(this.stateIndex, index);
  //if state is normal - do nothing.
  if (state != anychart.PointState.NORMAL) {
    //if state by index doesn't found then adds it
    //else updates state.
    if (arrIndex < 0) {
      goog.array.insertAt(this.stateIndex, index, ~arrIndex);
      goog.array.insertAt(this.stateValue, state, ~arrIndex);

      if (this.seriesState == anychart.PointState.NORMAL)
        this.target.applyAppearanceToPoint(state);

      var updateSeries = this.updateRules(state, NaN);
      if (updateSeries && !this.target.isDiscreteBased() && this.target.hoverMode() == anychart.enums.HoverMode.SINGLE)
        this.target.applyAppearanceToSeries(state);
    } else {
      // here we upgrading logic for pie
      // when state adds - update point appearance.
      this.stateValue[arrIndex] |= state;
      this.target.applyAppearanceToPoint(this.stateValue[arrIndex]);
    }
  }
};
