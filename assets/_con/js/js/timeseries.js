var margin = {
	top: 10, 
	right: 30, 
	bottom: 30, 
	left: 50
},

width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m/%d/%Y %I:%M:%S %p").parse;
var formatDate = d3.time.format("%m/%y");
var formatCount = d3.format(",.0f");

var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x)
  .orient("bottom").tickFormat(formatDate);

var yAxis = d3.svg.axis().scale(y)
  .orient("left").ticks(6);

// Create the SVG drawing area
var svg = d3.select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("Rat_Sightings.csv", function(error, data) {

  // Parse the date strings into javascript dates
  data.forEach(function(d) {
    d.created_date = parseDate(d["Created Date"]);
  });

  // Determine the first and list dates in the data set
  var monthExtent = d3.extent(data, function(d) { return d.created_date; });

  // Create one bin per month, use an offset to include the first and last months
  var monthBins = d3.time.months(d3.time.month.offset(monthExtent[0],-1),
                                 d3.time.month.offset(monthExtent[1],1));

  // Use the histogram layout to create a function that will bin the data
  var binByMonth = d3.layout.histogram()
    .value(function(d) { return d.created_date; })
    .bins(monthBins);

  // Bin the data by month
  var histData = binByMonth(data);

  // Scale the range of the data by setting the domain
  x.domain(d3.extent(monthBins));
  y.domain([0, d3.max(histData, function(d) { return d.y; })]);

  // Set up one bar for each bin
  // Months have slightly different lengths so calculate the width for each bin
  // Note: dx, the width of the histogram bin, is in milliseconds so convert the x value
  // into UTC time and convert the sum back to a date in order to help calculate the width
  // Thanks to npdoty for pointing this out in this stack overflow post:
  // http://stackoverflow.com/questions/17745682/d3-histogram-date-based
  svg.selectAll(".bar")
      .data(histData)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.x); })
      .attr("width", function(d) { return x(new Date(d.x.getTime() + d.dx))-x(d.x)-1; })
      .attr("y", function(d) { return y(d.y); })
      .attr("height", function(d) { return height - y(d.y); });

  // Add the X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the Y Axis and label
  svg.append("g")
     .attr("class", "y axis")
     .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Number of Sightings");

});