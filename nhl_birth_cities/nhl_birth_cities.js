
function Player(player_id) {
    this.player_id = player_id;
    this.player_info = window.mapData.players[player_id];
    this.player_name = this.player_info.player_name;
    this.city_info = window.mapData.city_lookup[this.player_info.city_id];
    this.city_name = this.city_info.city_name;

    this.flyTo = function () {
        window.map.flyTo([this.city_info.lat, this.city_info.lon], 8);
    };

    this.getAsRow = function () {
        var flyToText = "window.map.flyTo([" + this.city_info.lat + ","+ this.city_info.lon +"], 8)";
        return "<tr><td onclick='"+ flyToText +"'>"+ this.player_name +"</td><td>"+ this.player_info.current_team +"</td></tr>"
    }
}

function City(city_id) {
    this.city_id = city_id;
    this.city_info = window.mapData.city_lookup[city_id];
    this.name = this.city_info.city_name;
    this.all_players = window.mapData.city_players[city_id];
    this.player_count = this.all_players.length;

    this.popUpContent = function () {
        var content = "<b>" + this.name + ", " + this.city_info.country_iso3 + "</b><br>";
        for (var plyr in this.all_players) {
            var player_id = this.all_players[plyr];
            var player_info = window.mapData.players[player_id];
            content += '<a href="' + player_info.hockey_reference_link + '">' + player_info.player_name + "</a>, " + player_info.current_team + "<br>"
        }
        return content
    };
    this.flyTo = function () {
        window.map.flyTo([this.city_info.lat, this.city_info.lon], 8);
    };
}

function Team(team_name) {
    this.team_name = team_name;
    this.players = window.mapData.teams[this.team_name];
}

var map = L.map('map', {
    center: [36, -94],
    zoom: 4
});

window.map = map;

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OpenStreetMap_Mapnik.addTo(window.map);


$.getJSON('nhl_birth_cities/data.json', function(data) {
    var geoJSON = data.cities_geojson;
    var players = data.players;
    var teams = data.teams;
    var city_lookup = data.city_lookup;
    var city_players = data.city_players;
    // Set data to be available globally
    window.mapData = {};
    window.mapData.players = players;
    window.mapData.teams = teams;
    window.mapData.city_lookup = city_lookup;
    window.mapData.city_players = city_players;

    // var layers = {};
    //
    // for (var key in teams) {
    //     layers[key] = L.layerGroup();
    // }
    //
    // layers["all"] = L.layerGroup();

    new L.GeoJSON(geoJSON, {
        onEachFeature: function (feature, layer) {
            city = new City(feature.id);
            layer.bindPopup(city.popUpContent())
        },
        pointToLayer: function (feature, latlng) {
            return new L.Marker(latlng);
        }
    }).addTo(window.map);

    // citiesLayer.addTo(map);
}).then(function () {
    tbl_html = "<table><thead><tr><td>Player Name</td><td>Team</td></tr></thead><tbody>";
    for (var plyr in window.mapData.players) {
        player = new Player(plyr);
        tbl_html += player.getAsRow()
    }
    tbl_html += "</tbody></table>";
    $("#players").append(tbl_html);
});


var sidebar = L.control.sidebar('sidebar').addTo(window.map);