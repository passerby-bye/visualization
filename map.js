// // 添加一个变量来跟踪选中的国家
// let selectedCountry = null;

// // 创建SVG
// const svg_map = d3.select("#map-container")
//     .append("svg")
//     .attr("width", 1500)
//     .attr("height", 1000);

// // 创建投影
// const projection = d3.geoMercator()
//     .scale(200)
//     .translate([1500 / 2, 1000 / 1.5]);

// const path = d3.geoPath().projection(projection);

// // 创建颜色比例尺
// const colorScale = d3.scaleThreshold()
//     .domain([0, 1, 5, 15, 30, 50, 70])
//     .range([
//         '#F4F6FF', //  0个金牌
//         '#FFFFD4', //1个金牌
//         '#FED98E', //  1-5个金牌
//         '#FE9929', //  5-15个金牌
//         '#F26722', //  15-30个金牌
//         '#E31A1C', // 30-50个金牌
//         '#BD0026', // 50-70个金牌
//     ]);

// // 创建tooltip
// const tooltip = d3.select("body")
//     .append("div")
//     .attr("class", "tooltip")
//     .style("opacity", 0);

// // 全局变量
// let worldData, athleteData, nocRegions = {};
// let years = [];

// // 国家名称映射
// const countryNameMapping = {
//     'United States': 'USA',
//     'Great Britain': 'United Kingdom',
//     'England': 'United Kingdom',
//     'Ireland': 'United Kingdom',
//     'South Korea': 'Korea, Republic of',
//     'North Korea': "Korea, Democratic People's Republic of",
//     'Czech Republic': 'Czechia',
//     'United States of America': 'USA',
//     'Australia': 'Australia',
//     'Australie': 'Australia',
//     'AUS': 'Australia',
//     'Soviet Union': 'Russia',
//     'USSR': 'Russia',
//     'Russian Olympic Committee': "Russia",
//     'Russian Federation': "Russia",
//     'ROC': 'Russia',
//     'Olympic Athletes from Russia': 'Russia',
//     'German Democratic Republic': 'Germany',
//     'East Germany': 'Germany',
//     'West Germany': 'Germany',
//     'Unified Team': 'Russia',
//     'Republic of China': 'China',
//     'Chinese Taipei': 'Taiwan',
//     'Netherlands Antilles': 'Netherlands',
//     'Bohemia': 'Czech Republic',
//     'Yugoslavia': 'Republic of Serbia',
//     'Serbia and Montenegro': 'Republic of Serbia',
//     'British West Indies': 'United Kingdom',
// };

// // 添加加载提示
// const loadingDiv = d3.select("body")
//     .append("div")
//     .attr("class", "loading")
//     .text("Loading data...");

// // 创建图例
// function createLegend() {
//     const legend = d3.select(".legend");
//     const thresholds = [0, 1, 5, 15, 30, 50, 70];
    
//     legend.html("Medal count: ");
    
//     // 添加0金牌的图例
//     const zeroDiv = legend.append("div")
//         .attr("class", "legend-item");
    
//     zeroDiv.append("div")
//         .attr("class", "legend-color")
//         .style("background-color", colorScale(0));
    
//     zeroDiv.append("span")
//         .text("0");
    
//     // 添加其他金牌数的图例
//     thresholds.forEach((threshold, i) => {
//         if (i > 0 && i < thresholds.length - 1) {
//             const div = legend.append("div")
//                 .attr("class", "legend-item");
            
//             div.append("div")
//                 .attr("class", "legend-color")
//                 .style("background-color", colorScale(threshold));
            
//             div.append("span")
//                 .text(`${threshold}-${thresholds[i+1]}`);
//         }
//     });
    
//     const lastDiv = legend.append("div")
//         .attr("class", "legend-item");
    
//     lastDiv.append("div")
//         .attr("class", "legend-color")
//         .style("background-color", colorScale(100));
    
//     lastDiv.append("span")
//         .text("100+");
// }

// // 颜色计算函数
// function getColor(medals) {
//     return colorScale(medals || 0);
// }

// // 标准化国家名称
// function normalizeCountryName(name) {
//     // 处理为空的情况
//     if (!name) return null;
    
//     // 首先尝试直接映射
//     if (countryNameMapping[name]) {
//         return countryNameMapping[name];
//     }
    
//     // 尝试忽略大小写的映射
//     const lowerName = name.toLowerCase();
//     const mappingKey = Object.keys(countryNameMapping).find(
//         key => key.toLowerCase() === lowerName
//     );
//     if (mappingKey) {
//         return countryNameMapping[mappingKey];
//     }
    
//     // 如果没有映射，返回原始名称
//     return name;
// }

