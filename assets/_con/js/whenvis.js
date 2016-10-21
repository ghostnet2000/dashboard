/**
 * WhenVis
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
WhenVis = function(_parentElement, _data, _eventHandler) {
  this.parentElement = _parentElement;
  this.data = null;
  this.filtered = null;
  this.eventHandler = _eventHandler;
  this.displayData = [];
  this.histData = [];

  // Define all "constants" here
  this.margin = {
      top: 10,
      right: 10,
      bottom: 60,
      left: 45
    },
  this.width = this.parentElement.node().clientWidth - this.margin.left - this.margin.right,
  this.height =  this.parentElement.node().clientHeight- this.margin.top - this.margin.bottom;
  this.filter = null;
  this.initVis();
  this.x;
  this.y;
}


WhenVis.prototype.initVis = function() {
  var that = this;

  /************* Foreign Code *********************/

  that.x = d3.time.scale().range([0, that.width]);

  that.y = d3.scale.linear()
      .rangeRound([that.height, 0]);

  that.z = d3.scale.category10();

  that.xAxis = d3.svg.axis()
      .scale(that.x)
      .orient("bottom")
      .ticks(d3.time.months)
      .tickSize(7, 0)
      .tickFormat(d3.time.format("%b%y"));

  that.stack = d3.layout.stack()
      .values(function(d) {
          return d.values;
      });

  that.yAxis = d3.svg.axis()
      .scale(that.y)
      .orient("right");

  this.svg = that.parentElement.append("svg")
    .attr("width", that.width + that.margin.left + that.margin.right)
    .attr("height", that.height + that.margin.top + that.margin.bottom)
  .append("g")
    .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

  this.updateVis();
}

WhenVis.prototype.wrangleData = function(_filterFunction, yVariable) {
  //alert(yVariable);
  //this.filtered = this.filterAndAggregate(_filterFunction, yVariable);
}

WhenVis.prototype.updateVis = function() {
  var that = this;

  $.ajax({
    type: "GET",
    url: "http://localhost:3000/api/media",
    contentType: "application/json",
    dataType: "json",
    success: function (data, status, jqXHR) {
      //that = this;

      this.data = data.data;
      this.filtered = data.data;
      var color = d3.scale.category10();

      var parseDate = d3.time.format("%d/%m/%Y").parse;

      this.filtered.forEach(function(d) {
        d.article_date = parseDate(d.article_date);
        console.log(d.article_date);
      })

      // Determine the first and list dates in the data set
      var monthExtent = d3.extent(this.filtered, function(d) { return d.article_date; });

      // Create one bin per month, use an offset to include the first and last months
      var monthBins = null;
      var monthBins = d3.time.months(d3.time.month.offset(monthExtent[0],-1),
                                     d3.time.month.offset(monthExtent[1],1));

      // Use the histogram layout to create a function that will bin the data
      var binByMonth = null;
      binByMonth = d3.layout.histogram()
        .value(function(d) { return d.article_date; })
        .bins(monthBins);

      var dataGroupedByProvince = d3.nest()
          .key(function(d) {
              console.log(d);
              return d.province
          })
          .map(this.filtered, d3.map);

      var histDataByProvince = [];
      dataGroupedByProvince.forEach(function(key, value) {
          // Bin the data for each borough by month
          var histData = binByMonth(value);
          histDataByProvince.push({
              borough: key,
              values: histData
          });
      });

      this.stackedHistData = that.stack(histDataByProvince);

      // Scale the range of the data by setting the domain
      that.x.domain(d3.extent(monthBins));
      that.y.domain([0, d3.max(this.stackedHistData[this.stackedHistData.length - 1].values, function(d) {
          return d.y + d.y0;
      })]);

      console.log(this.stackedHistData);

      var borough = that.svg.selectAll(".borough")
            .data(this.stackedHistData)
          .enter().append("g")
            .attr("class", "borough")
            .style("fill", function(d, i) {
                return color(d.borough);
            })
            .style("stroke", function(d, i) {
                return d3.rgb(color(d.borough)).darker();
            });

        // Months have slightly different lengths so calculate the width for each bin
        // Draw the rectangles, starting from the upper left corner and going down
        borough.selectAll(".bar")
            .data(function(d) {
                return d.values;
            })
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) {
                //console.log(d.x);
                return that.x(d.x);
            })
            .attr("width", function(d) {
                console.log(d.x);
                return that.x(new Date(d.x.getTime() + d.dx)) - that.x(d.x) - 2;
            })
            .attr("y", function(d) {
                //console.log(d.y0);
                return that.y(d.y0 + d.y);
            })
            .attr("height", function(d) {
                return that.y(d.y0) - that.y(d.y0 + d.y);
            });

        // Add the X Axis
        that.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + that.height + ")")
            .call(that.xAxis)
            .selectAll("text")  
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", "rotate(-65)" );

        // Add the Y Axis and label
        that.svg.append("g")
            .attr("class", "y axis")
            .call(that.yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -10)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Number of Incidents");

        // Add the legend and center it horizontally
        var maxLegendWidth = 110;
        var xStart = (that.width - maxLegendWidth * color.domain().length) / 2;
        var legend = that.svg.selectAll(".legend")
            .data(color.domain().slice())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(" + i * maxLegendWidth + ",0)";
            });

        legend.append("rect")
            .attr("x", xStart)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", xStart + 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(d) {
                return d;
            });
    },

    error: function (jqXHR, status) {
       
    }
  });
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */

WhenVis.prototype.onSelectionChange = function(d) {
  /*
  var breakdown = d3.select('#formgroup').selectAll('.formgroup2.active');
  var yVariable = d3.select('#formgroup').selectAll('.formgroupy.active');
  breakdown = (breakdown.node()) ? breakdown.node().value : 'total';
  yVariable = (yVariable.node()) ? yVariable.node().value : 'total';
  //console.log(yVariable)


  this.wrangleData(breakdown, yVariable);
  this.updateVis();
  */
}

WhenVis.prototype.onTypeChange = function(_dom) {
  /*
  if (this.dom != _dom) {
    this.dom = _dom;
    this.wrangleData(this.filter);
    this.updateVis();
  }
  */
}
/*
 *
 * ==================================
 * From here on only HELPER functions
 * ==================================
 *
 * */

WhenVis.prototype.filterAndAggregate = function(_filter, _type) {
  /*
  //alert(_filter);
  // Set filter to a function that accepts all items
  var that = this;
  var res = [];

  if (_filter) {
   if (_filter == "total") {
      that.filtered = that.data;
   } else {
      that.filtered = that.data.filter(function(d) {
          return (d.province == _filter.toUpperCase() )
      })
   }  
  } 

   //
   //this.data = this.data.filter(_filter);
  return that.filtered;
  */
}

// WhenVis.prototype.mouseover = function() {
//   d3.selectAll(".area").style("opacity",0.3);
//   d3.selectAll(".line").style("stroke","2px");
//   d3.select(d3.event.target).style("opacity",0.8).style("stroke","5px");
// }
// WhenVis.prototype.mouseout = function() {
//   d3.selectAll(".area").style("opacity",0.6)
//   d3.selectAll(".line").style("stroke","2px")
// }
