function format_popup(feature) {
    return "<table>" +
        "<thead>" +
        "<tr><td>Player Name</td><td>Birth City</td><td>Team</td></tr>" +
        "</thead>" +
        "<tbody>" +
        "<tr><td>" + feature.properties.player_name  + "</td><td>" + feature.properties.city_name + "</td><td>" + feature.properties.current_team + "</td></tr>" +
        "</tbody>" +
        "</table>"
}


var map = L.map('map', {
    center: [36, -94],
    zoom: 4
});

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OpenStreetMap_Mapnik.addTo(map);

var oms = new OverlappingMarkerSpiderfier(map);

var popup = new L.Popup();

oms.addListener('click', function(marker) {
  popup.setContent(marker.desc);
  popup.setLatLng(marker.getLatLng());
  map.openPopup(popup);
});

oms.addListener('spiderfy', function(markers) {
    for (var i = 0, len = markers.length; i < len; i ++) markers[i].setIcon(new lightIcon());
    map.closePopup();
  });

var playersLayer = new L.GeoJSON.AJAX("nhl_birth_cities/nhl_players_birth_cities.geojson", {
    onEachFeature: function (feature, layer) {
        layer.bindPopup(format_popup(feature))
    },
    pointToLayer: function (feature, latlng) {
        var marker = new L.Marker(latlng);//, circleMarkerOptions);
        oms.addMarker(marker);
        return marker;
    }
});

playersLayer.addTo(map);

var sidebar = L.control.sidebar('sidebar').addTo(map);