
console.log("scatterplot.js loaded");
const svg = d3.select("#scatterplot"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        margin = {top: 20, right: 30, bottom: 40, left: 80},
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip")
                    .style("position", "absolute")
                    .style("background", "lightsteelblue")
                    .style("padding", "5px")
                    .style("border-radius", "5px")
                    .style("opacity", 0);

// Fixed rating order with IDs and names, in the correct order:
const ratingOrder = [
    { id: 1, name: "Overwhelmingly Positive" },
    { id: 2, name: "Very Positive" },
    { id: 3, name: "Positive" },
    { id: 4, name: "Mostly Positive" },
    { id: 5, name: "Mixed" },
    { id: 6, name: "Mostly Negative" },
    { id: 7, name: "Negative" },
    { id: 8, name: "Very Negative" },
    { id: 9, name: "Overwhelmingly Negative" }
];

d3.json("/data").then(data => {
    //data = data.filter(d => d.price_original > 0);

    // Parse data
    data.forEach(d => {
        d.price_original = +d.price_original;
        d.user_reviews = +d.user_reviews;

    });

    // Scales
    const xScale = d3.scaleLinear()
                        .domain(d3.extent(data, d => d.price_original))
                        .range([0, innerWidth])
                        .nice();

    const yScale = d3.scaleLinear()
                        .domain(d3.extent(data, d => d.user_reviews))
                        .range([innerHeight, 0])
                        .nice();

    const colorScale = d3.scaleOrdinal()
                        .domain(ratingOrder.map(d => d.name)) // consistent order
                        .range(d3.schemeCategory10); // maps consistently

    let originalData = data; // Save unfiltered data
    let filteredData = [...originalData]; // Start with full dataset

    function updateScatterplot(dataToPlot) {
        const circles = g.selectAll("circle")
            .data(dataToPlot, d => d.title); // Use a key function for efficient updates

        circles.enter().append("circle")
            .attr("r", 5)
            .attr("fill", d => colorScale(d.rating_name))
            .merge(circles)
            .attr("cx", d => xScale(d.price_original))
            .attr("cy", d => yScale(d.user_reviews))
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Title: ${d.title}<br>Price: $${d.price_original}<br>User Reviews: ${d.user_reviews}<br>Rating: ${d.rating_name}<br>Positive Ratio: ${d.positive_ratio}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        circles.exit().remove();
    }

    // Initial render
    updateScatterplot(filteredData);

    document.getElementById("applyFilter").addEventListener("click", () => {
        const maxPrice = parseFloat(document.getElementById("priceFilter").value);
        const minPrice = parseFloat(document.getElementById("minPrice").value);
        const minReviews = parseFloat(document.getElementById("reviewFilter").value);
        const maxReviews = parseFloat(document.getElementById("maxReviews").value);

        filteredData = originalData.filter(d => {
            const priceHighOk = isNaN(maxPrice) || d.price_original <= maxPrice;
            const priceLowOk = isNaN(minPrice) || d.price_original >= minPrice;
            const reviewHighOk = isNaN(maxReviews) || d.user_reviews <= maxReviews;
            const reviewLowOk = isNaN(minReviews) || d.user_reviews >= minReviews;

            return priceHighOk && priceLowOk && reviewHighOk && reviewLowOk;
        });

        updateScatterplot(filteredData);
    });

    document.getElementById("resetFilter").addEventListener("click", () => {
        document.getElementById("priceFilter").value = '';
        document.getElementById("minPrice").value = '';
        document.getElementById("reviewFilter").value = '';
        document.getElementById("maxReviews").value = '';
        filteredData = [...originalData];
        updateScatterplot(filteredData);
    });

    const zoom = d3.zoom()
    .scaleExtent([0.1, 20]) // Min and max zoom scale
    .translateExtent([
        [-margin.left, -margin.top],                   // top-left limit of panning
        [innerWidth + margin.right, innerHeight + margin.bottom]  // bottom-right limit of panning
    ])
    .on('zoom', zoomed);

    // Attach zoom behavior to SVG
    svg.call(zoom);

    function zoomed(event) {
        // Disable pointer events for performance
        svg.style("pointer-events", "none");

        requestAnimationFrame(() => {
            // event.transform has {x, y, k} for pan and zoom scale
            const transform = event.transform;

            // Create new scales based on transform
            const newXScale = transform.rescaleX(xScale);
            const newYScale = transform.rescaleY(yScale);

            // Update axes
            //g.select(".x-axis").call(d3.axisBottom(newXScale));
            //g.select(".y-axis").call(d3.axisLeft(newYScale));
            // Update axes
            g.select(".x-axis")
                .attr("transform", `translate(0,${newYScale(0)})`)
                .call(d3.axisBottom(newXScale));

            g.select(".y-axis")
                .attr("transform", `translate(${newXScale(0)},0)`)
                .call(d3.axisLeft(newYScale));

            // Update points position
            g.selectAll("circle")
                .data(filteredData, d => d.title)
                .attr("cx", d => newXScale(d.price_original))
                .attr("cy", d => newYScale(d.user_reviews));  // or user_reviews if you use that

            // Re-enable after update
            svg.style("pointer-events", null);
        });
    }

    // Axes
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Price ($)");

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -60)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("User Reviews");

    // Points
    g.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.price_original))
        .attr("cy", d => yScale(d.user_reviews))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.rating_name))
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Title: ${d.title}<br>Price: $${d.price_original}<br>User Reviews: ${d.user_reviews}<br>Rating: ${d.rating_name}<br>Positive Ratio: ${d.positive_ratio}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    
    // Legend
    // Get unique rating names from your data:
    const uniqueRatingNames = new Set(data.map(d => d.rating_name));

    // Filter ratingOrder to only those present in data, preserving order:
    const sortedRatings = ratingOrder.filter(r => uniqueRatingNames.has(r.name));

    // Now update your color scale domain:
    colorScale.domain(sortedRatings.map(r => r.name));

    // Then generate your legend with sortedRatings:
    const legend = d3.select("#legend");
    legend.html("");  // Clear previous legend content

    sortedRatings.forEach(rating => {
        const item = legend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px");

        item.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", colorScale(rating.name))
            .style("margin-right", "5px");

        item.append("span").text(rating.name);
    });

}).catch(error => {
    console.error("Error loading data:", error);
});