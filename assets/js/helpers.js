import * as d3 from "d3";

/**
 * Capitalize a string
 *
 * @param {String} str
 * @param {Number} 
 */
function capitalize(str) {
  if (!str) return str;
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Update a ul of names to display while the user is typing
 *
 * @param {HTMLElement} listDiv
 * @param {Array} names 
 */
function updateNameList(listDiv, names) {
  listDiv.innerHTML = '';
  names.forEach(function(name) {
    let li = document.createElement("li")
    li.innerText = name;
    li.classList.add('pure-menu-heading');
    listDiv.appendChild(li);
  });
}

/**
 * Add a d3 line chart to a given SVG id for a specific name and gender
 *
 * @param {String} svgId
 * @param {String} name
 * @param {String} gender
 */
function createChart(svgId, name, gender) {
  const WIDTH = "100%";
  const HEIGHT = 400;

  let svg = d3.select(`#${svgId}`)
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  d3.json("./assets/json/aggregate.json", function(d) {
    let data = d[gender === "male" ? 'maleData' : 'femaleData'];
    let nameData = __getDataByName(data, name);

    // set up axes and scales
    const X_MIN = d3.min(nameData, d => d.year)
    const X_MAX = d3.max(nameData, d => d.year)    
    const Y_MIN = d3.min(nameData, __getBirthsPerCapita);
    const Y_MAX = d3.max(nameData, __getBirthsPerCapita);
    
    let xScale = d3.scaleLinear()
                  .domain([X_MIN, X_MAX])
                  .range([0, WIDTH]);
    let yScale = d3.scaleLinear()
                  .domain([Y_MIN, Y_MAX])
                  .range([HEIGHT, 0]);

    svg.selectAll('circle')
      .data(nameData)
      .enter()
      .append('circle')
        .attr('r', 5)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(__getBirthsPerCapita(d)));

  });

}

/**
 * Get data for a single name given an object of data, suitable for d3
 *
 * @param {Object} data
 * @param {String} name
 */
function __getDataByName(data, name) {
  return Object.keys(data).map(year => ({
    year: +year, 
    count: data[year].names[name] || 0,
    totalBirths: __getBirthCountByYear(data, year)
  }));
}

/**
 * Get count of all births for a single year 
 * (data is assumed to be already filtered by gender)
 *
 * @param {Object} data
 * @param {String} year
 */
function __getBirthCountByYear(data, year) {
  let births = 0;
  for (let name in data[year].names) {
    births += data[year].names[name];
  }
  return births;
}

/**
 * Get count of name count per 100k births 
 *
 * @param {Object} yearObj
 */
function __getBirthsPerCapita(yearObj) {
  return yearObj.count / yearObj.totalBirths * 1e5;
}

export { capitalize, updateNameList, createChart };