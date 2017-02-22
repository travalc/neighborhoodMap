var map;
var portland;
var infoWindow;
var visibleLocations;
var bounds;
var listView = document.getElementById('listView');
var view = { //initialize map
    initMap: function() {
        portland = new google.maps.LatLng(45.522946, -122.673517);
        map = new google.maps.Map(document.getElementById('map'), {
            center: portland,
            zoom: 16
        });
        bounds = new google.maps.LatLngBounds();
        model.initialize();
    },
    mapError: function() {
        alert("Unable to load google map. Please try again");
    }
};

var model = {
    locations: [],
    initialize: function() { //retrieve model data from Yelp API, referenced this forum discussion for this functionality: https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699
        var yelpURL = 'https://api.yelp.com/v2/search';

        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }
        var parameters = { //oauth credentials for Yelp API
            oauth_consumer_key: 'LyiqmxYUbuLB9p1a_lx8gA',
            oauth_token: 'GZpLwoqEwunNaFT7HwNoRsCiXE3mxMXt',
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            callback: 'cb',
            term: 'restaurant',
            location: 'Portland Chinatown',
            cll: '45.5231, -122.6765',
            radius_filter: 600,
            sort: 2
        };
        var encodedSignature = oauthSignature.generate('GET', yelpURL, parameters, 'rjAxpO7SFR9hyQUtOPvEqOgdDa0', 'FUgWz5YLb7CyIhOOpUp2Up7t_MQ');
        parameters.oauth_signature = encodedSignature;
        var settings = {
            url: yelpURL,
            data: parameters,
            cache: true,
            dataType: 'jsonp',
            success: function(results) { //Loads location data from API request into model
                console.log(results);
                for (var i = 0; i < results.businesses.length; i++) {
                    var name = results.businesses[i].name || "No name provided";
                    var address = results.businesses[i].location.display_address || "No address provided";
                    var coordinates = {
                        lat: results.businesses[i].location.coordinate.latitude,
                        lng: results.businesses[i].location.coordinate.longitude
                    } || "No coordinates provided";
                    var categories = results.businesses[i].categories || "No categories provided";
                    var phone = results.businesses[i].display_phone || "No phone provided";
                    var image = results.businesses[i].image_url || "No image provided";
                    var id = results.businesses[i].id || "No id provided";
                    var rating_img = results.businesses[i].rating_img_url || "No rating image provided";
                    var top_comment = results.businesses[i].snippet_text || "No comment provided";
                    var url = results.businesses[i].url || "No URL provided";
                    model.locations.push({
                        name: name,
                        address: address,
                        coordinates: coordinates,
                        categories: categories,
                        phone: phone,
                        image: image,
                        id: id,
                        rating_img: rating_img,
                        top_comment: top_comment,
                        url: url
                    });
                }
                console.log(model.locations);
                viewModel.initialize();
            },
            error: function(err) { //alerts user if Yelp API request failed
                alert('Failed to get Yelp Data because of' + err);
            }
        };
        $.ajax(settings);
    }
};

var viewModel = {
    visibleLocations: ko.observableArray([]),
    filter: ko.observable(''),
    initialize: function() {
        visibleLocations = viewModel.visibleLocations();
        for (var i = 0; i < model.locations.length; i++) {
            visibleLocations.push(model.locations[i]);
        }
        viewModel.setMarkers();
        viewModel.setWindows();
        visibleLocations.forEach(function(location) {
            (function(item) {
                item.marker.addListener('click', function() {
                    viewModel.setBounce(item.marker);
                });
            })(location);
        });

        ko.applyBindings(viewModel);

        viewModel.filter.subscribe(viewModel.search);
    },
    setMarkers: function() { //create markers for each location
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
    setWindows: function() { // referenced this functionality from Udacity's Google Maps API course. Opens infowindows when markers are clicked
        infoWindow = new google.maps.InfoWindow();
        for (var i = 0; i < visibleLocations.length; i++) {
            visibleLocations[i].marker.addListener('click', function() {
                viewModel.populateWindow(this, infoWindow);
            });
        }
    },
    populateWindow: function(marker, infowindow) { //referenced this functionality from Udacity's Google Maps API course. Adds HTML content to infowindows.
        infowindow.marker = marker;
        infowindow.setContent("<div>" + "<h2>" + marker.title + "</h2>" + "<p> <strong>Address</strong>: " + marker.address[0] + "<br/>" + marker.address[2] + "</p>" + "</p><strong>More Information</strong>: " +
            "<a target='#' href=" + "'" + marker.url + "'" + ">" + marker.url + "</a>" +
            "<p><strong>Phone</strong>: " + marker.phone + "</p>" + "<img src=" + "'" + marker.image + "'" + ">" + "<p><strong>Yelp Rating</strong>: " + "<img src=" + "'" + marker.rating + "'" + "></p>" + "<p><strong>Top Yelp Comment</strong>: " +
            '"' + marker.comment + '"' + "</p>" + "</div>");
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
            marker.setAnimation(null);
        });
    },
    search: function(character) { //referenced this tutorial for this functionality: http://opensoul.org/2011/06/23/live-search-with-knockoutjs/. Function that filters list items based on key entered.
        infoWindow.close();
        for (var j = 0; j < visibleLocations.length; j++) {
            visibleLocations[j].marker.setVisible(false);
            visibleLocations[j].marker.setAnimation(null);

        }
        viewModel.visibleLocations.removeAll();
        for (var i = 0; i < model.locations.length; i++) {

            if (model.locations[i].name.toLowerCase().indexOf(character.toLowerCase()) >= 0) {
                viewModel.visibleLocations.push(model.locations[i]);
                for (var k = 0; k < visibleLocations.length; k++) {
                    visibleLocations[k].marker.setVisible(true);
                }
            }
        }

    },
    setBounce: function(marker) { //Sets animation to marker when associated list item is selected
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            for (var i = 0; i < visibleLocations.length; i++) {
                if (visibleLocations[i].marker !== marker && visibleLocations[i].marker.getAnimation() === google.maps.Animation.BOUNCE) {
                    visibleLocations[i].marker.setAnimation(null);
                }
            }
        }
    },
    openList: function() { //responsive function for hamburger button on mobile, brings listed locations and filter input into view

        listView.style.height = '40%';
    },
    closeList: function() {
        listView.style.height = '0';
    }
};
