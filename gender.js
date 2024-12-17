        // 设置画布尺寸
        const genderwidth = 800;
        const genderheight = 800;
        const gendermargin = 60;
        const radius = Math.min(genderwidth, genderheight) / 2 - gendermargin;

        const olympicsData=[]
        loadData()
        function loadData() {
d3.csv('data/gender_sports_age.csv')
    .then(data => {
        // 按年份和性别分组统计
        
        const groupedData = d3.group(data, d => d.Year);
        
        // 处理数据
        const processedData = Array.from(groupedData, ([year, values]) => {
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
        processedData.sort((a, b) => a.year - b.year);
        console.log(processedData)
        return processedData;
    })
    .then(updateVisualization)
    .catch(error => {
        console.error('Error:', error);
        throw error;
    });
}

        function updateVisualization(olympicsData) {
            console.log(olympicsData)
        // 创建SVG容器
        const svg = d3.select("#radial-chart")
            .attr("width", genderwidth)
            .attr("height", genderheight)
            .append("g")
            .attr("transform", `translate(${genderwidth/2},${genderheight/2})`);

        // 创建比例尺
        const angleScale = d3.scaleLinear()
            .domain([0, olympicsData.length])
            .range([0, 2 * Math.PI]);

        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(olympicsData, d => Math.max(d.male, d.female))])
            .range([0, radius]);

        const ratioRadiusScale = d3.scaleLinear()
            .domain([0, 100])
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



        // 绘制男性参与数据
        svg.append("path")
            .datum(olympicsData)
            .attr("fill", "rgba(128, 128, 128, 0.6)")
            .attr("stroke", "rgba(128, 128, 128, 0.8)")
            .attr("stroke-width", 1)
            .attr("d", maleAreaGenerator);

        // 绘制女性参与数据
        svg.append("path")
            .datum(olympicsData)
            .attr("fill", "rgba(255, 182, 193, 1)")
            .attr("stroke", "rgba(255, 182, 193, 1)")
            .attr("stroke-width", 1)
            .attr("d", femaleAreaGenerator);            

        // 绘制比例折线
        svg.append("path")
            .datum(olympicsData)
            .attr("fill", "none")
            .attr("stroke", "#FF1493")
            .attr("stroke-width", 2.5)
            .attr("d", ratioLineGenerator);

        // 添加比例数据点和标签
        svg.selectAll(".ratio-point")
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

        svg.selectAll(".ratio-label")
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
        svg.selectAll(".year-label")
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
        const gridGroup = svg.append("g").attr("class", "grid");

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
            .text(d => d );

        // 添加比例参考线
        const ratioGrids = [25, 50, 75];
        const ratioGridGroup = svg.append("g").attr("class", "ratio-grid");

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
            .text(d => d );}