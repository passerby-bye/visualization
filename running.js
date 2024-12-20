d3.csv("data/running.csv").then(function(data) {
    // 处理并排序数据
    const rprocessedData = data
        .map(d => ({
            name: d.Name,
            total: +d.Total,
            gold: +d.Gold,
            silver: +d.Silver,
            bronze: +d.Bronze
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);
    
    rcreateChart(rprocessedData);
}).catch(error => {
    console.error("Error loading the data:", error);
});

function rcreateChart(data) {
    // 设置图表尺寸和边距
    const rmargin = {top: 30, right: 100, bottom: 30, left: 150};
    const rwidth = 900 - rmargin.left - rmargin.right;
    const rheight = 600 - rmargin.top - rmargin.bottom;
    
    // 创建SVG容器
    const rsvg = d3.select("#rchart")
        .append("svg")
        .attr("width", rwidth + rmargin.left + rmargin.right)
        .attr("height", rheight + rmargin.top + rmargin.bottom)
        .append("g")
        .attr("transform", `translate(${rmargin.left},${rmargin.top})`);
    
    // 创建比例尺
    const ry = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, rheight])
        .padding(0.3);
    
    const rx = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([0, rwidth]);
    
    // 添加赛道背景
    rsvg.selectAll("rect.track-lane")
        .data(data)
        .join("rect")
        .attr("class", "track-lane")
        .attr("x", 0)
        .attr("y", d => ry(d.name))
        .attr("width", rwidth)
        .attr("height", ry.bandwidth())
        .attr("fill", "#f0f0f0");

    // 创建分组来容纳不同类型的奖牌
    const barGroups = rsvg.selectAll(".bar-group")
        .data(data)
        .join("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0,${ry(d.name)})`);

    // 绘制金牌
    barGroups.append("rect")
        .attr("class", "medal gold")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", d => rx(d.gold))
        .attr("height", ry.bandwidth())
        .attr("fill", "#FFD700");

    // 绘制银牌
    barGroups.append("rect")
        .attr("class", "medal silver")
        .attr("x", d => rx(d.gold))
        .attr("y", 0)
        .attr("width", d => rx(d.silver))
        .attr("height", ry.bandwidth())
        .attr("fill", "#C0C0C0");

    // 绘制铜牌
    barGroups.append("rect")
        .attr("class", "medal bronze")
        .attr("x", d => rx(d.gold + d.silver))
        .attr("y", 0)
        .attr("width", d => rx(d.bronze))
        .attr("height", ry.bandwidth())
        .attr("fill", "#CD7F32");

    // 添加运动员姓名标签
    rsvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(ry))
        .selectAll(".domain, .tick line")
        .remove();

    // // 添加总数标签
    // barGroups.append("text")
    //     .attr("x", d => rx(d.total) + 5)
    //     .attr("y", ry.bandwidth() / 2)
    //     .attr("dy", "0.35em")
    //     .text(d => `总数: ${d.total}`)
    //     .attr("fill", "#333");

    // 添加图例
    const rlegend = rsvg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${rwidth + 10}, 0)`);

    const medals = [
        {name: "Gold", color: "#FFD700"},
        {name: "Silver", color: "#C0C0C0"},
        {name: "Bronze", color: "#CD7F32"}
    ];

    rlegend.selectAll("rect")
        .data(medals)
        .join("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => d.color);

    rlegend.selectAll("text")
        .data(medals)
        .join("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 25 + 12)
        .text(d => d.name)
        .attr("fill", "#333");

    // 添加交互提示
    const rtooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    barGroups.on("mouseover", function(event, d) {
        rtooltip.transition()
            .duration(200)
            .style("opacity", .9);
        rtooltip.html(`${d.name}<br/>金牌: ${d.gold}<br/>银牌: ${d.silver}<br/>铜牌: ${d.bronze}<br/>总数: ${d.total}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        rtooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
}