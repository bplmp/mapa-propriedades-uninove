var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1UH8u5zl_qtsEwLzIuayDG2JxEmyW48TsxE3htUMcDz4/edit?usp=sharing';

function init() {
  console.log('starting');
  Tabletop.init({
    key: publicSpreadsheetUrl,
    callback: showInfo,
    simpleSheet: false
  })
}

function showInfo(data, tabletop) {
  var dataSheet = data.data.elements
  console.log(dataSheet);
  geoJSON = buildGeoJSON(dataSheet);
  console.log(JSON.stringify(geoJSON));
  console.log(dataSheet.length, 'rows received');
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

  L.tileLayer('https://api.mapbox.com/styles/v1/bernardosp/ck3r9ne5k21bj1dpdgl67vzyu/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYmVybmFyZG9zcCIsImEiOiJjamkyMmhqdjAwZ284M2txcHpqYjUwam91In0.RiploEl5Mm6bjXhPZbN6XQ', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
  }).addTo(map);

  function popup(feature, layer) {
    var prop = feature.properties;
    var propertyName = 'Property Name';
    var address = 'Address';
    var stateProvince = 'State/Province';
    var city = 'City';
    var country = 'Country';
    var institution = 'Institution';
    var link = 'Link';

    function generateLine(prop, propKey) {
      return (prop[propKey] ? `<tr><td><strong>${propKey}</strong></td><td>${prop[propKey]}</td></tr>` : '')
    }
    function generateLink(prop, propKey, linkText) {
      return (prop[propKey] ? `<tr><td colspan="2"><strong><a href="${prop[propKey]}" target="_blank">${linkText}</a></strong></td></tr>` : '')
    }

    var popupContent = `
      ${generateLine(prop, propertyName)}
      ${generateLine(prop, address)}
      ${generateLine(prop, stateProvince)}
      ${generateLine(prop, city)}
      ${generateLine(prop, country)}
      ${generateLink(prop, link, 'Link to property website')}
    `

    layer.bindPopup('<table class="table table-sm"><tbody>' + popupContent + '</tbody></table>');
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
