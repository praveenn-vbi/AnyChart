goog.provide('anychart.sankeyModule.defaultTheme');


goog.mixin(goog.global['anychart']['themes']['defaultTheme'], {
  'sankey': {
    'nodePadding': 20,
    'nodeWidth': '12%',
    'curveFactor': 0.33,
    'tooltip': {
      'titleFormat': '{%name}',
      'format': '{%Value}'
    },

    'node': {
      'normal': {
        'fill': anychart.core.defaultTheme.returnSourceColor,
        'stroke': anychart.core.defaultTheme.returnDarkenSourceColor
      },
      'hovered': {
        'fill': anychart.core.defaultTheme.returnDarkenSourceColor
      }
    },

    'flow': {
      'normal': {
        'fill': anychart.core.defaultTheme.returnSourceColor50,
        'stroke': 'none'
      },
      'hovered': {
        'fill': anychart.core.defaultTheme.returnDarkenSourceColor
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