// // 加载数据
// async function loadData() {
//     try {
//         // 加载世界地图数据
//         const worldResponse = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
//         worldData = await worldResponse.json();

//         // 加载NOC映射数据
//         const nocResponse = await fetch('data/noc_regions.csv');
//         const nocText = await nocResponse.text();
        
//         Papa.parse(nocText, {
//             header: true,
//             skipEmptyLines: true,
//             complete: function(results) {
//                 nocRegions = {};
//                 results.data.forEach(row => {
//                     nocRegions[row.NOC] = row.Region;
//                 });
//                 loadAthleteData();
//             }
//         });
//     } catch (error) {
//         console.error('Error loading data:', error);
//         loadingDiv.text('Error loading data. Please refresh the page.');
//     }
// }

// async function loadAthleteData() {
//     try {
//         const athleteResponse = await fetch('data/athlete_events.csv');
//         const athleteText = await athleteResponse.text();
        
//         Papa.parse(athleteText, {
//             header: true,
//             dynamicTyping: true,
//             skipEmptyLines: true,
//             complete: function(results) {
//                 athleteData = results.data;
                
//                 // 只获取夏季奥运会的年份
//                 years = [...new Set(athleteData
//                     .filter(d => d.Season === 'Summer')
//                     .map(d => d.Year))]
//                     .sort();
                
//                 // 使用全局变量中的年份进行过滤
//                 if (window.selectedYear) {
//                     athleteData = athleteData.filter(d => d.Year === parseInt(window.selectedYear));
//                 }
                
//                 const yearSelect = document.getElementById('year-select');
//                 yearSelect.innerHTML = '';
                
//                 years.forEach(year => {
//                     const option = document.createElement('option');
//                     option.value = year;
//                     option.text = year;
//                     yearSelect.appendChild(option);
//                 });
                
//                 yearSelect.value = window.selectedYear || years[years.length - 1];
//                 yearSelect.addEventListener('change', updateDisplay);
                
//                 createLegend();
//                 updateDisplay();
//                 loadingDiv.remove();
//             }
//         });
//     } catch (error) {
//         console.error('Error loading athlete data:', error);
//         loadingDiv.textContent = 'Error loading athlete data. Please refresh the page.';
//     }
// }


// // 计算金牌数据
// function calculateGoldMedals(year) {
//     const medals = {};
//     const processedEvents = new Set(); // 用于跟踪已处理的项目
    
//     athleteData
//         .filter(d => d.Year === year && d.Medal === 'Gold')
//         .forEach(d => {
//             // 创建唯一标识符，避免重复计算团体项目
//             const eventId = `${d.Year}-${d.Sport}-${d.Event}-${d.Team}`;
            
//             // 如果这个项目已经处理过，跳过
//             if (processedEvents.has(eventId)) return;
            
//             const country = normalizeCountryName(d.Team);
//             if (country) {
//                 medals[country] = (medals[country] || 0) + 1;
//                 processedEvents.add(eventId); // 标记该项目已处理
//             }
//         });
    

    
//     return medals;
// }

// // 更新显示
// function updateDisplay() {
//     const selectedYear = parseInt(document.getElementById('year-select').value);
//     const medalData = calculateGoldMedals(selectedYear);

//     // 更新地图颜色和边框
//     svg_map.selectAll("path")
//         .data(worldData.features)
//         .join("path")
//         .attr("d", path)
//         .attr("class", "country")
//         .transition()
//         .duration(300)
//         .style("fill", d => {
//             const countryName = d.properties.name;
//             const normalizedName = normalizeCountryName(countryName);
//             const medals = medalData[normalizedName];
//             return getColor(medals);
//         })
//         .style("stroke", d => d.properties.name === selectedCountry ? "#000" : "#fff")
//         .style("stroke-width", d => d.properties.name === selectedCountry ? "2px" : "0.5px");

//     // 添加交互
//     svg_map.selectAll("path")
//         .on("mouseover", function(event, d) {
//             const countryName = d.properties.name;
//             const normalizedName = normalizeCountryName(countryName);
//             const medals = medalData[normalizedName] || 0;
            
//             // 高亮效果
//             if (countryName !== selectedCountry) {
//                 d3.select(this)
//                     .style("stroke", "#000")
//                     .style("stroke-width", "1.5px");
//             }
            
//             tooltip.transition()
//                 .duration(200)
//                 .style("opacity", .9);
            
//             tooltip.html(`${countryName}: ${medals} gold medals`)
//                 .style("left", (event.pageX + 10) + "px")
//                 .style("top", (event.pageY - 28) + "px");
//         })
//         .on("mouseout", function(event, d) {
//             // 如果不是选中的国家，恢复默认样式
//             if (d.properties.name !== selectedCountry) {
//                 d3.select(this)
//                     .style("stroke", "#fff")
//                     .style("stroke-width", "0.5px");
//             }
            
