// const width = 1000;
// const height = width;
// const innerRadius = 180;
// const outerRadius = 350;
// const svg = d3.create("svg")
// .attr("width", width)
// .attr("height", height)
// // .attr("viewBox", `0 0 ${width} ${height}`)
// .attr("viewBox", [-width / 2, -height / 2, width, height])
// .attr("style", "width: 100%; height: auto; font: 12px sans-serif;");
// async function loadData() {
//     try {
//         // 读取CSV数据
//         const data = await d3.csv('data/continent_count.csv', d => ({
//             year: d.year,
//             name: d.name,  // 使用国家/地区代码
//             population: +d.population  
//         }));
//         console.log(data)
//         const allnames = data.map(d => d.name);
    
//     // 调试输出：确保 allAges 是一个数组
//     console.log("All names:", allnames);

    
//         // const series = d3.stack()
//         //     .keys(d3.union(data.map(d => d.name))) // distinct series keys, in input order
//         //     .value(([, D], key) => D.get(key).population) // get value for each series key and stack
//         //   (d3.index(data, d => d.year, d => d.name)); // group by stack then series key
//         //   console.log(series.length)
//           const series = d3.stack()
//           .keys(d3.union(data.map(d => d.name)))
//           .value(([, D], key) => D.get(key).population)
//           (d3.index(data, d => d.year, d => d.name));

//       console.log("Stacked series:", series);


//         console.log("Stacked series:", series);
//         const arc = d3.arc()
//             .innerRadius(d => y(d[0]))
//             .outerRadius(d => y(d[1]))
//             .startAngle(d => x(d.data[0]))
//             .endAngle(d => x(d.data[0]) + x.bandwidth())
//             .padAngle(1.5 / innerRadius)
//             .padRadius(innerRadius);
    
//         // An angular x-scale
//         const x = d3.scaleBand()
//             .domain(data.map(d => d.year))
//             .range([0, 2 * Math.PI])
//             .align(0);
    
//         // A radial y-scale maintains area proportionality of radial bars
//         const y = d3.scaleRadial()
//             .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
//             .range([innerRadius, outerRadius]);
//             const uniqueKeys = Array.from(new Set(data.map(d => d.name)));
//             console.log("Unique Keys:", uniqueKeys);
//         // const color = d3.scaleOrdinal()
//         //     .domain(uniqueKeys)
//         //     .range(d3.schemeSpectral[uniqueKeys.length])
//         //     .unknown("#ccc");
//         const color = d3.scaleOrdinal()
//     .domain(uniqueKeys)
//     .range([
//       "#264653",  // 深青灰色
//       "#2a9d8f",  // 青绿色
//       "#e9c46a",  // 暖黄色
//       "#f4a261",  // 珊瑚橙
//       "#e76f51",  // 赤红橙
//       "#8ecae6",  // 浅蓝色
//       "#219ebc",  // 孔雀蓝
//       "#023047",  // 深蓝色
//       "#ffb4a2",  // 粉橙色
//       "#6d597a"   // 暗紫色
//   ])
  
//     .unknown("#ccc"); // 未知值的颜色
    
//         // A function to format the value in the tooltip
//         const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")
//         const regions = [...new Set(data.map(d => d.name))]; 
//         const radiusScale = d3.scaleOrdinal()
//         .domain(regions)
//         .range(d3.range(regions.length).map(i => 
//           90+y.range()[1] * (0.3 + (i * 0.1))  // Adjust these values to control spacing
//         ));

//         svg.append("g")
//       .selectAll("circle")
//       .data(data)
//       .join("circle")
//         .attr("fill", d => color(d.name))
//         .attr("cx", d => radiusScale(d.name) * Math.cos((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))
//         .attr("cy", d => radiusScale(d.name) * Math.sin((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))    
//         .attr("r", d => Math.sqrt(d.population) * 0.5)  // Adjust circle size based on population
//         .append("title")
//           .text(d => `${d.year} ${d.name}: ${d.population.toLocaleString("en")}`);
    
    
//         // x axis
//         svg.append("g")
//             .attr("text-anchor", "middle")
//           .selectAll()
//           .data(x.domain())
//           .join("g")
//             .attr("transform", d => `
//               rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
//               translate(${innerRadius},0)
//             `)
//             .on("click", function(event, d) { // 添加点击事件
//                 // 在这里处理点击事件
//                 console.log(`Clicked on: ${d}`);
//                 window.selectedYear = d;
//                 loadData();

//               })
//               .on("mouseover", function(event, d) { // 添加鼠标悬停事件
//                 d3.select(this).select("text").attr("fill", "blue"); // 改变文本颜色
//             })
//             .on("mouseout", function(event, d) { // 添加鼠标移出事件
//                 d3.select(this).select("text").attr("fill", "black"); // 恢复文本颜色
//             })
//             .call(g => g.append("line")
//                 .attr("x2", -5)
//                 .attr("stroke", "#000"))
//             .call(g => g.append("text")
//             .attr("class", "label")
//                 .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
//                     ? "rotate(90)translate(0,16)"
//                     : "rotate(-90)translate(0,-9)")
//                 .text(d => d));

