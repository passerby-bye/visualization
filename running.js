d3.csv("data/running.csv").then(function (data) {
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

    const rmargin = { top: 30, right: 100, bottom: 30, left: 150 };
    const rwidth = 900 - rmargin.left - rmargin.right;
    const rheight = 600 - rmargin.top - rmargin.bottom;

    const rsvg = d3.select("#rchart")
        .append("svg")
        .attr("width", rwidth + rmargin.left + rmargin.right)
        .attr("height", rheight + rmargin.top + rmargin.bottom)
        .append("g")
        .attr("transform", `translate(${rmargin.left},${rmargin.top})`);
    const ry = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, rheight])
        .padding(0.3);

    const rx = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([0, rwidth]);

    rsvg.selectAll("rect.track-lane")
        .data(data)
        .join("rect")
        .attr("class", "track-lane")
        .attr("x", 0)
        .attr("y", d => ry(d.name))
        .attr("width", rwidth)
        .attr("height", ry.bandwidth())
        .attr("fill", "#f0f0f0");
    const barGroups = rsvg.selectAll(".bar-group")
        .data(data)
        .join("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0,${ry(d.name)})`);

    barGroups.append("rect")
        .attr("class", "medal gold")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", d => rx(d.gold))
        .attr("height", ry.bandwidth())
        .attr("fill", "#FFD700");

    barGroups.append("rect")
        .attr("class", "medal silver")
        .attr("x", d => rx(d.gold))
        .attr("y", 0)
        .attr("width", d => rx(d.silver))
        .attr("height", ry.bandwidth())
        .attr("fill", "#C0C0C0");

    barGroups.append("rect")
        .attr("class", "medal bronze")
        .attr("x", d => rx(d.gold + d.silver))
        .attr("y", 0)
        .attr("width", d => rx(d.bronze))
        .attr("height", ry.bandwidth())
        .attr("fill", "#CD7F32");


    rsvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(ry))
        .selectAll(".domain, .tick line")
        .remove();


    const rlegend = rsvg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${rwidth + 10}, 0)`);

    const medals = [
        { name: "Gold", color: "#FFD700" },
        { name: "Silver", color: "#C0C0C0" },
        { name: "Bronze", color: "#CD7F32" }
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

    const rtooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    barGroups.on("mouseover", function (event, d) {
        rtooltip.transition()
            .duration(200)
            .style("opacity", .9);
        rtooltip.html(`${d.name}<br/>Gold: ${d.gold}<br/>Silver: ${d.silver}<br/>Bronze: ${d.bronze}<br/>Total: ${d.total}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
        .on("mouseout", function () {
            rtooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}