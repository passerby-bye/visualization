
let selectedCountry = null;
let selectedMedalType = 'Gold_Medal_Count';


const svg_map = d3.select("#map-container")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 600)

    .style("background", "rgb(236, 236, 233)")
    ;


// ceeate projection
const projection = d3.geoMercator()
    .scale(150)
    .translate([630, 350]);

const path = d3.geoPath().projection(projection);


const total_colorScale = d3.scaleThreshold()
    .domain([0, 1, 5, 15, 30, 50, 70])
    .range([
        "#f1f5f9",  // 0
        "#93c5fd",
        "#60a5fa",
        "#3b82f6",
        "#2563eb",
        "#1d4ed8",
        "#1e40af",
        "#1e3a8a"   // maximum

    ]);

const gold_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",  // 0
        "#fff7ed",
        "#FFF9C4",
        "#FFE082",
        "#FFD700",
        "#DAA520",
        "#fb923c",

    ]);

const silver_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",
        "#f8fafc",
        "#e2e8f0",
        "#cbd5e1",
        "#94a3b8",
        "#64748b",
        "#475569",
        "#334155"
    ]);

const bronze_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",
        "#fef2f2",
        "#fee2e2",
        "#fecaca",
        "#fca5a5",
        "#f87171",
        "#ef4444",
        "#dc2626"
    ]);

const medalTypes = {
    'Gold_Medal_Count': {
        name: 'Gold Medals',
        color: 'linear-gradient(145deg, #FFD700, #FFA500)',
        textColor: '#744210'
    },
    'Silver_Medal_Count': {
        name: 'Silver Medals',
        color: 'linear-gradient(145deg, #C0C0C0, #A0A0A0)',
        textColor: '#4A5568'
    },
    'Bronze_Medal_Count': {
        name: 'Bronze Medals',
        color: 'linear-gradient(145deg, #CD7F32, #8B4513)',
        textColor: '#7B341E'
    },
    'Medal_Count': {
        name: 'Total Medals',
        color: 'linear-gradient(145deg, #4682B4, #1E3A8A)',
        textColor: '#2C5282'
    }
};

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


let worldData, medalData;
let years = [];


const loadingDiv = d3.select("body")
    .append("div")
    .attr("class", "loading")
    .text("Loading data...");


function createLegend() {

    const legend = d3.select(".legend")
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("padding", "15px")
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("font-family", "'Inter', sans-serif");



    const medalInfo = medalTypes[selectedMedalType];
    legend.html(`${medalInfo.name} count: `);

    let thresholds, currentColorScale;
    switch (selectedMedalType) {
        case 'Gold_Medal_Count':
            thresholds = [0, 1, 3, 8, 15, 25, 40];
            currentColorScale = gold_colorScale;
            break;
        case 'Silver_Medal_Count':
            thresholds = [0, 1, 3, 8, 15, 25, 40];
            currentColorScale = silver_colorScale;
            break;
        case 'Bronze_Medal_Count':
            thresholds = [0, 1, 3, 8, 15, 25, 40];
            currentColorScale = bronze_colorScale;
            break;
        default:
            thresholds = [0, 1, 5, 15, 30, 50, 70];
            currentColorScale = total_colorScale;
    }
    const zeroDiv = legend.append("div")
        .attr("class", "legend-item");

    zeroDiv.append("div")
        .attr("class", "legend-color")
        .style("background-color", currentColorScale(0));

    zeroDiv.append("span")
        .text("0");


    thresholds.forEach((threshold, i) => {
        if (i > 0 && i < thresholds.length - 1) {
            const div = legend.append("div")
                .attr("class", "legend-item");

            div.append("div")
                .attr("class", "legend-color")
                .style("background-color", currentColorScale(threshold));

            div.append("span")
                .text(`${threshold}-${thresholds[i + 1]}`);
        }
    });


}


