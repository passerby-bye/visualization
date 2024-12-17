// 设置图表尺寸和边距
const margin = { top:100, right: 40, bottom: 60, left: 60 };
const agewidth = 1200 - margin.left - margin.right;
const ageheight = 800 - margin.top - margin.bottom;

// 设置性别分布图的尺寸
const genderWidth = 800;
const genderHeight = 800;
const genderMargin = 60;
const radius = Math.min(genderWidth, genderHeight) / 2 - genderMargin;
const voronoiWidth = 800;
const voronoiHeight = 800;
const voronoiRadius = Math.min(voronoiWidth, voronoiHeight) / 2 - 40;
const voronoiCenter = [voronoiWidth / 2, voronoiHeight / 2];
// 创建年龄分布SVG容器
const agesvg = d3.select("#agechart")
    .append("svg")
    .attr("width", agewidth + margin.left + margin.right)
    .attr("height", ageheight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 创建性别分布SVG容器
const gendersvg = d3.select("#genderchart")
    .append("svg")
    .attr("width", genderWidth)
    .attr("height", genderHeight)
    .append("g")
    .attr("transform", `translate(${genderWidth / 2},${genderHeight / 2})`);
const voronoiSvg = d3.select("#voronoichart")
    .append("svg")
    .attr("width", voronoiWidth)
    .attr("height", voronoiHeight);

// 添加维诺图的提示框
const vtooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none");
function generateCirclePoints(centerX, centerY, radius, numPoints = 100) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        points.push([
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        ]);
    }
    return points;
}
// 先定义固定的颜色范围
const COLOR_RANGE = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
    "#D4A5A5", "#9B59B6", "#3498DB", "#F1C40F", "#E74C3C",
    "#1ABC9C", "#2ECC71", "#E67E22", "#95A5A6", "#34495E",
    "#8E44AD", "#2980B9", "#F39C12", "#D35400", "#C0392B",
    "#16A085", "#27AE60", "#7F8C8D", "#2C3E50", "#8E44AD"
];

// 创建并初始化运动项目颜色映射对象
const sportColorMap = new Map();