//         svg.append("g")
//           .selectAll()
//           .data(color.domain())
//           .join("g")
//             .attr("transform", (d, i, nodes) => `translate(-40,${(nodes.length / 2 - i - 1) * 20})`)
//             .call(g => g.append("rect")
//                 .attr("width", 18)
//                 .attr("height", 18)
//                 .attr("fill", color))
//             .call(g => g.append("text")
//                 .attr("x", 24)
//                 .attr("y", 9)
//                 .attr("dy", "0.35em")
//                 .text(d => d));
//             } catch (error) {
//                 console.error('Error loading data:', error);
//             }
//         }
//         loadData();  
//         document.getElementById("chart").appendChild(svg.node());
const width = 1000;
const height = width;
const innerRadius = 200;  // 增加内圆半径
const outerRadius = 400;  // 增加外圆半径

// 创建具有渐变背景的SVG
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "width: 100%; height: auto; font: 14px 'Helvetica Neue', sans-serif;"); // 改进字体

// 添加渐变背景
const defs = svg.append("defs");
const gradient = defs.append("radialGradient")
    .attr("id", "background-gradient")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "10%");

gradient.append("stop")
    .attr("offset", "0%")
    .attr("style", "stop-color: #f8f9fa; stop-opacity: 1");
gradient.append("stop")
    .attr("offset", "100%")
    .attr("style", "stop-color: #e9ecef; stop-opacity: 1");

// 添加背景圆
svg.append("circle")
    .attr("r", outerRadius + 100)
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
            .padAngle(2 / innerRadius)  // 增加间隔
            .padRadius(innerRadius);
    
        // 优化角度比例尺
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, 2 * Math.PI])
            .align(0)
            .padding(0.1);  // 添加padding
    
        const y = d3.scaleRadial()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .range([innerRadius, outerRadius]);

        const uniqueKeys = Array.from(new Set(data.map(d => d.name)));
        
        // 更新配色方案
        const color = d3.scaleOrdinal()
            .domain(uniqueKeys)
            .range([
                "#2E4057",  // 深蓝灰
                "#048BA8",  // 青蓝
                "#16DB93",  // 绿松石
                "#EFEA5A",  // 柠檬黄
                "#F29E4C",  // 橙色
                "#F25C54",  // 珊瑚红
                "#A06CD5",  // 紫色
                "#6247AA",  // 深紫
                "#102542",  // 海军蓝
                "#dc2626"   // 暖灰
            ])
            .unknown("#ddd");
    
        const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")
        const regions = [...new Set(data.map(d => d.name))]; 
        
        // 优化径向位置计算
        const radiusScale = d3.scaleOrdinal()
            .domain(regions)
            .range(d3.range(regions.length).map(i => 
                100 + y.range()[1] * (0.35 + (i * 0.08))
            ));

        // 添加阴影效果
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

        // 绘制圆点并添加动画效果
        svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("fill", d => color(d.name))
            .attr("filter", "url(#shadow)")
            .attr("cx", d => radiusScale(d.name) * Math.cos((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))
            .attr("cy", d => radiusScale(d.name) * Math.sin((x(d.year) + x.bandwidth() / 2) - Math.PI / 2))    
            .attr("r", 0)  // 初始半径为0
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
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
                
                // 突出显示当前圆点
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 1)
                    .attr("r", d => Math.sqrt(d.population) * 0.7); // 略微放大
            })
            .on("mouseout", function(event, d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                // 恢复圆点原始状态
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill-opacity", 0.8)
                    .attr("r", d => Math.sqrt(d.population) * 0.6);
            })
            .transition()  // 添加过渡动画
            .duration(1000)
            .delay((d, i) => i * 50)
            .attr("r", d => Math.sqrt(d.population) * 0.6)  // 增大圆点尺寸
            .attr("opacity", 0.8)  // 添加透明度
            .style("transition", "all 0.3s ease");

                
        // 添加交互式提示框
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

        // 优化坐标轴样式
        const axisGroup = svg.append("g")
            .attr("text-anchor", "middle")
            .selectAll()
            .data(x.domain())
            .join("g")
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
            .attr("transform", d => `
                rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
                translate(${innerRadius},0)
            `);

        // 添加坐标轴线
        axisGroup.append("line")
            .attr("x2", -5)
            .attr("stroke", "#666")
            .attr("stroke-width", 1.5);

        // 优化坐标轴文本
        axisGroup.append("text")
            .attr("class", "label")
            .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)")
            .attr("fill", "#444")
            .attr("font-weight", 500)
            .text(d => d);

        // 优化图例样式
        const legend = svg.append("g")
            .attr("transform", "translate(-40, -100)")  // 调整图例位置
            .selectAll()
            .data(color.domain())
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 25})`);  // 增加图例间距

        legend.append("rect")
            .attr("width", 16)
            .attr("height", 16)
            .attr("rx", 2)  // 添加圆角
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