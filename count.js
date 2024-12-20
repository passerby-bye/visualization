const width = 1900;
const height = width / 2 + 100;
const innerRadius = 200;
const outerRadius = 400;


const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "width: 100%; height: auto; font: 14px 'Helvetica Neue', sans-serif;"); // 改进字体

const defs = svg.append("defs");
const gradient = defs.append("radialGradient")
    .attr("id", "background-gradient")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "10%");

gradient.append("stop")
    .attr("offset", "0%")
    .attr("style", "stop-color: #ECECE9; stop-opacity: 1");
gradient.append("stop")
    .attr("offset", "100%")
    .attr("style", "stop-color: #ECECE9; stop-opacity: 1");


svg.append("circle")
    .attr("r", outerRadius + 100)
    .attr("stroke", "#000")
    .attr("stroke-width", "2px")
    .attr("fill", "url(#background-gradient)");

async function loadData() {
    try {
        const data = await d3.csv('data/continent_count.csv', d => ({
            year: d.year,
            name: d.name,
            population: +d.population
        }));

        const allnames = data.map(d => d.name);

        const series = d3.stack()
            .keys(d3.union(data.map(d => d.name)))
            .value(([, D], key) => D.get(key).population)
            (d3.index(data, d => d.year, d => d.name));

        const arc = d3.arc()
            .innerRadius(d => y(d[0]))
            .outerRadius(d => y(d[1]))
            .startAngle(d => x(d.data[0]))
            .endAngle(d => x(d.data[0]) + x.bandwidth())
            .padAngle(2 / innerRadius)
            .padRadius(innerRadius);


        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, 2 * Math.PI])
            .align(0)
            .padding(0.1);

        const y = d3.scaleRadial()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .range([innerRadius, outerRadius]);

        const uniqueKeys = Array.from(new Set(data.map(d => d.name)));


        const color = d3.scaleOrdinal()
            .domain(uniqueKeys)
            .range([
                "#2E4057",
                "#048BA8",
                "#16DB93",
                "#EFEA5A",
                "#F29E4C",
                "#F25C54",
                "#A06CD5",
                "#6247AA",
                "#102542",
                "#dc2626"
            ])
            .unknown("#ddd");

        const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")
        const regions = [...new Set(data.map(d => d.name))];

        const radiusScale = d3.scaleOrdinal()
            .domain(regions)
            .range(d3.range(regions.length).map(i =>
                100 + y.range()[1] * (0.35 + (i * 0.08))
            ));


        const shadow = defs.append("filter")
            .attr("id", "shadow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");

        shadow.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3);

        shadow.append("feOffset")
            .attr("dx", 2)
            .attr("dy", 2);

        shadow.append("feComponentTransfer")
            .append("feFuncA")
            .attr("type", "linear")
            .attr("slope", 0.2);

        const feMerge = shadow.append("feMerge");
        feMerge.append("feMergeNode");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");


        svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", d => color(d.name))
            .attr("filter", "url(#shadow)")
            .attr("cx", d => radiusScale(d.name) * Math.cos((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))
            .attr("cy", d => radiusScale(d.name) * Math.sin((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))
            .attr("r", 0)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <div style="font-weight: bold; margin-bottom: 5px;">
                        ${d.name} (${d.year})
                    </div>
                    <div>
                        Population: ${d.population.toLocaleString()}
                    </div>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 1)
                    .attr("r", d => Math.sqrt(d.population) * 0.7);
            })
            .on("mouseout", function (event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                // to orinigal state
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 0.8)
                    .attr("r", d => Math.sqrt(d.population) * 0.6);
            })
            .transition()
            .duration(1000)
            .delay((d, i) => i * 10)
            .attr("r", d => Math.sqrt(d.population) * 0.6)
            .attr("opacity", 0.8)
            .style("transition", "all 0.3s ease");

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("padding", "10px")
            .style("background", "rgba(255, 255, 255, 0.9)")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .style("font-size", "12px");


        const axisGroup = svg.append("g")
            .attr("text-anchor", "middle")
            .selectAll()
            .data(x.domain())
            .join("g")
            .on("click", function (event, d) {

                console.log(`Clicked on: ${d}`);
                window.selectedYear = d;
                loadData();

            })
            .on("mouseover", function (event, d) {
                d3.select(this).select("text").attr("fill", "blue");
            })
            .on("mouseout", function (event, d) {
                d3.select(this).select("text").attr("fill", "black");
            })
            .attr("transform", d => `
                rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
                translate(${innerRadius},0)
            `);


        axisGroup.append("line")
            .attr("x2", -5)
            .attr("stroke", "#666")
            .attr("stroke-width", 1.5);

        axisGroup.append("text")
            .attr("class", "label")
            .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)")
            .attr("fill", "#444")
            .attr("font-weight", 500)
            .text(d => d);

        const legend = svg.append("g")
            .attr("transform", "translate(-40, -100)")
            .selectAll()
            .data(color.domain())
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 25})`);

        legend.append("rect")
            .attr("width", 16)
            .attr("height", 16)
            .attr("rx", 2)
            .attr("fill", color)
            .attr("filter", "url(#shadow)");

        legend.append("text")
            .attr("x", 24)
            .attr("y", 8)
            .attr("dy", "0.35em")
            .attr("fill", "#333")
            .attr("font-size", "12px")
            .text(d => d);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadData();
document.getElementById("chart").appendChild(svg.node());