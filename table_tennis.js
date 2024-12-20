d3.csv("data/table_tennis.csv").then(function(data) {
    const processedData = data
        .map(d => ({
            name: d.Name,
            total: +d.Total,
            gold: +d.Gold,
            silver: +d.Silver,
            bronze: +d.Bronze
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);
    
    createTableChart(processedData);
}).catch(error => {
    console.error("Error loading table tennis data:", error);
});

function createTableChart(data) {
    // 设置图表尺寸
    const container = document.getElementById('tablehart');
    const twidth = container.clientWidth;
    const theight = container.clientHeight;

    // 创建SVG
    const tsvg = d3.select("#tablehart")
        .append("svg")
        .attr("width", twidth)
        .attr("height", theight);

    // 创建气泡大小的比例尺
    const tradiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.total)])
        .range([10, 50]);

    // 创建颜色比例尺
    const tcolorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range(["#fff", "#ffa500"]);

    // 创建力导向模拟
    const tsimulation = d3.forceSimulation(data)
        .force("x", d3.forceX(twidth / 2).strength(0.02))
        .force("y", d3.forceY(theight / 2).strength(0.02))
        .force("collide", d3.forceCollide(d => tradiusScale(d.total) + 10).strength(1))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("radial", d3.forceRadial(Math.min(twidth, theight) / 3, twidth / 2, theight / 2).strength(0.1));

    // 创建tooltip
    const ttooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 创建节点组
    const tnodes = tsvg.selectAll(".node")
        .data(data)
        .join("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // 添加气泡
    tnodes.append("circle")
        .attr("r", d => tradiusScale(d.total))
        .attr("fill", d => tcolorScale(d.total))
        .attr("opacity", 0.7)
        .on("mouseover", function(event, d) {
            ttooltip.transition()
                .duration(200)
                .style("opacity", .9);
            ttooltip.html(`${d.name}<br/>总奖牌: ${d.total}<br/>
                金牌: ${d.gold}<br/>
                银牌: ${d.silver}<br/>
                铜牌: ${d.bronze}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            ttooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // 添加文本标签
    tnodes.append("text")
        .attr("class", "athlete-name")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .text(d => d.name)
        .style("font-size", d => Math.min(tradiusScale(d.total) * 0.4, 12) + "px");

    // 更新节点位置
    tsimulation.on("tick", () => {
        tnodes.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // 拖拽函数
    function dragstarted(event) {
        if (!event.active) tsimulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) tsimulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // 添加图例
    const tlegendData = [
        {value: d3.min(data, d => d.total), label: "Minimum"},
        {value: d3.max(data, d => d.total), label: "Maximum"}
    ];

    const tlegend = tsvg.append("g")
        .attr("transform", `translate(${twidth - 150}, 20)`);

    const tlegendItems = tlegend.selectAll("g")
        .data(tlegendData)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 50})`);

    tlegendItems.append("circle")
        .attr("r", d => tradiusScale(d.value))
        .attr("fill", d => tcolorScale(d.value))
        .attr("opacity", 0.7);

    tlegendItems.append("text")
        .attr("x", 60)
        .attr("y", 5)
        .text(d => `${d.label}: ${d.value}`)
        .style("font-size", "12px");
}