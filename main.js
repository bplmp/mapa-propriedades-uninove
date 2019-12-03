var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1UH8u5zl_qtsEwLzIuayDG2JxEmyW48TsxE3htUMcDz4/edit?usp=sharing';

function init() {
  console.log('starting');
  Tabletop.init({
    key: publicSpreadsheetUrl,
    callback: showInfo,
    simpleSheet: true
  })
}

function showInfo(data, tabletop) {
  console.log(data);
  geoJSON = buildGeoJSON(data);
  console.log(JSON.stringify(geoJSON));
  console.log(data.length, 'rows received');
  console.log(geoJSON.features.length, 'rows parsed');
  loadMap(geoJSON);
}

function buildFeature(feature) {
  var featureObject = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Point",
      "coordinates": []
    }
  };
  for (var variable in feature) {
    if (feature.hasOwnProperty(variable)) {
      featureObject['properties'][variable] = feature[variable]
    }
  };
  featureObject['geometry']['coordinates'].push(parseFloat(feature['Latitude']))
  featureObject['geometry']['coordinates'].push(parseFloat(feature['Longitude']))
  return featureObject;
}

function buildGeoJSON(data) {
  var featureCollection = {
    "type": "FeatureCollection",
    "features": []
  }
  for (var i = 0; i < data.length; i++) {
    feature = data[i];
    feature['Longitude'] = feature['Longitude'].replace(',', '.');
    feature['Latitude'] = feature['Latitude'].replace(',', '.');
    var lon = feature['Longitude'];
    var lat = feature['Latitude'];
    if (lon.match(/[a-z]/i) && lat.match(/[a-z]/i)) {
      feature['Longitude'] = parseDMS(feature['Longitude'])
      feature['Latitude'] = parseDMS(feature['Latitude'])
    }
    try {
      if (isNaN(parseFloat(lon)) == false && isNaN(parseFloat(lat)) == false) {
        var built = buildFeature(feature);
        featureCollection['features'].push(built);
      }
    } catch (e) {
        console.log('error parsing row', i, e);
    }
  }
  return featureCollection;
}

function loadMap(geoJSON) {
  var map = L.map('map').setView([0, 0], 2);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map);

  function popup(feature, layer) {
    var properties = feature.properties;
    var popupContent = '';
    var columnsToShow = ['Nome da Propriedade', 'Endereço', 'Instituição', 'Tipo de uso', 'Número de unidades habitacionais']

    for (var variable in properties) {
      if (properties.hasOwnProperty(variable) && columnsToShow.includes(variable)) {
        popupContent += '<strong>' + variable + '</strong>: ' + properties[variable] + '</br>'
      }
    }
    layer.bindPopup(popupContent);
  }

  var pointsLayers = L.geoJSON(geoJSON, {
    pointToLayer: function(feature, latlng) {
      return L.marker(latlng, {
      });
    },
    onEachFeature: popup
  }).addTo(map);

}

// https://stackoverflow.com/questions/1140189/converting-latitude-and-longitude-to-decimal-values
function parseDMS(input) {
    var parts = input.split(/[^\d\w\.]+/);
    return convertDMSToDD(parts[0], parts[1], parts[2], parts[3]);
}

function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = parseInt(degrees) + parseInt(minutes)/60 + parseInt(seconds)/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    }
    return dd;
}

document.addEventListener("DOMContentLoaded", function() {
  init();
});
