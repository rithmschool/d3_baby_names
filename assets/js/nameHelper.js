// helper to get unique names from data - the result lives in uniqueNames.js

document.addEventListener('DOMContentLoaded', function() {

  d3.json('../assets/json/aggregate.json', function(d) {
    
    var maleObj = {};
    var femaleObj = {};

    for (var year in d.maleData) {
      for (var name in d.maleData[year].names) {
        maleObj[name] = true;
      }
    }

    for (var year in d.femaleData) {
      for (var name in d.femaleData[year].names) {
        femaleObj[name] = true;
      }
    }
    
    var maleNames = Object.keys(maleObj);
    var femaleNames = Object.keys(femaleObj);

  });

});