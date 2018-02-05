var map;

// Create a new blank array for all the listing markers.


var ViewModel = function() {
  // Create a styles array to use with the map.
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat:32.8727926, lng: -117.2326232},
    zoom: 15,
    styles: styles,
    mapTypeControl: false
  });
  var self = this;
  var markers = [];

  this.filter = ko.observable("");
  this.populateInfoWindow = function(marker,infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      // Clear the infowindow content to give the streetview time to load.
      infowindow.setContent('');
      infowindow.marker = marker;
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });

      var content = '<div>' + marker.title + '</div>';

      clientID = "FC5SUZKXDPTL2YCEGXD0TUNYUIACTAL4WP2OXDOBXN44GDVB";
      clientSecret =
          "WFQT2ASMKRCWXCLQHL2YYXNRV1HR2YDRWOL1W0CAGYNRKMZI";
      // URL for Foursquare API
      var requestUrl = 'https://api.foursquare.com/v2/venues/search?ll=' +
          marker.lat + ',' + marker.lng + '&client_id=' + clientID +
          '&client_secret=' + clientSecret + '&v=20180203' + '&query='+marker.title;
      // Foursquare API
      $.getJSON(requestUrl).done(function(marker) {
          var response = marker.response.venues[0];
          self.street = response.location.formattedAddress[0] || "No street provided";
          self.city = response.location.formattedAddress[1] || "No city provided";
          self.country = response.location.formattedAddress[2] || "No country provided";
          self.category = response.categories[0].shortName || "No category provided";
          self.contact = response.contact.formattedPhone || "No contact provided";
          content +=
              '<h5>(' + self.category + ')</h5>' + '<div>' +
              '<h4> Address: </h4>' +
              '<p>' + self.street + '</p>' +
              '<p>' + self.city + '</p>' +
              '<p>' + self.country +'</p>' +              
              '<h4> Contact: </h4>' +
              '<p>' + self.contact +'</p>' + 
              '</div>';
          infowindow.setContent(content);

      }).fail(function() {
          content += '<div>Not Found in Foursquare</div>';
          infowindow.setContent(content);
      });
      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }
  };

  this.showMarker = function(){
    self.populateInfoWindow(this,self.largeInfoWindow);
    this.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout((function() {
        this.setAnimation(null);
    }).bind(this), 1400);
  };

  this.largeInfoWindow = new google.maps.InfoWindow();
  this.makeMarkerIcon = function(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  };

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = this.makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = this.makeMarkerIcon('FFFF24');
  this.setMarkerHighlighted = function(){
    this.setIcon(highlightedIcon);
  };
  this.setMarkerDefault = function(){
    this.setIcon(defaultIcon);
  };

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      lat: position.lat,
      lng: position.lng,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click',self.showMarker);
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', self.setMarkerHighlighted);
    marker.addListener('mouseout',self.setMarkerDefault);
  }

  this.favoritePlaces = ko.computed(function() {
        var places = [];
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].title.toLowerCase().includes(this.filter()
                    .toLowerCase())) {
                places.push(markers[i]);
                markers[i].setVisible(true);
            } 
            else {
                markers[i].setVisible(false);
            }
        }
        return places;
    }, this);


  // This function populates the infowindow when the marker is clicked. We'll only allow
  // one infowindow which will open at the marker that is clicked, and populate based
  // on that markers position.

  // This function will loop through the markers array and display them all.
  this.showListings = function() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
  };

  this.showListings();


  // This function will loop through the listings and hide them all.
  this.hideMarkers = function(markers) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
  };
};

function errorHandler(){
  alert("Failed to load Google Maps! Please refresh the page and try again!");
}


function initMap(){
  ko.applyBindings(new ViewModel());
}

