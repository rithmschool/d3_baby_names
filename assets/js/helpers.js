import * as d3 from "d3";
import d3Tip from "d3-tip";
import * as topojson from "topojson";

d3.tip = d3Tip;

const PADDING = {
  BOTTOM: 60,
  TOP: 20,
  RIGHT: 80,
  LEFT: 80
};

const ANIMATION_DELAY = 1000;
const ANIMATION_STEP = 20;
const colors = {
  male: "#79BFA1",
  female: "#F5A352",
  all: "#8E5DB3"
};

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
  const WIDTH = document.getElementById('graph').parentElement.clientWidth;
  const HEIGHT = 480;

  let svg = d3.select(`#${svgId}`)
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  d3.json("./assets/json/aggregate.json", function(d) {
    let color = colors[gender];
    let nameData = __getDataByName(d, name, gender);
    debugger
    // set up axes and scales
    let xScale = __createScale(
      d3.min(nameData, d => d.year),
      d3.max(nameData, d => d.year),
      PADDING.LEFT,
      WIDTH - PADDING.RIGHT
    );

    let yScale = __createScale(
      d3.min(nameData, __getBirthsPerCapita),
      d3.max(nameData, __getBirthsPerCapita),
      HEIGHT - PADDING.BOTTOM,
      PADDING.TOP
    );
    
    __createPlot(nameData, 'aggregate', gender, name, color, xScale, yScale);

    // create and plot axes
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${HEIGHT - PADDING.BOTTOM})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("")))
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)

    svg.append("text")
      .attr("x", xScale((xScale.domain()[1] + xScale.domain()[0]) / 2))
      .attr("y", HEIGHT - PADDING.BOTTOM / 3)
      .style("text-anchor", "middle")
      .text("Year")
      .style('opacity', 0)
      .transition()
        .duration(1000)
        .style('opacity', 1)
    
    svg.append("g")
      .attr("class","y-axis")
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
      .text(`Babies named ${name} per 100,000 ${gender === 'all' ? '' : gender} births`)
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
  const lightColors = {
    male: "#C6FFEE",
    female: "#FFD685",
    all: "#DAA9FF"
  }

  let lightColor = lightColors[gender]
  let mainColor = colors[gender]
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
          let thisState = d3.select(this);
          let plotExists = d3.select(`.${d.properties.code}.plot`).nodes().length > 0;
          if (d.clicked && plotExists) {
            thisState.style("fill", mainColor);
            __removeStateData(d.properties.code);
            d.clicked = false;
          } else if (!d.clicked && !plotExists) {
            let color = __getRandomHex();
            __plotStateData(d.properties.code, color, name, gender);
            thisState.style("fill", color);
            d.clicked = true;
          }
        });

    });
}
/**
 * Get data for a single name given an object of data and a gender, 
 * suitable for d3. Gender must be "male", "female", or "all."
 * 
 * @param {Object} data
 * @param {String} name
 * @param {String} gender
 */
