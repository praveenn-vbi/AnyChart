goog.provide('anychart.sankeyModule.defaultTheme');


goog.mixin(goog.global['anychart']['themes']['defaultTheme'], {
  'sankey': {
    'node': {
      'normal': {
        'fill': anychart.core.defaultTheme.returnSourceColor,
        'stroke': anychart.core.defaultTheme.returnDarkenSourceColor
      }
    },
    'flow': {
      'normal': {
        'fill': anychart.core.defaultTheme.returnSourceColor70,
        'stroke': 'none'
      }
    },
    'conflict': {
      'normal': {
        'fill': anychart.core.defaultTheme.returnSourceColor,
        'stroke': '2 red'
      }
    },
    'dropoff': {
      'normal': {
        'fill': {
          'angle': -90,
          'keys': [
            {'color': 'red', 'offset': 0},
            {'color': 'white', 'offset': 1}
          ]
        },
        'stroke': 'none'
      }
    }
  }
});
