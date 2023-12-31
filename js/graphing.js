import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { get_dist_val } from "./helper_funcs.js";

export function graph_dist(dist) {
    // Filter out useless data (Probabilities that are practically 0)
    const keys = Object.keys(dist.probabilities);
    const data = keys.filter((key) => {
        return dist.probabilities[key] > 0.000001;
    });

    while (data.length > 200) {
        dist.probabilities[data[0]] < dist.probabilities[data[data.length - 1]] ? data.shift() : data.pop();
    }

    // Declare the chart dimensions and margins.
    const width = document.querySelector(".dist-graph").clientWidth;
    const height = width / 2;

    const margin = {
        left: 60,
        right: 30,
        top: 30,
        bottom: 40
    }

    // Declare the x (horizontal position) scale.
    const x_scale = d3.scaleBand()
        .domain(data.map((d) => d))
        .range([margin.left, width - margin.right]).padding(0.2);

    // Declare the y (vertical position) scale.
    const y_scale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => dist.probabilities[d] * 1.2  >= 1 ? 1 : dist.probabilities[d] * 1.2)])
        .range([height - margin.bottom, margin.top]);

    // Remove existing graph if it exists
    d3.select(".dist-output > .dist-graph > svg").remove("svg");

    // Create the SVG container.
    const svg = d3.select(".dist-output > .dist-graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", [0, 0, width, height]);

    // Create tooltip when user hovers over a bar
    const tooltip = d3.select('#tooltip');
    
    tooltip.style('left', "0px").style('top', "0px");
    const mouseover = (event, d) => {
        tooltip.style("opacity", 0.9);
    };
    const mouseleave = (event, d) => {
        tooltip.style('opacity', 0);
    }
    const mousemove = (event, d) => {
        const x = event.clientX + 15, y = event.clientY - 60;
        tooltip.select("label").text(`P(X = ${d})`);
        tooltip.select("#tooltip-val").text(`= ${dist.probabilities[d].toFixed(6)}`);
        tooltip.style('left', (x) + "px").style('top', (y) + "px");
    };

    // Create Rectangles
    svg.selectAll("rect")
        .data(data)
        .join("rect")
            .attr("class", "bar")
            .attr("x", (d) => x_scale(d))
            .attr("y", (d) => y_scale(dist.probabilities[d]))
            .attr("width", x_scale.bandwidth())
            .attr("height", (d) => height - (y_scale(dist.probabilities[d]) + margin.bottom))
            .on("mousemove", mousemove)
            .on("mouseover", mouseover)
            .on("mouseout", mouseleave);

    // Shrink number of tick marks on x-xis depending on width of graph and # of data points.
    let tickIncrement = Math.floor(Math.log2(data.length) / Math.log2(4));
    if (width > 550 && width < 750) {
        tickIncrement = Math.floor(Math.log2(data.length) / Math.log2(3));
    }
    else if (width < 550) {
        tickIncrement = Math.floor(Math.log2(data.length) / Math.log2(2));
    }
    
    if (data.length > 1000) {
        tickIncrement = Math.floor(Math.log10(data.length) / (Math.log10(2)) * 4);
    }
    else if (data.length > 500) {
        tickIncrement = Math.floor(Math.log10(data.length) / (Math.log10(2)) * 2);
    }
    else if (data.length > 100) {
        tickIncrement = Math.floor(Math.log10(data.length) / Math.log10(2));
    }

    if (tickIncrement == 0) {
        tickIncrement = 1;
    }

    // Create x-axis 
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x_scale)
        .tickValues(
            data.map((d, i) => i % tickIncrement == 0 ? d : undefined).filter(item => item)
        ))
        .call((g) => g.append("text")
            .attr("x", (width + margin.left - margin.right) / 2)
            .attr("y", margin.top )
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .style("font-size", "0.8rem")
            .text("x"));

    // Create y-axis
    svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y_scale).ticks(5))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 1.5)
        .attr("fill", "currentColor")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "0.8rem")
        .text("P(X = x)"));

    update_graph_bar_fill(dist);
        
    // Resize/Rerender graph on window resize
    let container = d3.select(svg.node().parentNode);
    d3.select(window).on("resize." + container.attr("id"), () => graph_dist(dist));
}

export function update_graph_bar_fill(dist) {
    let dist_val = get_dist_val(dist);
    if (!dist_val) {
        return;
    }

    let svg = d3.select(".dist-output > .dist-graph > svg");
    svg.selectAll("rect").each(function(d) {
        if (parseInt(d) >= dist_val.lowerIndex && parseInt(d) <= dist_val.upperIndex) {
            d3.select(this).attr("class", "bar selected");
        }
    })
}