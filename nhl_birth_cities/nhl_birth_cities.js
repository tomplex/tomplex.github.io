
var map = L.map('map', {
    center: [36, -94],
    zoom: 4
});

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OpenStreetMap_Mapnik.addTo(map);

var citiesLayer;

$.getJSON('nhl_birth_cities/city_player.geojson', function(data) {
    var geoJSON = data;
    var features = geoJSON.features;
    var players = {};
    var teams = {};

    for (var idx in features) {
        // Create a correlation object of city_id : [ players ]
        // And team name : [ players ]
        players[features[idx].id] = features[idx].properties.players;
        for (var player in features[idx].properties.players) {
            if (features[idx].properties.players[player].current_team in teams) {
                teams[features[idx].properties.players[player].current_team].push(features[idx].properties.players[player]);
            } else {
                teams[features[idx].properties.players[player].current_team] = [];
                teams[features[idx].properties.players[player].current_team].push(features[idx].properties.players[player]);
            }
        }
    }

    citiesLayer = new L.GeoJSON(geoJSON, {
        onEachFeature: function (feature, layer) {
            var content = "<b>" + feature.properties.city_name + ", " + feature.properties.country_iso3 + "</b><br>";
            for (plyr in players[feature.id]) {
                content += players[feature.id][plyr].player_name + ", " + players[feature.id][plyr].current_team + "<br>"
            }
            layer.bindPopup(content)
        },
        pointToLayer: function (feature, latlng) {
            return new L.Marker(latlng)//.on('click');
        }
    });

    citiesLayer.addTo(map);
    window.mapData = {};
    window.mapData.features = features;
    window.mapData.players = players;
    window.mapData.teams = teams
});

// $.getJSON('nhl_birth_cities/player_city.json', function (data) {
//    window["players"] = data;
// });



var sidebar = L.control.sidebar('sidebar').addTo(map);