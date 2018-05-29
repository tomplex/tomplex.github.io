// Map setup
window.map = L.map('map', {
    center: [36, -8],
    zoom: 3
});

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OpenStreetMap_Mapnik.addTo(window.map);

// Data accessibility
var cities_geojson = data.cities_geojson;
var player_data = data.players;
var team_data = data.teams;
var city_lookup = data.city_lookup;
var city_players = data.city_players;

/*
------------------------------------------------------------------------------------------------------------------------
Player helper class
 */

function Player(player_id) {
    this.player_id = player_id;
    this.player_info = player_data[player_id];
    this.player_name = this.player_info.player_name;
    this.city_info = city_lookup[this.player_info.city_id];
    this.city_name = this.city_info.city_name;
    this.country = this.city_info.country_iso3;
    this.subdiv = this.city_info.subdiv;
    this.team_name = this.player_info.current_team;
    this.latlong = [this.city_info.lat, this.city_info.lon];

    this.flyTo = function (zoom) {
        window.map.flyTo([this.city_info.lat, this.city_info.lon], zoom);
    };

    this.getAsRow = function () {
        var flyToText = "players[" + this.player_id + "].flyTo(12)";
        return "<li onclick='"+ flyToText +"'>"+ this.player_name +", "+ this.player_info.current_team +"</li>"
    };

    this.popUpContent = function () {
        var content = "<b>" + this.city_name;
        if (this.subdiv === null) {
            content += ", " + this.country + "</b><br>";
        } else {
            content += ", " + this.subdiv + " " + this.city_info.country_iso3 + "</b><br>";
        }
        content += '<a href="' + this.player_info.hockey_reference_link + '">' + this.player_name + "</a>, " + this.team_name + "<br>";
        return content
    };

    this.marker = L.marker(this.latlong).bindPopup(this.popUpContent());

    this.select = function (zoom) {
        this.flyTo(zoom);
        this.marker.openPopup()
    };

    this.show = function () {
        this.marker.addTo(window.map)
    };

    this.hide = function () {
        this.marker.removeFrom(window.map)
    }
}

var players = {};
var playerListValues = [];

for (var plyr in player_data) {
    p = new Player(plyr);
    players[plyr] = p;
    playerListValues.push({name: p.player_name, team: p.team_name, show: "players[" + p.player_id + "].select(12)" })
}

var playerListOptions = {
    valueNames: [
        'name',
        'team',
        { name: 'show', attr: 'onclick' }
    ],
    item: '<li><div><h4 class="name show pointy list-item"></h4><p class="team list-item"></p></div></li>'
};

var playerList = new List('player-list', playerListOptions, playerListValues);

/*
------------------------------------------------------------------------------------------------------------------------
City helper class

 */

function City(city_id) {
    this.city_id = city_id;
    this.city_info = city_lookup[city_id];
    this.name = this.city_info.city_name;
    this.country = this.city_info.country_iso3;
    this.subdiv = this.city_info.subdiv;
    this.all_players = city_players[city_id];
    this.player_count = this.all_players.length;
    this.latlong = [this.city_info.lat, this.city_info.lon];

    this.popUpContent = function () {
        var content = "<b>" + this.name;
        if (this.subdiv === null) {
            content += ", " + this.country + "</b><br>";
        } else {
            content += ", " + this.subdiv + " " + this.city_info.country_iso3 + "</b><br>";
        }
        for (var plyr in this.all_players) {
            var player_id = this.all_players[plyr];
            var player_info = player_data[player_id];
            content += '<a href="' + player_info.hockey_reference_link + '">' + player_info.player_name + "</a>, " + player_info.current_team + "<br>"
        }
        return content
    };

    this.select = function (zoom) {
        this.show();
        this.flyTo(zoom);
        this.marker.openPopup();
    };

    this.flyTo = function (zoom) {
        window.map.flyTo([this.city_info.lat, this.city_info.lon], zoom);
    };

    this.marker = L.marker(this.latlong).bindPopup(this.popUpContent());

    this.show = function () {
        this.marker.addTo(window.map)
    };

    this.hide = function () {
        this.marker.removeFrom(window.map)
    }
}

var cities = {};
var cityListValues = [];
var citiesGroup = L.layerGroup();
for (var cityidx in cities_geojson.features) {
    try {

        c = new City(cities_geojson.features[cityidx].id);
        cities[cities_geojson.features[cityidx].id] = c;
        citiesGroup.addLayer(c.marker);
        cityListValues.push({'city': c.name + ', ', 'country': c.country, 'show_city': "hideAllCities(); hideAllTeams(); cities['" + cities_geojson.features[cityidx].id + "'].select(8);" });

        if (c.name == null) {
            console.log(c)
        }


    } catch(error) {
        console.error("failed on ");
        console.error(cities_geojson.features[cityidx])
    }

}

function showAllCities() {
    for (var idx in cities) {
        try {
            cities[idx].show();
        } catch (error) {
            console.log(cities[idx])
        }
    }
}

function hideAllCities() {
    for (var idx in cities) {
        cities[idx].hide();
    }
}

var cityListOptions = {
    valueNames: [
        'city',
        'country',
        { name: 'show_city', attr: 'onclick' }
    ],
    item: '<li><h4 class="city show_city pointy list-item"></h4><p class="country list-item"></p></li>'
};

var cityList = new List('city-list', cityListOptions, cityListValues).sort('city');

/*
------------------------------------------------------------------------------------------------------------------------

Team helper function / class

 */

function Team(team_name) {
    var self = this;
    self.team_name = team_name;
    self.players = [];
    self.markers = [];
    self.shown = false;

    for (var plyr_id in team_data[self.team_name]) {
        p = players[team_data[self.team_name][plyr_id]];

        self.players.push(p);
        self.markers.push(p.marker);
    }

    self.layer_group = L.layerGroup(this.markers);

    self.show = function () {
        self.layer_group.addTo(window.map)
    };

    self.hide = function () {
        self.layer_group.removeFrom(window.map)
    };

    self.toggle = function () {
        if (self.shown === true) {
            self.hide();
            self.shown = false;
        } else {
            self.show();
            self.shown = true;
        }
    }
}

function hideAllTeams() {
    for (var t in teams) {
        teams[t].hide()
    }
}


var teams = {};
var teamListValues = [];

for (var t in team_data) {
    teams[t] = new Team(t);
    teamListValues.push({team: t, show_team: "hideAllCities(); hideAllTeams(); teams['" + t + "'].show()"})
}
/*
Searchable list
 */
var teamListOptions = {
    valueNames: [
        'team',
        { name: 'show_team', attr: 'onclick' }
    ],
    item: '<li><h4 class="team show_team pointy"></h4></li>'
};

var teamList = new List('team-list', teamListOptions, teamListValues).sort('team');

/*
------------------------------------------------------------------------------------------------------------------------
Create sidebar

 */

var sidebar = L.control.sidebar('sidebar').addTo(window.map);

// Show the data
showAllCities();
