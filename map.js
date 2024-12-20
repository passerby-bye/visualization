
let selectedCountry = null;
let selectedMedalType = 'Gold_Medal_Count'; // 默认显示金牌数量

// 创建SVG
const svg_map = d3.select("#map-container")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 600)
    // .style("background", "linear-gradient(to bottom, #f8f9fa,rgb(241, 241, 241))");
    .style("background", "rgb(236, 236, 233)")
    ;


// 创建投影
const projection = d3.geoMercator()
    .scale(150)
    .translate([630,350]);

const path = d3.geoPath().projection(projection);

// 创建颜色比例尺
const total_colorScale = d3.scaleThreshold()
    .domain([0, 1, 5, 15, 30, 50, 70])
    .range([ 
        "#f1f5f9",  // 无奖牌颜色
        "#93c5fd",  // 极少奖牌
        "#60a5fa",  // 少量奖牌
        "#3b82f6",  // 中等奖牌
        "#2563eb",  // 较多奖牌
        "#1d4ed8",  // 很多奖牌
        "#1e40af",  // 大量奖牌
        "#1e3a8a"   // 最多奖牌

    ]);
// 定义不同奖牌类型的颜色比例尺
const gold_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",  // 无奖牌
        "#fff7ed",
        "#FFF9C4",  // 无奖牌
        "#FFE082",  // 极少金牌
        "#FFD700",  // 少量金牌
        "#DAA520",  // 中等金牌
        "#fb923c",

    ]);

const silver_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",  // 无奖牌
        "#f8fafc",  // 极少银牌
        "#e2e8f0",  // 少量银牌
        "#cbd5e1",  // 中等银牌
        "#94a3b8",  // 较多银牌
        "#64748b",  // 很多银牌
        "#475569",  // 大量银牌
        "#334155"   // 最多银牌
    ]);

const bronze_colorScale = d3.scaleThreshold()
    .domain([0, 1, 3, 8, 15, 25, 40])
    .range([
        "#f1f5f9",  // 无奖牌
        "#fef2f2",  // 极少铜牌
        "#fee2e2",  // 少量铜牌
        "#fecaca",  // 中等铜牌
        "#fca5a5",  // 较多铜牌
        "#f87171",  // 很多铜牌
        "#ef4444",  // 大量铜牌
        "#dc2626"   // 最多铜牌
    ]);
// 奖牌类型配置
// const medalTypes = {
//     'Gold_Medal_Count': { name: 'Gold Medals', color: '#FFD700' },
//     'Silver_Medal_Count': { name: 'Silver Medals', color: '#C0C0C0' },
//     'Bronze_Medal_Count': { name: 'Bronze Medals', color: '#CD7F32' },
//     'Medal_Count': { name: 'Total Medals', color: '#4682B4' }
// };
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
// 创建tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// 全局变量
let worldData, medalData;
let years = [];

// 添加加载提示
const loadingDiv = d3.select("body")
    .append("div")
    .attr("class", "loading")
    .text("Loading data...");

// 创建图例
function createLegend() {
    // const legend = d3.select(".legend");
    const legend = d3.select(".legend")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("padding", "15px")
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    .style("font-family", "'Inter', sans-serif");
    // const thresholds = [0, 1, 5, 15, 30, 50, 70];
    
    // // 更新图例标题
    const medalInfo = medalTypes[selectedMedalType];
    legend.html(`${medalInfo.name} count: `);
    // const medalInfo = medalTypes[selectedMedalType];
    // legend.html(`
    //     <div  style="font-weight: 600; margin-bottom: 10px; color: ${medalInfo.textColor}">
    //         ${medalInfo.name} count
    //     </div>
    // `);
    // 添加0奖牌的图例
    let thresholds, currentColorScale;
    switch(selectedMedalType) {
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
    
    // 添加其他奖牌数的图例
    thresholds.forEach((threshold, i) => {
        if (i > 0 && i < thresholds.length - 1) {
            const div = legend.append("div")
                .attr("class", "legend-item");
            
            div.append("div")
                .attr("class", "legend-color")
                .style("background-color", currentColorScale(threshold));
            
            div.append("span")
                .text(`${threshold}-${thresholds[i+1]}`);
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
            
        button.on("mouseover", function() {
            d3.select(this)
                .style("transform", "translateY(-2px)")
                .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
        })
        .on("mouseout", function() {
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
// 颜色计算函数
// function getColor(medals) {
//     return colorScale(medals || 0);
// }
function getColor(medals) {
    const count = medals || 0;
    switch(selectedMedalType) {
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
// 加载数据
async function loadData() {
    try {
        // 并行加载世界地图数据和奖牌数据
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
        
        // 获取所有年份
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

// 获取指定年份的奖牌数据
function getMedalData(year) {
    const medals = {};
    medalData
        .filter(d => d.Year === year)
        .forEach(d => {
            medals[d.NOC] = d[selectedMedalType];
        });
    return medals;
}

// 更新显示
function updateDisplay() {
    const selectedYear = parseInt(document.getElementById('year-select').textContent);
    const medals = getMedalData(selectedYear);

    // 更新地图颜色和边框
    svg_map.selectAll("path")
        .data(worldData.features)
        .join("path")
        .attr("d", path)
        .attr("class", "country")
        .transition()
        .duration(300)
        .style("fill", d => {
            const countryCode = d.id;  // GeoJSON通常使用ISO3代码作为id
            const medalCount = medals[countryCode];
            return getColor(medalCount);
        })
        .style("stroke", d => d.id === selectedCountry ? "#000" : "#fff")
        .style("stroke-width", d => d.id === selectedCountry ? "2px" : "0.5px");

    // 添加交互
    svg_map.selectAll("path")
        .on("mouseover", function(event, d) {
            const countryCode = d.id;
            const medalCount = medals[countryCode] || 0;
            
            // 高亮效果
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
        .on("mouseout", function(event, d) {
            // 如果不是选中的国家，恢复默认样式
            if (d.id !== selectedCountry) {
                d3.select(this)
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");
            }
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event, d) {
            const countryCode = d.id;
            
            // 如果点击已选中的国家，取消选中
            if (selectedCountry === countryCode) {
                selectedCountry = null;
                svg_map.selectAll("path")
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");
            } else {
                // 选中新的国家
                selectedCountry = countryCode;
                
                // 重置所有国家的样式
                svg_map.selectAll("path")
                    .style("stroke", "#fff")
                    .style("stroke-width", "0.5px");
                
                // 设置选中国家的样式
                d3.select(this)
                    .style("stroke", "#000")
                    .style("stroke-width", "2px");
            }
        });
}

// 初始加载
createMedalTypeSelector();
createLegend();
loadData();
