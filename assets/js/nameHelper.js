// helper to get unique names from data - the result lives in uniqueNames.js

document.addEventListener('DOMContentLoaded', function() {

  d3.json('./state_data.json', function(d) {
    var names = Object.keys(d.reduce(function(namesObj, state) {
      ['maleData', 'femaleData'].forEach(function(gender) {
        state[gender].forEach(function(yearObj) {
          yearObj.names.forEach(function(nameObj) {
            namesObj[nameObj.name] = true;
          });
        });
      });
      return namesObj;
    }, {}));

    console.log(names);
  });

});