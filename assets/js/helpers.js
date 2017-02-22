import * as d3 from "d3";
import d3Tip from "d3-tip";
import * as topojson from "topojson";

d3.tip = d3Tip;

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

  const WIDTH = document.getElementById(svgId).parentElement.clientWidth;
  const HEIGHT = 480;
  const PADDING = {
    BOTTOM: 60,
    TOP: 20,
    RIGHT: 80,
    LEFT: 80
  };

  let svg = d3.select(`#${svgId}`)
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  // set up tooltip
  let tip = d3.tip()
              .attr('class', 'tooltip')
              .html(d => `
                <p>Year: <b class=${gender}>${d.year}</b></p>
                <p>${name} Total: <b class=${gender}>${d3.format(",")(d.count)}</b></p>
                <p>Birth Total: <b class=${gender}>${d3.format(",")(d.totalBirths)}</b></p>
              `);
              
  svg.call(tip);

  d3.json("./assets/json/aggregate.json", function(d) {
    let data = d[gender === "male" ? 'maleData' : 'femaleData'];
    let color = gender === "male" ? "#79BFA1" : "#F5A352";
    let nameData = __getDataByName(data, name);

    // set up axes and scales
    const X_MIN = d3.min(nameData, d => d.year)
    const X_MAX = d3.max(nameData, d => d.year)    
    const Y_MIN = d3.min(nameData, __getBirthsPerCapita);
    const Y_MAX = d3.max(nameData, __getBirthsPerCapita);
    
    let xScale = d3.scaleLinear()
                  .domain([X_MIN, X_MAX])
                  .range([PADDING.LEFT, WIDTH - PADDING.RIGHT]);
    let yScale = d3.scaleLinear()
                  .domain([Y_MIN, Y_MAX])
                  .range([HEIGHT - PADDING.BOTTOM, PADDING.TOP]);
    
    // plot points
    svg.selectAll('line')
      .data(nameData.slice(1))
      .enter()
        .append('line')
          .attr('x1', (d,i) => xScale(nameData[i].year))
          .attr('y1', (d,i) => yScale(__getBirthsPerCapita(nameData[i])))
          .attr('x2', (d,i) => xScale(d.year))
          .attr('y2', (d,i) => yScale(__getBirthsPerCapita(d)))
          .attr('stroke', color)
          .attr('stroke-width', '2px')
          .style('opacity', 0)
        .transition()
          .delay((d, i) => 1000 + 20 * i)
          .duration(20)
          .style('opacity', 1)

    svg.selectAll('circle')
      .data(nameData)
      .enter()
      .append('circle')
        .attr('r', 6)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(__getBirthsPerCapita(d)))
        .attr('fill', color)
        .style('opacity', 0)
        .on('mouseover', tip.show)
        .on('touchstart', tip.show)
        .on('mouseout', tip.hide)
        .on('touchup', tip.hide)
      .transition()
        .delay((d, i) => 1000 + 20 * i)
        .duration(20)
        .style('opacity', 1)

    // plot axes
    svg.append("g")
      .attr("transform", `translate(0,${HEIGHT - PADDING.BOTTOM})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("")))
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)

    svg.append("text")
      .attr("x", xScale((X_MAX + X_MIN) / 2))
      .attr("y", HEIGHT - PADDING.BOTTOM / 3)
      .style("text-anchor", "middle")
      .text("Year")
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)
    
    svg.append("g")
      .attr("transform", `translate(${PADDING.LEFT}, 0)`)
      .call(d3.axisLeft(yScale))
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)

    svg.append("text")
      .attr("y", PADDING.LEFT / 2)
      .attr("x", -(HEIGHT - PADDING.BOTTOM) / 2)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .text(`Babies named ${name} per 100,000 ${gender} births`)
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)

  });

}

/**
 * Add a d3 map to a given SVG id for a specific name and gender
 *
 * @param {String} svgId
 * @param {String} name
 * @param {String} gender
 */
function createMap(svgId, name, gender) {

  const WIDTH = document.getElementById(svgId).parentElement.clientWidth;
  const HEIGHT = 480;
  const PADDING = WIDTH / 1000 * 80
  const MAP_RATIO = 1000 / 583;
  const MAP_HEIGHT = WIDTH / MAP_RATIO;

  let lightColor = gender === "male" ? "#C6FFEE" : "#FFD685";
  let mainColor = gender === "male" ? "#79BFA1" : "#F5A352";
  let svg = d3.select(`#${svgId}`)
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  let path = d3.geoPath()

  d3.queue()
    .defer(d3.json, 'https://d3js.org/us-10m.v1.json')
    .defer(d3.tsv, 'https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/us-state-names.tsv')
    .await(function(error, d1, d2) {
      if (error) alert(error);

      // clean up mapping data
      let stateTopoJSONData = topojson.feature(d1, d1.objects.states).features;
      stateTopoJSONData.forEach(function(state) {
        let foundState = d2.find(s => s.id === state.id.replace(/^0/,""))
        state.properties.code = foundState.code;
      });

      svg.append("g")
        .selectAll('path')
        .data(stateTopoJSONData)
        .enter()
          .append("path")
          .attr("class", "state")
          .attr("d", path)
          .style("transform", `translate(${PADDING}px, ${(HEIGHT - MAP_HEIGHT) / 2}px) scale(${(WIDTH - PADDING) / 1000})`)
          .style("stroke", "#000")
          .style("stroke-width", "1")
          .style("fill", lightColor)

      d3.selectAll(".state")
        .on("mouseover", function(d) {
          if (!d.clicked) {
            d3.select(this).style("fill", mainColor);
          }
        })
        .on("mouseout", function(d) {
          if (!d.clicked) {
            d3.select(this).style("fill", lightColor);
          }
        })
        .on("click", function(d) {
          if (d.clicked) {
            d3.select(this).style("fill", mainColor);
            // remove state data
          } else {
            let color = __getRandomHex();
            __plotStateData(d.properties.code, color, name);
            d3.select(this).style("fill", color);
          }
          d.clicked = !d.clicked;
        });

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

/**
 * Plot state data for a particular name, given a state abbreviation,
 * color, and name
 *
 * @param {String} abbreviation
 */
function __plotStateData(abbreviation, color, name) {
  
}

/**
 * Return a random hex code
 *
 */
function __getRandomHex() {
  let chars = "0123456789ABCDEF";
  let color = "#"
  for (var i = 0; i < 6; i++) {
    let randIdx = Math.floor(chars.length * Math.random());
    color += chars[randIdx];
  }
  return color;
}

export { capitalize, updateNameList, createChart, createMap };