//             tooltip.transition()
//                 .duration(500)
//                 .style("opacity", 0);
//         })
//         .on("click", function(event, d) {
//             const countryName = d.properties.name;
            
//             // 如果点击已选中的国家，取消选中
//             if (selectedCountry === countryName) {
//                 selectedCountry = null;
//                 svg_map.selectAll("path")
//                     .style("stroke", "#fff")
//                     .style("stroke-width", "0.5px");
//             } else {
//                 // 选中新的国家
//                 selectedCountry = countryName;
                
//                 // 重置所有国家的样式
//                 svg_map.selectAll("path")
//                     .style("stroke", "#fff")
//                     .style("stroke-width", "0.5px");
                
//                 // 设置选中国家的样式
//                 d3.select(this)
//                     .style("stroke", "#000")
//                     .style("stroke-width", "2px");
//             }
//         });
// }

// // 初始加载
// loadData();
// 添加一个变量来跟踪选中的国家
// 添加一个变量来跟踪选中的国家
// 添加一个变量来跟踪选中的国家和奖牌类型
let selectedCountry = null;
let selectedMedalType = 'Gold_Medal_Count'; // 默认显示金牌数量

// 创建SVG
const svg_map = d3.select("#map-container")
    .append("svg")
    .attr("width", 1500)
    .attr("height", 1000);

// 创建投影
const projection = d3.geoMercator()
    .scale(200)
    .translate([1500 / 2, 1000 / 1.5]);

const path = d3.geoPath().projection(projection);

// 创建颜色比例尺
const colorScale = d3.scaleThreshold()
    .domain([0, 1, 5, 15, 30, 50, 70])
    .range([ 
        "#d3cfd9",
        "#d3cfd9",
        "#8ecae6",  // 浅蓝色        
        "#219ebc",  // 孔雀蓝
        "#e9c46a",  // 暖黄色
        "#f4a261",  // 珊瑚橙
        "#e76f51",  // 赤红橙
        "#6d597a"   // 暗紫色

    ]);

// 奖牌类型配置
const medalTypes = {
    'Gold_Medal_Count': { name: 'Gold Medals', color: '#FFD700' },
    'Silver_Medal_Count': { name: 'Silver Medals', color: '#C0C0C0' },
    'Bronze_Medal_Count': { name: 'Bronze Medals', color: '#CD7F32' },
    'Medal_Count': { name: 'Total Medals', color: '#4682B4' }
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
    const legend = d3.select(".legend");
    const thresholds = [0, 1, 5, 15, 30, 50, 70];
    
    // 更新图例标题
    const medalInfo = medalTypes[selectedMedalType];
    legend.html(`${medalInfo.name} count: `);
    
    // 添加0奖牌的图例
    const zeroDiv = legend.append("div")
        .attr("class", "legend-item");
    
    zeroDiv.append("div")
        .attr("class", "legend-color")
        .style("background-color", colorScale(0));
    
    zeroDiv.append("span")
        .text("0");
    
    // 添加其他奖牌数的图例
    thresholds.forEach((threshold, i) => {
        if (i > 0 && i < thresholds.length - 1) {
            const div = legend.append("div")
                .attr("class", "legend-item");
            
            div.append("div")
                .attr("class", "legend-color")
                .style("background-color", colorScale(threshold));
            
            div.append("span")
                .text(`${threshold}-${thresholds[i+1]}`);
        }
    });
    
    const lastDiv = legend.append("div")
        .attr("class", "legend-item");
    
    lastDiv.append("div")
        .attr("class", "legend-color")
        .style("background-color", colorScale(100));
    
    lastDiv.append("span")
        .text("70+");
}

// 创建奖牌类型选择器
function createMedalTypeSelector() {
    const selector = d3.select("#medal-type-select");
    
    Object.entries(medalTypes).forEach(([value, info]) => {
        const option = selector
            .append("button")
            .attr("class", "medal-type-button")
            .text(info.name)
            .style("background-color", info.color)
            .style("opacity", value === selectedMedalType ? 1 : 0.6);
            
        option.on("click", () => {
            selectedMedalType = value;
            // 更新所有按钮的透明度
            selector.selectAll(".medal-type-button")
                .style("opacity", d => d === value ? 1 : 0.6);
            createLegend();
            updateDisplay();
        });
    });
}

// 颜色计算函数
function getColor(medals) {
    return colorScale(medals || 0);
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
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.text = year;
            yearSelect.appendChild(option);
        });
        
        yearSelect.value = window.selectedYear || years[years.length - 1];
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
    const selectedYear = parseInt(document.getElementById('year-select').value);
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