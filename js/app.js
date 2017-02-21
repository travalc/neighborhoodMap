var map;
var portland;
var infoWindow;
var visibleLocations;
var bounds;
var listView = document.getElementById('listView');
var view = { //initialize map
  initMap: function () {
    portland = new google.maps.LatLng(45.522946, -122.673517);
    map = new google.maps.Map(document.getElementById('map'), {
      center: portland,
      zoom: 16
    });
    bounds = new google.maps.LatLngBounds();
    model.initialize();
    var openButton = document.getElementById('openButton');


  },
  openList: function () {

    listView.style.height = '250px';
  },
  closeList: function () {
    listView.style.height = '0';
  }
}

var model = {
  locations: [],
  initialize: function() { //retrieve model data from Yelp API, referenced this forum discussion for this functionality: https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699
    var yelpURL = 'https://api.yelp.com/v2/search';
    function nonce_generate() {
      return (Math.floor(Math.random() * 1e12).toString());
    }
    var parameters = {
      oauth_consumer_key: 'LyiqmxYUbuLB9p1a_lx8gA',
      oauth_token: 'GZpLwoqEwunNaFT7HwNoRsCiXE3mxMXt',
      oauth_nonce: nonce_generate(),
      oauth_timestamp: Math.floor(Date.now()/1000),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_version : '1.0',
      callback: 'cb',
      term: 'restaurant',
      location: 'Portland Chinatown',
      cll: '45.5231, -122.6765',
      radius_filter: 600,
      sort: 2
    };
    var encodedSignature = oauthSignature.generate('GET',yelpURL, parameters, 'rjAxpO7SFR9hyQUtOPvEqOgdDa0', 'FUgWz5YLb7CyIhOOpUp2Up7t_MQ');
    parameters.oauth_signature = encodedSignature;
    var settings = {
      url: yelpURL,
      data: parameters,
      cache: true,
      dataType: 'jsonp',
      success: function(results) {
        console.log(results);
        for (var i = 0; i < results.businesses.length; i++) {
          model.locations.push({
            name: results.businesses[i].name,
            address: results.businesses[i].location.display_address,
            coordinates: {lat: results.businesses[i].location.coordinate.latitude, lng: results.businesses[i].location.coordinate.longitude},
            categories: results.businesses[i].categories,
            phone: results.businesses[i].display_phone,
            image: results.businesses[i].image_url,
            id: results.businesses[i].id,
            rating_img: results.businesses[i].rating_img_url,
            top_comment: results.businesses[i].snippet_text,
            url: results.businesses[i].url
          });
        }
        console.log(model.locations);
        viewModel.initialize();
      },
      fail: function() {
        alert('Failed to get Yelp Data');
      }
    };
  $.ajax(settings);
  }
}

var viewModel = {
  visibleLocations: ko.observableArray([]),
  filter: ko.observable(''),
  initialize: function () {
    visibleLocations = viewModel.visibleLocations();
    for (var i = 0; i < model.locations.length; i++) {
      visibleLocations.push(model.locations[i]);
    }
    viewModel.setMarkers();
    viewModel.setWindows();
    viewModel.setBounceToClickedMarkers();
    ko.applyBindings(viewModel);

    viewModel.filter.subscribe(viewModel.search);
  },
  setMarkers: function() {
    for (var i = 0; i < visibleLocations.length; i++) {
      var marker = new google.maps.Marker({
        position: visibleLocations[i].coordinates,
        map: map,
        title: visibleLocations[i].name,
        name: visibleLocations[i].name,
        address: visibleLocations[i].address,
        phone: visibleLocations[i].phone,
        image: visibleLocations[i].image,
        comment: visibleLocations[i].top_comment,
        rating: visibleLocations[i].rating_img,
        url: visibleLocations[i].url,
        categories: visibleLocations[i].categories,
        animation: google.maps.Animation.DROP
      });
      visibleLocations[i].marker = marker;
      bounds.extend(marker.position);
    }
  },
  setWindows: function () { // referenced this functionality from Udacity's Google Maps API course
    infoWindow = new google.maps.InfoWindow;
    for (var i = 0; i < visibleLocations.length; i++) {
      visibleLocations[i].marker.addListener('click', function() {
        viewModel.populateWindow(this, infoWindow);
      });
    }
  },
  populateWindow: function(marker, infowindow) { //referenced this functionality from Udacity's Google Maps API course
      infowindow.marker = marker;
      infowindow.setContent("<div>" + "<h2>" + marker.title + "</h2>" + "<p> <strong>Address</strong>: " + marker.address[0] + "<br/>" + marker.address[2] +  "</p>" + "</p><strong>More Information</strong>: " +
      "<a target='#' href=" + "'" + marker.url + "'" + ">" + marker.url + "</a>" +
      "<p><strong>Phone</strong>: " + marker.phone + "</p>" + "<img src=" + "'" + marker.image + "'" + ">" + "<p><strong>Yelp Rating</strong>: " + "<img src=" + "'" + marker.rating + "'" + "></p>" + "<p><strong>Top Yelp Comment</strong>: " +
      '"' + marker.comment + '"' + "</p>" + "</div>");
      infowindow.open(map, marker);
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        marker.setAnimation(null);
      });
  },
  search: function(character) { //referenced this tutorial for this functionality: http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
    for (var j = 0; j < visibleLocations.length; j++) {
      visibleLocations[j].marker.setMap(null);
    }
    viewModel.visibleLocations.removeAll();
    for (var i = 0; i < model.locations.length; i++) {

      if (model.locations[i].name.toLowerCase().indexOf(character.toLowerCase()) >= 0) {
        viewModel.visibleLocations.push(model.locations[i]);
      }
    }
    viewModel.setMarkers();
    viewModel.setWindows();
    viewModel.setBounceToClickedMarkers();
  },
  setBounceToClickedMarkers: function() { //referenced Google Maps API documentation for this functionality
    for (var j = 0; j < visibleLocations.length; j++) {
      (function(index) { //closure
      visibleLocations[index].marker.addListener('click', function() {
        console.log(visibleLocations[index].marker);
        if (visibleLocations[index].marker.getAnimation() !== null) {
          visibleLocations[index].marker.setAnimation(null);
        }
        else {
          visibleLocations[index].marker.setAnimation(google.maps.Animation.BOUNCE);
          for (var k = 0; k < visibleLocations.length; k++) {
            if (visibleLocations[k] !== visibleLocations[index] && visibleLocations[k].marker.getAnimation() === google.maps.Animation.BOUNCE) {
              visibleLocations[k].marker.setAnimation(null);
            }
          }
        }
      });
    })(j);
    }
  },
  setBounceToClickedListItems: function (marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    }
    else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      for (var i = 0; i < visibleLocations.length; i++) {
        if (visibleLocations[i].marker !== marker && visibleLocations[i].marker.getAnimation() === google.maps.Animation.BOUNCE) {
          visibleLocations[i].marker.setAnimation(null);
        }
      }
    }
  }
}