// 初始化颜色映射函数
function initializeSportColors(data) {
    // 获取所有唯一的运动项目
    const allSports = [...new Set(data.map(d => d.Sport))].filter(sport => sport); // 过滤掉undefined或null
    console.log('All unique sports:', allSports);

    // 为每个运动项目分配一个固定的颜色
    allSports.forEach((sport, index) => {
        if (sport) { // 确保sport不是undefined或null
            sportColorMap.set(sport, COLOR_RANGE[index % COLOR_RANGE.length]);
        }
    });

    // 打印颜色映射以验证
    console.log('Sport color mapping:', Object.fromEntries(sportColorMap));
}
// 加载数据
Promise.all([
    d3.csv("data/noc_regions.csv"),
    d3.csv("data/gender_sports_age.csv")
]).then(([nocData, rawData]) => {
    // 创建NOC到Region的映射
    const nocToRegion = {};
    nocData.forEach(d => {
        nocToRegion[d.NOC] = d.Region;
    });
    initializeSportColors(rawData);
    const data = rawData;

    // 数据预处理
    data.forEach(d => {
        d.Age = +d.Age;
        d.Year = +d.Year;
    });

    // 获取所有国家列表及其参与人数
    const countryAthletes = d3.rollup(data,
        v => v.length,
        d => d.NOC
    );

    // 过滤掉参与人数太少的国家，并添加地区信息
    const minAthletes = 100;
    const countries = Array.from(countryAthletes)
        .filter(([noc, count]) => count >= minAthletes && nocToRegion[noc])
        .map(([noc, count]) => ({
            noc: noc,
            count: count,
            region: nocToRegion[noc]
        }))
        .sort((a, b) => a.noc.localeCompare(b.noc));

    // 更新国家选择下拉框的函数
    function updateCountrySelect(region) {
        const filteredCountries = region === 'all'
            ? countries
            : countries.filter(c => c.region === region);

        const countrySelect = d3.select("#countrySelect");

        // 更新选项
        const options = countrySelect.selectAll("option")
            .data(filteredCountries, d => d.noc);

        options.exit().remove();

        options.enter()
            .append("option")
            .merge(options)
            .text(d => d.noc)
            .attr("value", d => d.noc);

        // 如果当前选中的国家不在筛选结果中，选择第一个国家
        const currentCountry = countrySelect.property("value");
        if (!filteredCountries.find(c => c.noc === currentCountry)) {
            countrySelect.property("value", filteredCountries[0].noc);
            updateVisualizations(filteredCountries[0].noc);
        }
    }

    // 创建年龄组区间
    const ageGroups = [
        ...d3.range(10, 55, 5).map(age => ({
            min: age,
            max: age + 4,
            label: `${age}-${age + 4}`,
            avgAge: age + 2
        })),
        {
            min: 55,
            max: 100,
            label: "55+",
            avgAge: 60
        }
    ];

    // // 创建颜色比例尺
    // const colorScale = d3.scaleSequential()
    //     .domain([10, 60])
    //     .interpolator(d3.interpolateViridis);
    const colorScale = d3.scaleSequential()
    .domain([10, 60])
    .interpolator(
        d3.piecewise(d3.interpolateHcl, [
            "#ffb4a2",  // 粉橙色
            "#6d597a",   // 暗紫色
            "#06d6a0",  // 青绿
            "#ffd166",  // 黄色
            "#ef476f"   // 粉红
        ])
    );

    function updateAgeChart(selectedCountry, data) {
        // 过滤选中国家的数据
        const countryData = data.filter(d => d.NOC === selectedCountry);

        // 获取该国家参与奥运会的时间范围
        const firstYear = Math.floor(d3.min(countryData, d => d.Year) / 4) * 4;
        const lastYear = Math.ceil(d3.max(countryData, d => d.Year) / 4) * 4;

        // 创建4年间隔的年份数组
        const yearRange = [];
        for (let year = firstYear; year <= lastYear; year += 4) {
            yearRange.push(year);
        }

        // 按年份和年龄组统计人数
        const aggregatedData = [];
        yearRange.forEach(year => {
            const yearData = countryData.filter(d => d.Year === year);
            if (yearData.length > 0) {
                ageGroups.forEach(group => {
                    const count = yearData.filter(d =>
                        group.label === "55+" ?
                            d.Age >= group.min :
                            (d.Age >= group.min && d.Age <= group.max)
                    ).length;
                    if (count > 0) {
                        aggregatedData.push({
                            year: year,
                            ageGroup: group.label,
                            avgAge: group.avgAge,
                            count: count
                        });
                    }
                });
            }
        });

        // 设置比例尺
        const xScale = d3.scalePoint()
            .domain(ageGroups.map(d => d.label))
            .range([0, width])
            .padding(0.5);

        const yScale = d3.scaleLinear()
            .domain([firstYear, lastYear])
            .range([ageheight, 0]);

        // 使用平方根比例尺来设置圆点大小
        const maxCount = d3.max(aggregatedData, d => d.count);
        const radiusScale = d3.scaleSqrt()
            .domain([1, maxCount])
            .range([3, 25])
            .clamp(true);

        // 清除现有的图形
        agesvg.selectAll("*").remove();

        // [年龄分布图的其余绘制代码保持不变...]
        // 添加颜色图例（水平布局）
        const legendHeight = 15;
        const legendWidth = 200;
        const legendScale = d3.scaleLinear()
            .domain([10, 60])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .tickFormat(d => d === 60 ? "55+" : d)
            .ticks(6);

        const legend = agesvg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, -40)`);

        // 创建渐变色图例
        const defs = agesvg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // 添加渐变色停止点
        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(10 + d * 50));

        // 绘制图例矩形
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        // 添加图例轴
        legend.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "11px")
            .style("font-weight", "400");

        // 添加"岁"字的标签
        legend.append("text")
            .attr("x", legendWidth + 15)
            .attr("y", legendHeight + 5)
            .style("font-size", "11px")
            .style("alignment-baseline", "middle")
            .text("years");

        // 添加图例标题
        legend.append("text")
            .attr("x", -5)
            .attr("y", -5)
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .text("Age");

        // 添加/更新网格线（带动画）
        // 水平网格线
        const yGridLines = agesvg.selectAll(".y-grid")
            .data(yearRange);

        yGridLines.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        const yGridEnter = yGridLines.enter()
            .append("line")
            .attr("class", "grid y-grid")
            .style("opacity", 0)
            .attr("x1", 0)
            .attr("x2", width);

        yGridLines.merge(yGridEnter)
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d));

        // 垂直网格线
        const xGridLines = agesvg.selectAll(".x-grid")
            .data(ageGroups.map(d => d.label));

        xGridLines.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        const xGridEnter = xGridLines.enter()
            .append("line")
            .attr("class", "grid x-grid")
            .style("opacity", 0)
            .attr("y1", 0)
            .attr("y2", ageheight);

        xGridLines.merge(xGridEnter)
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d))
            .attr("y1", 0)
            .attr("y2", ageheight);

        // 添加坐标轴（带动画）
        // X轴
        const xAxis = d3.axisBottom(xScale);
        const xAxisGroup = agesvg.selectAll(".x-axis")
            .data([null]);

        const xAxisEnter = xAxisGroup.enter()
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${ageheight})`);

        xAxisGroup.merge(xAxisEnter)
            .transition()
            .duration(1000)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y轴
        const yAxis = d3.axisLeft(yScale)
            .tickValues(yearRange)
            .tickFormat(d3.format("d"));

        const yAxisGroup = agesvg.selectAll(".y-axis")
            .data([null]);

        const yAxisEnter = yAxisGroup.enter()
            .append("g")
            .attr("class", "axis y-axis");

        yAxisGroup.merge(yAxisEnter)
            .transition()
            .duration(1000)
            .call(yAxis);

        // 添加/更新圆点（带动画）
        const dots = agesvg.selectAll(".dot")
            .data(aggregatedData, d => `${d.year}-${d.ageGroup}`);

        dots.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        const dotsEnter = dots.enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.ageGroup))
            .attr("cy", d => yScale(d.year))
            .attr("r", 0)
            .style("opacity", 0)
            .style("fill", d => colorScale(d.avgAge));

        dots.merge(dotsEnter)
            .transition()
            .duration(1000)
            .style("opacity", 0.8)
            .attr("cx", d => xScale(d.ageGroup))
            .attr("cy", d => yScale(d.year))
            .attr("r", d => radiusScale(d.count))
            .style("fill", d => colorScale(d.avgAge));

        dots.merge(dotsEnter)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.8);
            })
            .append("title")
            .text(d => `Year: ${d.year}\nAge: ${d.ageGroup}\nAthletes: ${d.count}`);

        // 添加标题
        agesvg.append("text")
            .attr("class", "title")
            .attr("x", agewidth / 2)
            .attr("y", -margin.top )
            .text(`Age Distribution of Summer Olympic Athletes - ${selectedCountry}`);

        // 添加坐标轴标签
        agesvg.append("text")
            .attr("class", "axis-label")
            .attr("x", agewidth / 2)
            .attr("y", ageheight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Age Groups");

        agesvg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -ageheight / 2)
            .attr("y", -margin.left + 20)
            .style("text-anchor", "middle")
            .text("Olympic Years");

    }

    function updateGenderChart(selectedCountry, data) {
        const gtooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.9)")
    .style("padding", "8px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none");
        // 过滤选中国家的数据
        const countryData = data.filter(d => d.NOC === selectedCountry);

        // 按年份和性别分组统计
        const groupedData = d3.group(countryData, d => d.Year);

        // 处理数据
        const olympicsData = Array.from(groupedData, ([year, values]) => {
            const genderCounts = d3.group(values, d => d.Sex);
            const maleCount = genderCounts.get('M')?.length || 0;
            const femaleCount = genderCounts.get('F')?.length || 0;

            return {
                year: +year,
                male: maleCount,
                female: femaleCount,
                ratio: femaleCount / maleCount * 100
            };
        });

        // 按年份排序
        olympicsData.sort((a, b) => a.year - b.year);

        // 清除现有的可视化
        gendersvg.selectAll("*").remove();

        // 创建比例尺
        const angleScale = d3.scaleLinear()
            .domain([0, olympicsData.length])
            .range([0, 2 * Math.PI]);

        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(olympicsData, d => Math.max(d.male, d.female))])
            .range([0, radius]);

        const ratioRadiusScale = d3.scaleLinear()
            .domain([0, 200])
            .range([radius * 0.2, radius * 0.9]);
        // 创建径向面积生成器（女性）
        const femaleAreaGenerator = d3.areaRadial()
            .angle((d, i) => angleScale(i))
            .innerRadius(0)
            .outerRadius(d => radiusScale(d.female))
            .curve(d3.curveCardinalClosed.tension(0.7));

        // 创建径向面积生成器（男性）
        const maleAreaGenerator = d3.areaRadial()
            .angle((d, i) => angleScale(i))
            .innerRadius(0)
            .outerRadius(d => radiusScale(d.male))
            .curve(d3.curveCardinalClosed.tension(0.7));

        // 创建径向线生成器（比例）
        const ratioLineGenerator = d3.lineRadial()
            .angle((d, i) => angleScale(i))
            .radius(d => ratioRadiusScale(d.ratio))
            .curve(d3.curveCardinalClosed.tension(0.7));



        // // 绘制男性参与数据
        // gendersvg.append("path")
        //     .datum(olympicsData)
        //     .attr("fill", "rgba(128, 128, 128, 0.6)")
        //     .attr("stroke", "rgba(128, 128, 128, 0.8)")
        //     .attr("stroke-width", 1)
        //     .attr("d", maleAreaGenerator);

        // // 绘制女性参与数据
        // gendersvg.append("path")
        //     .datum(olympicsData)
        //     .attr("fill", "rgba(255, 182, 193, 0.6)")
        //     .attr("stroke", "rgba(255, 182, 193, 0.8)")
        //     .attr("stroke-width", 1)
        //     .attr("d", femaleAreaGenerator);
        gendersvg.append("path")
        .datum(olympicsData)
        .attr("fill", "rgba(255, 182, 193, 0.6)")
        .attr("stroke", "rgba(255, 182, 193, 0.8)")
        .attr("stroke-width", 1)
        .attr("d", femaleAreaGenerator)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
        })
        .on("mousemove", function(event, d) {
            const [mouseX, mouseY] = d3.pointer(event);
            const angle = Math.atan2(mouseY, mouseX) + Math.PI / 2;
            const index = Math.floor((angle + Math.PI * 2) % (Math.PI * 2) / (2 * Math.PI / olympicsData.length));
            const data = olympicsData[index];
            
            gtooltip.html(`Year: ${data.year}<br/>
                         Female count: ${data.female}<br/>
                         Male count: ${data.male}<br/>
                         Female/Male: ${data.ratio.toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(d) {
            gtooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // 修改男性数据区域，添加交互
    gendersvg.append("path")
        .datum(olympicsData)
        .attr("fill", "rgba(128, 128, 128, 0.6)")
        .attr("stroke", "rgba(128, 128, 128, 0.8)")
        .attr("stroke-width", 1)
        .attr("d", maleAreaGenerator)
        .on("mouseover", function(event, d) {
            gtooltip.transition()
                .duration(200)
                .style("opacity", .9);
        })
        .on("mousemove", function(event, d) {
            const [mouseX, mouseY] = d3.pointer(event);
            const angle = Math.atan2(mouseY, mouseX) + Math.PI / 2;
            const index = Math.floor((angle + Math.PI * 2) % (Math.PI * 2) / (2 * Math.PI / olympicsData.length));
            const data = olympicsData[index];
            
            gtooltip.html(`Year: ${data.year}<br/>
                Female count: ${data.female}<br/>
                Male count: ${data.male}<br/>
                Female/Male: ${data.ratio.toFixed(2)}%`)
       .style("left", (event.pageX + 10) + "px")
       .style("top", (event.pageY - 10) + "px");
})
        .on("mouseout", function(d) {
            gtooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
        // 绘制比例折线
        gendersvg.append("path")
            .datum(olympicsData)
            .attr("fill", "none")
            .attr("stroke", "#FF1493")
            .attr("stroke-width", 2.5)
            .attr("d", ratioLineGenerator);

        // 添加比例数据点和标签
        gendersvg.selectAll(".ratio-point")
            .data(olympicsData)
            .enter()
            .append("circle")
            .attr("class", "ratio-point")
            .attr("r", 3)
            .attr("fill", "#FF1493")
            .attr("transform", (d, i) => {
                const angle = angleScale(i) - Math.PI / 2;
                const r = ratioRadiusScale(d.ratio);
                return `translate(${r * Math.cos(angle)},${r * Math.sin(angle)})`;
            });

        gendersvg.selectAll(".ratio-label")
            .data(olympicsData)
            .enter()
            .append("text")
            .attr("class", "ratio-label")
            .attr("transform", (d, i) => {
                const angle = angleScale(i) - Math.PI / 2;
                const r = ratioRadiusScale(d.ratio);
                return `translate(${r * Math.cos(angle)},${r * Math.sin(angle)})`;
            })
            .attr("dx", 5)
            .attr("dy", -5)
            .style("font-size", "10px")
            .style("fill", "#FF1493")
            .text(d => `${d.ratio.toFixed(2)}`);

        // 添加年份标签
        gendersvg.selectAll(".year-label")
            .data(olympicsData)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", (d, i) => (radius + 30) * Math.cos(angleScale(i) - Math.PI / 2))
            .attr("y", (d, i) => (radius + 30) * Math.sin(angleScale(i) - Math.PI / 2))
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .style("font-size", "12px")
            .text(d => d.year);


        // 添加同心圆网格和数值标签
        const gridCircles = [2000, 4000, 6000];
        const gridGroup = gendersvg.append("g").attr("class", "grid");

        gridGroup.selectAll(".grid-circle")
            .data(gridCircles)
            .enter()
            .append("circle")
            .attr("class", "grid-circle")
            .attr("r", d => radiusScale(d))
            .attr("fill", "none")
            .attr("stroke", "#ddd")
            .attr("stroke-dasharray", "2,2");

        gridGroup.selectAll(".grid-label")
            .data(gridCircles)
            .enter()
            .append("text")
            .attr("class", "grid-label")
            .attr("y", d => -radiusScale(d))
            .attr("x", 5)
            .style("font-size", "10px")
            .style("fill", "#666")
            .text(d => d);

        // 添加比例参考线
        const ratioGrids = [25, 50, 75, 150];
        const ratioGridGroup = gendersvg.append("g").attr("class", "ratio-grid");

        ratioGridGroup.selectAll(".ratio-grid-circle")
            .data(ratioGrids)
            .enter()
            .append("circle")
            .attr("class", "ratio-grid-circle")
            .attr("r", d => ratioRadiusScale(d))
            .attr("fill", "none")
            .attr("stroke", "#FFB6C1")
            .attr("stroke-dasharray", "2,2")
            .style("opacity", 0.5);

        ratioGridGroup.selectAll(".ratio-grid-label")
            .data(ratioGrids)
            .enter()
            .append("text")
            .attr("class", "ratio-grid-label")
            .attr("y", d => -ratioRadiusScale(d))
            .attr("x", 5)
            .style("font-size", "10px")
            .style("fill", "#FF69B4")
            .text(d => d);
    }

    function updateVoronoiChart(selectedCountry, data, selectedYear) {
        // 清除之前的可视化
        voronoiSvg.selectAll("*").remove();

        // // 过滤选中国家的数据
        // const countryData = data.filter(d => d.NOC === selectedCountry);
        const countryData = data.filter(d => d.NOC === selectedCountry && d.Year === selectedYear);

        // 统计不同项目的数量
        const disciplineCounts = d3.rollup(countryData,
            v => v.length,
            d => d.Sport
        );
        console.log(disciplineCounts)

        // 转换为可视化数据格式
        const visualData = Array.from(disciplineCounts, ([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value)
            .slice(0, 10); // 只取前10个项目
        console.log(visualData)
        // 绘制圆形边界
        voronoiSvg.append("circle")
            .attr("class", "boundary")
            .attr("cx", voronoiCenter[0])
            .attr("cy", voronoiCenter[1])
            .attr("r", voronoiRadius)
            .style("fill", "none")
            .style("stroke", "#ccc");

        // 创建权重和颜色比例尺
        const maxValue = d3.max(visualData, d => d.value);
        const weightScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, 1]);

        const colorScale = d3.scaleOrdinal()
            .domain(visualData.map(d => d.name))
            .range(d3.schemeSet3);

        // 创建单元格路径生成器
        const cellLiner = d3.line()
            .x(d => d[0])
            .y(d => d[1]);

        // 创建圆形裁剪区域的点
        const clipPoints = generateCirclePoints(
            voronoiCenter[0],
            voronoiCenter[1],
            voronoiRadius
        );

        // 创建voronoi map模拟器
        const simulation = d3.voronoiMapSimulation(visualData)
            .weight(d => weightScale(d.value))
            .clip(clipPoints)
            .initialPosition((d, i) => {
                const angle = Math.random() * 2 * Math.PI;
                const r = Math.random() * voronoiRadius * 0.8;
                return [
                    voronoiCenter[0] + r * Math.cos(angle),
                    voronoiCenter[1] + r * Math.sin(angle)
                ];
            })
            .on("tick", ticked);

        function ticked() {
            const state = simulation.state();
            const polygons = state.polygons;
            console.log(polygons)

            const cellGroups = voronoiSvg.selectAll('g.cell-group')
                .data(polygons);

            // 创建新的组
            const enterGroups = cellGroups.enter()
                .append('g')
                .attr('class', 'cell-group');

            // 添加路径
            enterGroups.append('path')
                .attr('class', 'cell')
                .merge(cellGroups.select('path'))
                .attr('d', d => cellLiner(d) + 'z')
                .style('fill', d => {
                    const sportName = d.site.originalObject.data.originalData.name;
                    return sportColorMap.get(sportName) || '#ccc';
                })
                .style('opacity', 0.6)
                .style('stroke', '#fff')
                .style('transition', 'opacity 0.3s')
                .on('mouseover', function (event, d) {
                    d3.selectAll('.cell-group').style('opacity', 0.3);
                    d3.select(this.parentNode).style('opacity', 1);
                    vtooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    vtooltip.html(`Sport:${d.site.originalObject.data.originalData.name}<br/>Count: ${d.site.originalObject.data.originalData.value}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on('mouseout', function () {
                    d3.selectAll('.cell-group').style('opacity', 1);
                    vtooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // 添加文本标签
            enterGroups.append('text')
                .attr('class', 'cell-label')
                .merge(cellGroups.select('text'))
                .each(function (d) {
                    // 计算多边形的中心点
                    const polygon = d;
                    const centroid = d3.polygonCentroid(polygon);

                    // 获取运动项目名称和数量
                    const sportName = d.site.originalObject.data.originalData.name;
                    const count = d.site.originalObject.data.originalData.value;

                    // 设置文本位置和内容
                    d3.select(this)
                        .attr('x', centroid[0])
                        .attr('y', centroid[1])
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .style('font-size', '12px')
                        .style('font-weight', 'bold')
                        .style('fill', '#000')
                        .style('pointer-events', 'none')
                        .html(`${sportName}<br/>(${count})`);
                });

            // 移除旧的组
            cellGroups.exit().remove();
            // 添加标题
            // voronoiSvg.append("text")
            //     .attr("class", "title")
            //     .attr("x", voronoiWidth / 2)
            //     .attr("y", 30)
            //     .attr("text-anchor", "middle")
            //     .style("font-size", "16px")
            //     .text(`Sports Distribution - ${selectedCountry}`);
        }
    }
    function initializeYearSlider(selectedCountry, data) {
        // 过滤选中国家的数据
        const countryData = data.filter(d => d.NOC === selectedCountry);

        // 获取该国家参与的所有年份，并排序
        const years = [...new Set(countryData.map(d => d.Year))].sort();

        // 获取年份选择器元素
        const yearSelector = document.getElementById('yearSelector');
        const yearDisplay = document.getElementById('yearDisplay');
        const yearList = document.getElementById('yearList');

        // 清空并重新填充datalist选项
        yearList.innerHTML = '';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            yearList.appendChild(option);
        });

        // 设置初始值为最早的年份
        yearSelector.value = years[0];
        yearSelector.min = years[0];
        yearSelector.max = years[years.length - 1];
        yearDisplay.textContent = years[0];

        // 添加输入事件监听
        yearSelector.oninput = function () {
            const selectedValue = parseInt(this.value);
            // 找到最接近的有效年份
            const closestYear = years.reduce((prev, curr) => {
                return Math.abs(curr - selectedValue) < Math.abs(prev - selectedValue) ? curr : prev;
            });

            this.value = closestYear;
            yearDisplay.textContent = closestYear;
            updateVoronoiChart(selectedCountry, data, closestYear);
        };

        return parseInt(yearSelector.value);
    }
    // 更新两个可视化的总函数
    function updateVisualizations(selectedCountry) {
        updateAgeChart(selectedCountry, data);
        updateGenderChart(selectedCountry, data);
        const initialYear = initializeYearSlider(selectedCountry, data);
        updateVoronoiChart(selectedCountry, data, initialYear);
    }

    const initialYear = initializeYearSlider(countries[0], data);

    // // 监听国家选择变化
    // d3.select("#countrySelect")
    //     .on("change", function () {
            
    //     });
    //     // 获取当前选中的 NOC 代码
// const currentCode = window.getSelectedCountryCode();

// 监听选择改变事件
window.addEventListener('countrySelected', (event) => {
    const { country, code } = event.detail;
    console.log(`Selected country: ${country}, NOC code: ${code}`);
    updateVisualizations(code);
});




    updateVisualizations('CHN');
});