function __getDataByName(data, name, gender) {
  if (gender !== "female") {
    var maleData = Object.keys(data.maleData).map(year => ({
      year: +year, 
      count: data.maleData[year].names[name] || 0,
      totalBirths: __getBirthCountByYear(data.maleData, year)
    }));
  }
  if (gender !== "male") {
    var femaleData = Object.keys(data.femaleData).map(year => ({
      year: +year, 
      count: data.femaleData[year].names[name] || 0,
      totalBirths: __getBirthCountByYear(data.femaleData, year)
    }));
  } 
  if (gender === "male") return maleData;
  else if (gender === "female") return femaleData;
  
  return maleData.map((d, i) => ({
    year: d.year,
    count: d.count + femaleData[i].count,
    totalBirths: d.totalBirths + femaleData[i].totalBirths
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
 * Create line plot on the graph SVG, given the data,
 * abbreviation, gender, name, color, and scales
 *
 * @param {Object} data
 * @param {String} abbreviation
 * @param {String} gender
 * @param {String} name
 * @param {String} color
 * @param {Function} xScale
 * @param {Function} yScale
 */
function __createPlot(data, abbreviation, gender, name, color, xScale, yScale) {
  
  let tip = d3.tip()
              .attr('class', 'tooltip')
              .html(d => `
                <p>${abbreviation[0].toUpperCase() + abbreviation.slice(1)} Data</p>
                <p>Year: <b class=${gender}>${d.year}</b></p>
                <p>${name} Total: <b class=${gender}>${d3.format(",")(d.count)}</b></p>
                <p>Birth Total: <b class=${gender}>${d3.format(",")(d.totalBirths)}</b></p>
              `);
              
  d3.select("#graph").call(tip);

  // set up axes and scales
  
  let plotGroup = d3.select("#graph").append("g")
                    .attr("class", `${abbreviation} plot`);
  // plot points
  plotGroup.selectAll('line')
    .data(data.slice(1))
    .enter()
      .append('line')
        .attr('x1', (d,i) => xScale(data[i].year))
        .attr('y1', (d,i) => yScale(__getBirthsPerCapita(data[i])))
        .attr('x2', (d,i) => xScale(d.year))
        .attr('y2', (d,i) => yScale(__getBirthsPerCapita(d)))
        .attr('stroke', color)
        .attr('stroke-width', '2px')
        .attr('class', 'segment')
        .style('opacity', 0)
      .transition()
        .delay((d, i) => ANIMATION_DELAY + ANIMATION_STEP * i)
        .duration(ANIMATION_STEP)
        .style('opacity', 1)

  plotGroup.selectAll('circle')
    .data(data)
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
      .delay((d, i) => ANIMATION_DELAY + ANIMATION_STEP * i)
      .duration(ANIMATION_STEP)
      .style('opacity', 1)
}

/**
 * Plot state data for a particular name, given a state abbreviation,
 * color, name, and gender
 *
 * @param {String} abbreviation
 */
function __plotStateData(abbreviation, color, name, gender) {
  const WIDTH = document.getElementById('graph').parentElement.clientWidth;
  const HEIGHT = 480;
  
  let svg = d3.select("#graph");

  d3.json(`./assets/json/${abbreviation}.json`, function(d) {

    let nameData = __getDataByName(d, name, gender);
    let allData = nameData.concat(d3.selectAll("circle").data());
    
    let xScale = __createScale(
      d3.min(nameData, d => d.year),
      d3.max(nameData, d => d.year),
      PADDING.LEFT,
      WIDTH - PADDING.RIGHT
    );

    let yScale = __createScale(
      d3.min(allData, __getBirthsPerCapita),
      d3.max(allData, __getBirthsPerCapita),
      HEIGHT - PADDING.BOTTOM,
      PADDING.TOP
    );

    // update axes
    svg.select(".y-axis")
      .transition(1000)
        .call(d3.axisLeft(yScale))

    // update exisiting lines
    svg.selectAll('.plot').nodes().forEach(function(group) {

      let dGroup = d3.select(group);
      let stateData = dGroup.selectAll('circle').data();

      dGroup.selectAll('.segment')
        .data(stateData.slice(1))
        .transition(1000)
          .attr('y1', (d,i) => yScale(__getBirthsPerCapita(stateData[i])))
          .attr('y2', d => yScale(__getBirthsPerCapita(d)))
      
      dGroup.selectAll('circle')
        .transition(1000)
          .attr('cy', d => yScale(__getBirthsPerCapita(d)))
    });

    // plot new points
    __createPlot(nameData, d.abbreviation, gender, name, color, xScale, yScale);

  });
}

/**
 * Remove state data plot given a state abbreviation
 *
 * @param {String} abbreviation
 */
function __removeStateData(abbreviation) {
  const HEIGHT = 480;

  let stateGroup = d3.select(`.${abbreviation}.plot`);
  let circles = stateGroup.selectAll('circle');
  let lines = stateGroup.selectAll('line');
  let totalLength = 2 * circles.nodes().length - 1;

  [lines, circles].forEach(function(g) {
    g.data([])
    .exit()
    .transition()
      .delay((d,i) => ANIMATION_STEP * (g.nodes().length - 1 - i))
      .duration(ANIMATION_STEP)
      .style('opacity', 0)
    .remove()
    .on('end', function() {
      if (--totalLength === 0) {
        stateGroup.remove();

        let allData = d3.selectAll("circle").data();

        //   // set up axes and scales
        const Y_MIN = d3.min(allData, __getBirthsPerCapita);
        const Y_MAX = d3.max(allData, __getBirthsPerCapita);

        let yScale = d3.scaleLinear()
                      .domain([Y_MIN, Y_MAX])
                      .range([HEIGHT - PADDING.BOTTOM, PADDING.TOP]);

        // update axes
        d3.select(".y-axis")
          .transition(1000)
            .call(d3.axisLeft(yScale))

        // update existing points
        d3.selectAll('.plot').nodes().forEach(function(group) {

          let dGroup = d3.select(group);
          let stateData = dGroup.selectAll('circle').data();

          dGroup.selectAll('.segment')
            .data(stateData.slice(1))
            .transition(1000)
              .attr('y1', (d,i) => yScale(__getBirthsPerCapita(stateData[i])))
              .attr('y2', d => yScale(__getBirthsPerCapita(d)))
          
          dGroup.selectAll('circle')
            .transition(1000)
              .attr('cy', d => yScale(__getBirthsPerCapita(d)))
        });
      }
    });
  });
}

/**
 * Create a d3 linear scale, given the min and max for the domain and range
 *
 * @param {Number} dMin
 * @param {Number} dMax
 * @param {Number} rMin
 * @param {Number} rMax
 */
function __createScale(dMin,dMax,rMin,rMax) {
  return d3.scaleLinear()
          .domain([dMin, dMax])
          .range([rMin, rMax]);
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