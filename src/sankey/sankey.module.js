/**
 * @fileoverview anychart.sankeyModule.entry namespace file.
 * @suppress {extraRequire}
 */

goog.provide('anychart.sankeyModule.entry');

goog.require('anychart.sankeyModule.Chart');


/**
 * Default sankey chart.
 * @return {anychart.sankeyModule.Chart} Sankey chart with defaults.
 */
anychart.sankey = function() {
  var chart = new anychart.sankeyModule.Chart();
  chart.setupInternal(true, anychart.getFullTheme('sankey'));
  return chart;
};
anychart.chartTypesMap[anychart.enums.ChartTypes.SANKEY] = anychart.sankey;

//exports
goog.exportSymbol('anychart.sankey', anychart.sankey);
