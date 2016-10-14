/**
 * NeighborhoodVis
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
NeighborhoodVis = function(_parentElement, _data, _metaData,_eventHandler) {
  this.parentElement = _parentElement;
  this.stationData = _data;
  this.stations = d3.keys(_data);
  this.neighborhoods = _metaData;
  this.eventHandler = _eventHandler;
  this.displayData = [];
  this.matrix = [];
  this.filterHood = function () { return true; };
  //this.filter = function (d) { return d.overall.t; };

  console.log(this.stationData)

  // Define all "constants" here
  this.margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 100
    },
  this.width = 940,
  this.height = 940,
  this.header_height = 60 + this.margin.bottom;
  this.mapHeight = window.innerHeight - this.header_height;

  // set width of outer div to height of window
  //$('#mapVis').height(this.mapHeight);

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
NeighborhoodVis.prototype.initVis = function() {

  this.map = L.mapbox.map('mapVis', 'niamhdurfee.loko84n8',{center: [-25.609990, 25.55971], zoom: 5});

  var color = d3.scale.category20c();
  this.color = d3.scale.ordinal().domain(this.neighborhoods.map(function (d) { return d.name})).range(this.neighborhoods.map(function (d,i) {return color(i); }));


  this.circles = new L.FeatureGroup();

  this.wrangleData();
  // // call the update method
  this.updateVis();
};

// NeighborhoodVis.prototype.wrangleData = function(_filterFunction) {
//   this.setScale(_filterFunction);
// };
NeighborhoodVis.prototype.wrangleData = function(_filterHood,_filter) {
  this.filterAndAggregate(_filterHood,_filter);
}

NeighborhoodVis.prototype.updateVis = function() {
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


  this.stationData.forEach(function (o) {
       //s = that.filter(o),
       r = 25000,
       c = that.color(o.province);
      var popup = L.popup(popup_options).setContent(o.properties.article_title);
      var circle = L.circle([o.properties.lat, o.properties.lon], r, {color: c, opacity: 1, fillOpacity: 0.8, className:'station',weight:2}).bindPopup(popup)
      circle.bindPopup(o.properties.article_title);
      circle.on('mouseover', function() {
          circle.openPopup();
          d3.select("#tt_total")
            .text(o.properties.article_description);
          d3.select("#tt_female")
            .text(o.properties.primary_event_date);
          d3.select("#tt_black_african")
            .text(o.properties.primary_loc);

      });
      circle.on('mouseout', function() {
          circle.closePopup();
          d3.select("#tt_total")
            .text("");
          d3.select("#tt_female")
            .text("");
          d3.select("#tt_black_african")
            .text("");
      });
      that.circles.addLayer(circle);
  })

  this.map.addLayer(this.circles);

};

NeighborhoodVis.prototype.getColor = function( prov ){
   if ( prov == "KZN") {
     return "greenyellow"
   } else if ( prov == "EC") {
     return "crimson"
   } else if ( prov == "WC") {
     return "dodgerblue"
   } else {
     return "gold"
   }  
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
 NeighborhoodVis.prototype.onHoodChange = function(d) {
      var that = this;
      if (d) {
        this.wrangleData(function (a) { return a.hood == d}, null);
      } else {
        this.wrangleData(function (a) { return true },null)
      }
      this.updateVis();
 };
 NeighborhoodVis.prototype.onSelectionChange = function(d) {
      var that = this;
      this.wrangleData(null,d);
      this.updateVis();
 };

 NeighborhoodVis.prototype.filterAndAggregate = function(_filterHood,_filter) {
  /*
   var filterHood = function () { return true; }
   //
   this.filterHood = (_filterHood) ? _filterHood : this.filterHood;
   function all (d) { return d.overall.average.t; };
   function weekend (d) { return d.weekend.average.t; };
   function weekday (d) { return d.weekday.average.t; };
   function casual (d) { return d.overall.average.t - d.overall.average.r; };
   function registered (d) { return d.overall.average.r; };

   if (_filter) {
     if (_filter == "all") {
       this.filter = all
     } else if (_filter == "weekend") {
       this.filter = weekend
     } else if (_filter =="weekday") {
       this.filter = weekday
     } else if (_filter =="registered") {
       this.filter = registered
     }  else if (_filter =="casual") {
       this.filter = casual
     }
   } else {
     this.filter = all
   }

   //
   this.displayStations = this.stationData.filter(this.filterHood);
   */
 };

NeighborhoodVis.prototype.data = function(value) {
  var that = this;
  if(!arguments.length) return that.stationData;
  that.stationData = value;
  return NeighborhoodVis;
}

NeighborhoodVis.prototype.getRadius = function(d) {
  return Math.sqrt(parseFloat(d)/Math.PI)
}
