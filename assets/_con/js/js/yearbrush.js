/**
 * YearBrush
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
YearBrush = function(_parentElement, _data,_eventHandler) {
  this.parentElement = _parentElement;
  this.eventHandler = _eventHandler;
  this.data = _data;

  // Define all "constants" here
  this.margin = {
      top: 0,
      right: 10,
      bottom: 0,
      left: 10
    },
  this.width = this.parentElement.node().clientWidth - this.margin.left - this.margin.right,
  this.height = this.parentElement.node().clientHeight - this.margin.top - this.margin.bottom;

  this.initVis();
}

/**
 * Method that sets up the SVG and the variables
 */
YearBrush.prototype.initVis = function() {
  var that = this;
  var g;
  var data = that.data;
  var width = that.width;
  var height = that.height;
  var chart  = this;
  var dispatch = d3.dispatch(chart, "filter");

    g = that.parentElement;
    
    var extent = d3.extent(data, function(d) {
      return d.article_date;
    })

    var scale = d3.time.scale()
      .domain(extent)
      .range([0, width])

    var brush = d3.svg.brush()
    brush.x(scale)
    brush(g)
    g.selectAll("rect").attr("height", height)
    g.selectAll(".background")
      .style({fill: "#4B9E9E", visibility: "visible"})
    g.selectAll(".extent")
      .style({fill: "#78C5C5", visibility: "visible"})
    g.selectAll(".resize rect")
      .style({fill: "#276C86", visibility: "visible"})

    var rects = g.selectAll("rect.events")
    .data(data)
    rects.enter()
    .append("rect").classed("events", true)
    rects.attr({
      x: function(d) { return scale(d.article_date);},
      y: 0,
      width: 1,
      height: height
    }).style("pointer-events", "none")

    rects.exit().remove()

    brush.on("brushend", function() {
      var ext = brush.extent()
      var filtered = data.filter(function(d) {
        return (d.article_date > ext[0] && d.article_date < ext[1])
      })
      g.selectAll("rect.events")
      .style("stroke", "")
      
      g.selectAll("rect.events")
      .data(filtered, function(d) { return 1 })
      .style({
        stroke: "#fff"
      })

      //emit filtered data
      dispatch.filter(filtered)
    })

    var axis = d3.svg.axis()
    .scale(scale)
    .orient("bottom")
    .tickValues([new Date(extent[0]), new Date(extent[0] + (extent[1] - extent[0])/2) , new Date(extent[1])])
    .tickFormat(d3.time.format("%x %H:%M"))

    var agroup = g.append("g")
    agroup.attr("transform", "translate(" + [0, height] + ")")
    axis(agroup)
    agroup.selectAll("path")
      .style({ fill: "none", stroke: "#000"})
    agroup.selectAll("line")
      .style({ stroke: "#000"})

  chart.highlight = function(data) {
    var rects = g.selectAll("rect.events")
    .style("stroke", "")
    .style("stroke-width", "")

    rects.data(data, function(d) { return 1 })
    .style("stroke", "orange")
    .style("stroke-width", 3)
  }

  chart.data = function(value) {
    if(!arguments.length) return data;
    data = value;
    return chart;
  }
  chart.width = function(value) {
    if(!arguments.length) return width;
    width = value;
    return chart;
  }
  chart.height = function(value) {
    if(!arguments.length) return height;
    height = value;
    return chart;
  }

  return d3.rebind(chart, dispatch, "on");

}
