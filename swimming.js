const swmargin = {
    top: 30,
    right: 30,
    bottom: 0,
    left: 30
};

const swwidth = 700;
const swheight = 700;
const chartWidth = swwidth - swmargin.left - swmargin.right;
const chartHeight = swheight - swmargin.top - swmargin.bottom;


const swinnerRadius = chartHeight * 0.2;
const swouterRadius = Math.min(chartWidth, chartHeight) * 0.75;


const swsvg = d3.select("#swchart")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight )
    .append("g")
    .attr("transform", `translate(${chartWidth/3},${chartHeight/2})`);


const colors = {
    Gold: "#1E90FF",
    Silver: "#00BFFF",
    Bronze: "#c1e2ed"
};


const swtooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


d3.csv("data/swimming.csv").then(function(data) {

    data.forEach(d => {
        d.Gold = +d.Gold;
        d.Silver = +d.Silver;
        d.Bronze = +d.Bronze;
        d.Total = +d.Total;
    });


    data = data.sort((a, b) => b.Total - a.Total).slice(0, 20);


    const x = d3.scaleBand()
        .domain(data.map(d => d.Name))
        .range([Math.PI/4, Math.PI+Math.PI/4])
        .padding(0.1);

  
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Total)])
        .range([swinnerRadius, swouterRadius]);

 
    const stack = d3.stack()
        .keys([ "Gold","Silver","Bronze" ])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(data);


    const arc = d3.arc()
        .innerRadius(d => y(d[0]))
        .outerRadius(d => y(d[1]))
        .startAngle(d => x(d.data.Name))
        .endAngle(d => x(d.data.Name) + x.bandwidth())
        .padAngle(0.12)
        .padRadius(swinnerRadius)
        .cornerRadius(4);


    swsvg.selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", (d, i) => Object.values(colors)[i])
        .selectAll("path")
        .data(d => d)
        .join("path")
        .attr("d", arc)
        .on("mouseover", function(event, d) {
            const medalType = d3.select(this.parentNode).datum().key;
            const value = d[1] - d[0];
            swtooltip.transition()
                .duration(200)
                .style("opacity", .9);
            swtooltip.html(`${d.data.Name}<br/>${medalType}: ${value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            swtooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });



    const legend = swsvg.append("g")
        .attr("transform", `translate(${0},${50})`);

    const medalTypes = ["Gold", "Silver", "Bronze"];
    const legendItems = legend.selectAll("g")
        .data(medalTypes)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colors[d]);

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(d => d)
        .style("font-size", "12px")
        .style("font-family", "Arial");
});