goog.provide('anychart.sankeyModule.defaultTheme');


goog.mixin(goog.global['anychart']['themes']['defaultTheme'], {
  'sankey': {
    'nodeFill': anychart.core.defaultTheme.returnSourceColor,
    'nodeStroke': anychart.core.defaultTheme.returnDarkenSourceColor,
    'flowFill': anychart.core.defaultTheme.returnSourceColor70,
    'flowStroke': 'none',
    'conflictStroke': '2 red',
    title: {},
    background: {}
  }
});