function createMedalTypeSelector() {
    const selector = d3.select("#medal-type-select")
        .style("display", "flex")
        .style("gap", "12px")
        .style("margin-bottom", "20px");

    Object.entries(medalTypes).forEach(([value, info]) => {
        const button = selector
            .append("button")
            .attr("class", "medal-type-button")
            .style("padding", "10px 20px")
            .style("border", "none")
            .style("border-radius", "6px")
            .style("font-family", "'Inter', sans-serif")
            .style("font-weight", "500")
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .style("background", info.color)
            .style("color", "white")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .style("opacity", value === selectedMedalType ? 1 : 0.8)
            .text(info.name);

        button.on("mouseover", function () {
            d3.select(this)
                .style("transform", "translateY(-2px)")
                .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
        })
            .on("mouseout", function () {
                d3.select(this)
                    .style("transform", "translateY(0)")
                    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");
            })
            .on("click", () => {
                selectedMedalType = value;
                selector.selectAll(".medal-type-button")
                    .style("opacity", d => d === value ? 1 : 0.8);
                createLegend();
                updateDisplay();
            });
    });
}

function getColor(medals) {
    const count = medals || 0;
    switch (selectedMedalType) {
        case 'Gold_Medal_Count':
            return gold_colorScale(count);
        case 'Silver_Medal_Count':
            return silver_colorScale(count);
        case 'Bronze_Medal_Count':
            return bronze_colorScale(count);
        default:
            return total_colorScale(count);
    }
}

async function loadData() {
    try {

        const [worldGeoJson, medalsData] = await Promise.all([
            d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'),
            d3.csv('data/medal_counts_by_country_and_year.csv', d => ({
                NOC: d.NOC,
                Year: +d.Year,
                Gold_Medal_Count: +d.Gold_Medal_Count,
                Silver_Medal_Count: +d.Silver_Medal_Count,
                Bronze_Medal_Count: +d.Bronze_Medal_Count,
                Medal_Count: +d.Medal_Count
            }))
        ]);

        worldData = worldGeoJson;
        medalData = medalsData;

        years = Array.from(new Set(medalData.map(d => d.Year))).sort();

        const yearSelect = document.getElementById('year-select');
        yearSelect.innerHTML = '';



        yearSelect.textContent = window.selectedYear || years[years.length - 1];
        yearSelect.addEventListener('change', updateDisplay);

        updateDisplay();
        loadingDiv.remove();

    } catch (error) {
        console.error('Error loading data:', error);
        loadingDiv.text('Error loading data. Please refresh the page.');
    }
}


function getMedalData(year) {
    const medals = {};
    medalData
        .filter(d => d.Year === year)
        .forEach(d => {
            medals[d.NOC] = d[selectedMedalType];
        });
    return medals;
}


function updateDisplay() {
    const selectedYear = parseInt(document.getElementById('year-select').textContent);
    const medals = getMedalData(selectedYear);

    svg_map.selectAll("path")
        .data(worldData.features)
        .join("path")
        .attr("d", path)
        .attr("class", "country")
        .transition()
        .duration(300)
        .style("fill", d => {
            const countryCode = d.id;
            const medalCount = medals[countryCode];
            return getColor(medalCount);
        })
        .style("stroke", d => d.id === selectedCountry ? "#000" : "#fff")
        .style("stroke-width", d => d.id === selectedCountry ? "2px" : "0.5px");

    svg_map.selectAll("path")
        .on("mouseover", function (event, d) {
            const countryCode = d.id;
            const medalCount = medals[countryCode] || 0;

            if (countryCode !== selectedCountry) {
                d3.select(this)
                    .style("stroke", "#000")
                    .style("stroke-width", "1.5px");
            }

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`${d.properties.name}: ${medalCount} ${medalTypes[selectedMedalType].name}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (event, d) {

            if (d.id !== selectedCountry) {
                d3.select(this)
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");
            }

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            const countryCode = d.id;


            if (selectedCountry === countryCode) {
                selectedCountry = null;
                svg_map.selectAll("path")
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");
            } else {

                selectedCountry = countryCode;

                svg_map.selectAll("path")
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");


                d3.select(this)
                    .style("stroke", "#000")
                    .style("stroke-width", "2px");
            }
        });
}


createMedalTypeSelector();
createLegend();
loadData();
