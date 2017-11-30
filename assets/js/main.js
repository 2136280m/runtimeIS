/*
	Read Only by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

$(document).ready(function(){

      $("input").change(function(e) {

        for (var i = 0; i < e.originalEvent.srcElement.files.length; i++) {

          var file = e.originalEvent.srcElement.files[i];

          var img = document.createElement("img");
          var reader = new FileReader();
          reader.onloadend = function() {
             img.src = reader.result;
          }
          reader.readAsDataURL(file);
          $("input").after(img);
        }
      });



      $('#button').on('click', function() {
        $('#file-input').trigger('click');

      });

      $('#file-input').change(function () {

      	document.body.scrollTop = document.documentElement.scrollTop = 0;

        var reader = new FileReader();
        reader.onload = function(e) {
        // e.target.result should contain the text
        var text=reader.result;

        //console.log("XML TEXT" + text);

		var gpxDoc = $.parseXML(text); 
        var $xml = $(gpxDoc);

        // Find Name of Activity
        var $name = $xml.find('name');
        console.log($name.text());

        $('#file-title').text($name.text());


        var totalTracks = 0;
        var totalHR = 0;
        var totalCAD = 0;

        var totalLat = 0;
        var totalLon = 0;
		var totalDist = null;
		var firstLat = null;
		var firstLon = null;
        var lastLat = null;
        var lastLon = null;
		var firstLatLon = null;
		var lastLatLon = null;
		var prevLatLon = null;

        var maxLat = null;
        var maxLon = null;
        var minLat = null;
        var minLon = null;

        var firstDateTime = 0;
        var lastDateTime = 0;
		var totalTime = 0;
		var curTime = 0;
		var prevTime = 0;
		var timeSpan = 0;
		
		var avgSpeed = 0;
		var curSpeed = 0;
		var topSpeed = 0;
		

        // Iterate through all track segements and find a route.
        $xml.find('trkpt').each(function(){
			// this is where all the reading and writing will happen
			var lat = $(this).attr("lat");
			var lon = $(this).attr("lon");
			var curLatLon = new google.maps.LatLng(lat,lon); 
			var hr = $(this).find('ns3\\:hr').text();

			var cad = $(this).find('ns3\\:cad').text();
			var datetime = $(this).find('time').text();
			curTime = new Date(datetime);

			if (firstLat == null || firstLon == null){
				firstLat = lat;
				firstLon = lon;
				firstLatLon = new google.maps.LatLng(firstLat,firstLon); 
				prevLatLon = firstLatLon;
				firstDateTime = new Date(datetime);
				firstDateTimeString = firstDateTime.toString().substring(0,24);
				prevTime = new Date(datetime);
			}
			lastDateTime = new Date(datetime);
			lastDateTimeString = lastDateTime.toString().substring(0,24);
			
			var dist = getDistance(prevLatLon,curLatLon);
			totalDist += dist;
			prevLatLon = curLatLon;
  
            totalTracks += 1;
            totalHR += parseInt(hr);
            totalCAD += parseInt(cad);
            totalLat += parseFloat(lat);
            totalLon += parseFloat(lon);
			
			timeSpan = (curTime - prevTime)/1000/60;
			curSpeed =(dist/1000)/(timeSpan/60);
			if (curSpeed > topSpeed){
				topSpeed = curSpeed;
			}
			prevTime = new Date(datetime);

            //  Get the figures for the bounding box
            if (maxLat == null || maxLon == null ||  minLat == null || minLon == null ) {
              maxLat = lat;
              minLat = lat;

              maxLon = lon;
              minLon = lon;
            }

            maxLat = Math.max(lat, maxLat);
            minLat = Math.min(lat, minLat);

            maxLon = Math.max(lon, maxLon);
            minLon = Math.min(lon, minLon);

            if (lastLat == null || lastLon == null) {
              lastLat = lat;
              lastLon = lon;
            } else {
              var line = new google.maps.Polyline({
                path: [
                  new google.maps.LatLng(lastLat, lastLon), 
                  new google.maps.LatLng(lat, lon)
                ],
              strokeColor: "#09b57b",
              strokeOpacity: 0.4,
              strokeWeight: 10,
              map: map
              });

              var myInfoWindow = new google.maps.InfoWindow({
              	content: '<p>Heart rate: ' + parseInt(hr) + ' BPM </p>'	+
              			'<p>Cadence: ' + parseInt(cad) + ' SPM</p>'	+
          				'<p>Time: ' + lastDateTime.toString().substring(16,24) + '</p>'
          			});

              google.maps.event.addListener(line, 'mouseover', function() {
              	myInfoWindow.setPosition(new google.maps.LatLng(lat, lon));
              	myInfoWindow.open(map);
              });

              google.maps.event.addListener(line, 'mouseout', function() {
              	myInfoWindow.close();
              });

              lastLon = lon;
              lastLat = lat;
			  lastLatLon = new google.maps.LatLng(lastLat,lastLon);
			}
        });
	  
		totalTime = (lastDateTime-firstDateTime)/ 1000 / 60;
		totalDist = (totalDist/1000);
		avgSpeed = totalDist/(totalTime/60);
		
		var startMarker = new google.maps.Marker({position: firstLatLon,label:"A",map:map,title:"Start"});
		var endMarker = new google.maps.Marker({position: lastLatLon,label:"B",map:map,title:"End"});

        var startMarkerInfo = new google.maps.InfoWindow({
          content: '<p> Start of route </p>' +
          			'<p>' + firstDateTime.toString().substring(16,24) + '</p>'
        });
        var endMarkerInfo = new google.maps.InfoWindow({
          content: '<p> End of route </p>' +
          			'<p>' + lastDateTime.toString().substring(16,24) + '</p>'
        });

        google.maps.event.addListener(startMarker, 'click', function() {
          startMarkerInfo.open(map, startMarker);
        });
        google.maps.event.addListener(endMarker, 'click', function() {
          endMarkerInfo.open(map, endMarker);
        });

		//marker.setMap(map);
        //  Add the overview stats to preview run details...
        $('#activity-overview').text(

        	"Average Heartrate: " + (totalHR/totalTracks).toFixed(2) + 

        	" BPM || Average Cadence: " + (totalCAD/totalTracks).toFixed(2) +
			
			" SPM || Total Points Tracked: " + (totalTracks)

        );


		$('#totalDist').text(totalDist.toFixed(2) + " km");
		$('#avgSpeed').text(avgSpeed.toFixed(2) + " km/h");
		$('#topSpeed').text(topSpeed.toFixed(2) + " km/h");
		$('#firstTime').text(firstDateTimeString);
		$('#lastTime').text(lastDateTimeString);
		$('#dateDiff').text(totalTime.toFixed(0) + " mins and " + Math.abs(lastDateTime.getSeconds() - firstDateTime.getSeconds()) + " seconds");

        // Recentre the MAP
        map.setCenter(new google.maps.LatLng(totalLat/totalTracks, totalLon/totalTracks));

        map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(minLat, minLon),new google.maps.LatLng(maxLat, maxLon)));

        };

        reader.readAsText(this.files[0]);
        $('#file-title').text(this.files[0].name);

      
      });
    });


var map;
      function initMap() {
        var currentLocation = {lat:55.873555,lng: -4.292622};
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 13,
          center: currentLocation
        });
        var marker = new google.maps.Marker({
          position: currentLocation,
          map: map
        });
    }

//Generous source =
//   https://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

(function($) {

	skel.breakpoints({
		xlarge: '(max-width: 1680px)',
		large: '(max-width: 1280px)',
		medium: '(max-width: 1024px)',
		small: '(max-width: 736px)',
		xsmall: '(max-width: 480px)'
	});

	$(function() {

		var $body = $('body'),
			$header = $('#header'),
			$nav = $('#nav'), $nav_a = $nav.find('a'),
			$wrapper = $('#wrapper');

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on medium.
			skel.on('+medium -medium', function() {
				$.prioritize(
					'.important\\28 medium\\29',
					skel.breakpoint('medium').active
				);
			});

		// Header.
			var ids = [];

			// Set up nav items.
				$nav_a
					.scrolly({ offset: 44 })
					.on('click', function(event) {

						var $this = $(this),
							href = $this.attr('href');

						// Not an internal link? Bail.
							if (href.charAt(0) != '#')
								return;

						// Prevent default behavior.
							event.preventDefault();

						// Remove active class from all links and mark them as locked (so scrollzer leaves them alone).
							$nav_a
								.removeClass('active')
								.addClass('scrollzer-locked');

						// Set active class on this link.
							$this.addClass('active');

					})
					.each(function() {

						var $this = $(this),
							href = $this.attr('href'),
							id;

						// Not an internal link? Bail.
							if (href.charAt(0) != '#')
								return;

						// Add to scrollzer ID list.
							id = href.substring(1);
							$this.attr('id', id + '-link');
							ids.push(id);

					});

			// Initialize scrollzer.
				$.scrollzer(ids, { pad: 300, lastHack: true });

		// Off-Canvas Navigation.

			// Title Bar.
				$(
					'<div id="titleBar">' +
						'<a href="#header" class="toggle"></a>' +
						'<span class="title">' + $('#logo').html() + '</span>' +
					'</div>'
				)
					.appendTo($body);

			// Header.
				$('#header')
					.panel({
						delay: 500,
						hideOnClick: true,
						hideOnSwipe: true,
						resetScroll: true,
						resetForms: true,
						side: 'right',
						target: $body,
						visibleClass: 'header-visible'
					});

			// Fix: Remove navPanel transitions on WP<10 (poor/buggy performance).
				if (skel.vars.os == 'wp' && skel.vars.osVersion < 10)
					$('#titleBar, #header, #wrapper')
						.css('transition', 'none');

	});

})(jQuery);
