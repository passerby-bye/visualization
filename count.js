const width = 1000;
const height = width;
const innerRadius = 180;
const outerRadius = 350;
const svg = d3.create("svg")
.attr("width", width)
.attr("height", height)
// .attr("viewBox", `0 0 ${width} ${height}`)
.attr("viewBox", [-width / 2, -height / 2, width, height])
.attr("style", "width: 100%; height: auto; font: 12px sans-serif;");
async function loadData() {
    try {
        // 读取CSV数据
        const data = await d3.csv('data/continent_count.csv', d => ({
            year: d.year,
            name: d.name,  // 使用国家/地区代码
            population: +d.population  
        }));
        console.log(data)
        const allnames = data.map(d => d.name);
    
    // 调试输出：确保 allAges 是一个数组
    console.log("All names:", allnames);

    
        // const series = d3.stack()
        //     .keys(d3.union(data.map(d => d.name))) // distinct series keys, in input order
        //     .value(([, D], key) => D.get(key).population) // get value for each series key and stack
        //   (d3.index(data, d => d.year, d => d.name)); // group by stack then series key
        //   console.log(series.length)
          const series = d3.stack()
          .keys(d3.union(data.map(d => d.name)))
          .value(([, D], key) => D.get(key).population)
          (d3.index(data, d => d.year, d => d.name));

      console.log("Stacked series:", series);


        console.log("Stacked series:", series);
        const arc = d3.arc()
            .innerRadius(d => y(d[0]))
            .outerRadius(d => y(d[1]))
            .startAngle(d => x(d.data[0]))
            .endAngle(d => x(d.data[0]) + x.bandwidth())
            .padAngle(1.5 / innerRadius)
            .padRadius(innerRadius);
    
        // An angular x-scale
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, 2 * Math.PI])
            .align(0);
    
        // A radial y-scale maintains area proportionality of radial bars
        const y = d3.scaleRadial()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .range([innerRadius, outerRadius]);
            const uniqueKeys = Array.from(new Set(data.map(d => d.name)));
            console.log("Unique Keys:", uniqueKeys);
        // const color = d3.scaleOrdinal()
        //     .domain(uniqueKeys)
        //     .range(d3.schemeSpectral[uniqueKeys.length])
        //     .unknown("#ccc");
        const color = d3.scaleOrdinal()
    .domain(uniqueKeys)
    .range([
      "#264653",  // 深青灰色
      "#2a9d8f",  // 青绿色
      "#e9c46a",  // 暖黄色
      "#f4a261",  // 珊瑚橙
      "#e76f51",  // 赤红橙
      "#8ecae6",  // 浅蓝色
      "#219ebc",  // 孔雀蓝
      "#023047",  // 深蓝色
      "#ffb4a2",  // 粉橙色
      "#6d597a"   // 暗紫色
  ])
  
    .unknown("#ccc"); // 未知值的颜色
    
        // A function to format the value in the tooltip
        const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")
        const regions = [...new Set(data.map(d => d.name))]; 
        const radiusScale = d3.scaleOrdinal()
        .domain(regions)
        .range(d3.range(regions.length).map(i => 
          90+y.range()[1] * (0.3 + (i * 0.1))  // Adjust these values to control spacing
        ));

        svg.append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
        .attr("fill", d => color(d.name))
        .attr("cx", d => radiusScale(d.name) * Math.cos((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))
        .attr("cy", d => radiusScale(d.name) * Math.sin((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))    
        .attr("r", d => Math.sqrt(d.population) * 0.5)  // Adjust circle size based on population
        .append("title")
          .text(d => `${d.year} ${d.name}: ${d.population.toLocaleString("en")}`);
    
    
        // x axis
        svg.append("g")
            .attr("text-anchor", "middle")
          .selectAll()
          .data(x.domain())
          .join("g")
            .attr("transform", d => `
              rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
              translate(${innerRadius},0)
            `)
            .on("click", function(event, d) { // 添加点击事件
                // 在这里处理点击事件
                console.log(`Clicked on: ${d}`);
                window.selectedYear = d;
                loadData();

              })
              .on("mouseover", function(event, d) { // 添加鼠标悬停事件
                d3.select(this).select("text").attr("fill", "blue"); // 改变文本颜色
            })
            .on("mouseout", function(event, d) { // 添加鼠标移出事件
                d3.select(this).select("text").attr("fill", "black"); // 恢复文本颜色
            })
            .call(g => g.append("line")
                .attr("x2", -5)
                .attr("stroke", "#000"))
            .call(g => g.append("text")
            .attr("class", "label")
                .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                    ? "rotate(90)translate(0,16)"
                    : "rotate(-90)translate(0,-9)")
                .text(d => d));

        svg.append("g")
          .selectAll()
          .data(color.domain())
          .join("g")
            .attr("transform", (d, i, nodes) => `translate(-40,${(nodes.length / 2 - i - 1) * 20})`)
            .call(g => g.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", color))
            .call(g => g.append("text")
                .attr("x", 24)
                .attr("y", 9)
                .attr("dy", "0.35em")
                .text(d => d));
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        loadData();  
        document.getElementById("chart").appendChild(svg.node());