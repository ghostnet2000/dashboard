/**
 * CoastVis
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
CoastVis = function(_parentElement, _data, _metaData,_eventHandler) {
  this.parentElement = _parentElement;
  this.stationData = _data;
  this.filtered = _data;
  this.stations = d3.keys(_data);
  this.neighborhoods = _metaData;
  this.eventHandler = _eventHandler;
  this.displayData = [];
  this.matrix = [];
  this.filterHood = function () { return true; };
  //this.filter = function (d) { return d.overall.t; };

  //console.log(this.stationData)

  // Define all "constants" here
  this.margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 100
    },
  this.width = this.parentElement.node().clientWidth - this.margin.left - this.margin.right,
  this.height = this.parentElement.node().clientHeight,
  this.header_height = 60 + this.margin.bottom;
  this.mapHeight = window.innerHeight - this.header_height;

  // set width of outer div to height of window
  $('#mapVis').height(this.mapHeight);
  //$('#mapVis').width(800);

  // set up SVG
  this.initVis();
};

/**
 * Method that sets up the SVG and the variables
 */

 /*
 overall = this.stationData.overall.t
 weekend = this.stationData.weekend.t
 weekday = this.stationData.weekday.t
 casual = this.stationData.overall.t - this.stationData.overall.r
 registered = this.stationData.overall.r

 */
CoastVis.prototype.initVis = function() {

  this.map = L.mapbox.map('map1', 'niamhdurfee.loko84n8',{center: [-25.609990, 25.55971], zoom: 5});

  var color = d3.scale.category20c();
  this.color = d3.scale.ordinal().domain(this.neighborhoods.map(function (d) { return d.name})).range(this.neighborhoods.map(function (d,i) {return color(i); }));


  this.circles = new L.FeatureGroup();

  this.wrangleData();
  // // call the update method
  this.updateVis();
};

// CoastVis.prototype.wrangleData = function(_filterFunction) {
//   this.setScale(_filterFunction);
// };
CoastVis.prototype.wrangleData = function(_filterHood,_filter) {
  this.filterAndAggregate(_filterHood,_filter);
}

CoastVis.prototype.updateVis = function() {
  var that = this;
  var polyline_options = {
      className: 'line',
      color: 'grey',
      opacity: 0.5
    };
  var popup_options = {
    closeButton: true,
    offset: [50,60]
   };

  this.map.removeLayer(this.circles);
  this.circles = new L.FeatureGroup()

  this.areaScale = d3.scale.linear().range([0,250000]).domain([0, d3.max(this.stationData)]);


  this.filtered.forEach(function (o) {
       //s = that.filter(o),
       
       r = 25000,
       c = that.color(o.province);
       
      var popup = L.popup(popup_options).setContent(o.properties.article_title);
      var circle = L.circle([o.properties.lat, o.properties.lon], r, {color: c, opacity: 1, fillOpacity: 0.8, className:'station',weight:2}).bindPopup(popup)
      circle.bindPopup(o.properties.article_title);
      circle.on('mouseover', function() {
          circle.openPopup();

      });
      circle.on('mouseout', function() {
          circle.closePopup();
      });
      that.circles.addLayer(circle);
      
  })

  this.map.addLayer(this.circles);


};

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
 CoastVis.prototype.onHoodChange = function(d) {
      var that = this;
      if (d) {
        this.wrangleData(function (a) { return a.hood == d}, null);
      } else {
        this.wrangleData(function (a) { return true },null)
      }
      this.updateVis();
 };
 CoastVis.prototype.onSelectionChange = function(d) {
      var that = this;

      this.wrangleData(null,d);
      this.updateVis();
 };

 CoastVis.prototype.filterAndAggregate = function(_filterHood,_filter) {
   var that = this;

   if (_filter) {
     if (_filter == "all") {
        that.filtered = that.stationData;
     } else {
        that.filtered = that.stationData.filter(function(d) {
            return (d.properties.province == _filter.toUpperCase() )
        })
     }  
   } else {
     this.filter = all
   }

   //
   this.displayStations = this.stationData.filter(this.filterHood);
   
 };

CoastVis.prototype.data = function(value) {
  var that = this;
  if(!arguments.length) return that.stationData;
  that.stationData = value;
  return CoastVis;
}

CoastVis.prototype.getRadius = function(d) {
  return Math.sqrt(parseFloat(d)/Math.PI)
}
