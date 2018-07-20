goog.provide('anychart.core.ui.Text');


/**
 * @constructor
 */
anychart.core.ui.Text = function() {
  this.renderer = acgraph.getRenderer();
  this.text_ = '';
  this.style_ = {};
};


anychart.core.ui.Text.prototype.text = function(value) {
  this.text_ = value;
};


anychart.core.ui.Text.prototype.style = function(value) {
  this.style_ = value;
};


anychart.core.ui.Text.prototype.createDom = function() {
  this.domElement = this.renderer.createTextElement();
};


anychart.core.ui.Text.prototype.renderTo = function(element) {
  element.appendChild(this.getDomElement());
};


anychart.core.ui.Text.prototype.setPosition = function(x, y) {
  var dom = this.getDomElement();
  dom.setAttribute('x', x);
  dom.setAttribute('y', y);
};


anychart.core.ui.Text.prototype.getDomElement = function() {
  if (!this.domElement)
    this.createDom();

  return this.domElement;
};


anychart.core.ui.Text.prototype.applySettings = function() {
  var style = this.style_;
  var dom = this.getDomElement();

  if (!goog.object.isEmpty(style)) {
    var cssString = '';
    if (style['fontStyle']) {
      cssString += 'font-style: ' + style['fontStyle'] + ';';
    }

    if (style['fontVariant']) {
      cssString += 'font-variant: ' + style['fontVariant'] + ';';
    }

    if (style['fontFamily']) {
      cssString += 'font-family: ' + style['fontFamily'] + ';';
    }

    if (style['fontSize']) {
      cssString += 'font-size: ' + style['fontSize'] + ';';
    }

    if (style['fontWeight']) {
      cssString += 'font-weight: ' + style['fontWeight'] + ';';
    }

    if (style['letterSpacing']) {
      cssString += 'letter-spacing: ' + style['letterSpacing'] + ';';
    }

    if (style['fontDecoration']) {
      cssString += 'text-decoration: ' + style['fontDecoration'] + ';';
    }

    if (style['fontColor']) {
      cssString += 'fill: ' + style['fontColor'] + ';';
    }

    if (style['fontOpacity']) {
      cssString += 'opacity: ' + style['fontOpacity'] + ';';
    }

    dom.style.cssText = cssString;
  }
  dom.textContent = this.text_;
};


anychart.core.ui.Text.prototype.getBounds = function() {
  if (!this.bounds_) {
    var dom = this.getDomElement();
    var bbox = dom['getBBox']();
    this.bounds_ = new goog.math.Rect(bbox.x, bbox.y, bbox.width, bbox.height);
  }
  return this.bounds_;
};