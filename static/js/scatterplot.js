console.log("scatterplot.js loaded");

const svg = d3.select("#scatterplot"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    margin = { top: 20, right: 60, bottom: 50, left: 80 },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

// Append defs and clipPath for plotting area clipping
const clipId = "plot-area-clip";
svg.append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

// Main container group translated by margins
const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Group for points with clipping applied
const pointsGroup = g.append("g")
    .attr("clip-path", `url(#${clipId})`)
    .attr("class", "points-group");


// Group for axes on top (no clipping)
const axesGroup = g.append("g").attr("class", "axes-group");

const tooltip = d3.select(".tooltip");

const disabledRatings = new Set(); // Ratings currently toggled off

// Fixed rating order and color scale
const ratingOrder = [
    "Overwhelmingly Positive",
    "Very Positive",
    "Positive",
    "Mostly Positive",
    "Mixed",
    "Mostly Negative",
    "Negative",
    "Very Negative",
    "Overwhelmingly Negative",
];

const colorScale = d3
    .scaleOrdinal()
    .domain(ratingOrder)
    .range(d3.schemeCategory10);

let xScale, yScale;
let originalData = [];
let filteredData = [];
let currentTransform = d3.zoomIdentity;

function createScales(data) {
    const xExtent = d3.extent(data, (d) => d.price_original);
    const yExtent = d3.extent(data, (d) => d.user_reviews);

    const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% padding
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

    xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([0, innerWidth])
        .nice();

    yScale = d3.scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([innerHeight, 0])
        .nice();
}

function renderAxes() {
    // Create empty axis groups (we'll move and update them later)
    axesGroup.append("g").attr("class", "x-axis");
    axesGroup.append("g").attr("class", "y-axis");

    // Axis labels
    axesGroup.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("y", 40)
        .text("Price ($)");

    axesGroup.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -60)
        .text("User Reviews");
}

function updateAxes(newXScale, newYScale) {
    // Original positions of axes based on zero in data coordinates
    const xZero = newYScale(0); // Y position for x-axis
    const yZero = newXScale(0); // X position for y-axis

    // Clamp positions so axes stay within the plot area
    const clampedXZero = Math.min(Math.max(xZero, 0), innerHeight);
    const clampedYZero = Math.min(Math.max(yZero, 0), innerWidth);

    // Update axes with clamped positions
    axesGroup.select(".x-axis")
        .attr("transform", `translate(0, ${clampedXZero})`)
        .call(d3.axisBottom(newXScale));

    axesGroup.select(".y-axis")
        .attr("transform", `translate(${clampedYZero}, 0)`)
        .call(d3.axisLeft(newYScale));

    // Reposition axis labels accordingly
    axesGroup.select(".x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", clampedXZero + 40); // below x-axis

    axesGroup.select(".y-axis-label")
        .attr("x", -innerHeight / 2)
        .attr("y", clampedYZero - 60); // left of y-axis
}

function updateScatterplot(dataToPlot) {
    filteredData = dataToPlot;

    const circles = pointsGroup.selectAll("circle").data(filteredData, (d) => d.title);

    circles
        .enter()
        .append("circle")
        .attr("class", "data-point") // Assign class here
        .attr("r", baseRadius * scaleFactor)
        .on("mouseover", (event, d) => {
            tooltip
                .style("opacity", 0.95)
                .html(`
                    <strong>${d.title}</strong><br><br>
                    <b>Date Released:</b> ${d.date_release}<br> 
                    <b>Price:</b> $${d.price_original}<br>
                    <b>User Reviews:</b> ${d.user_reviews}<br>
                    <b>Rating:</b> ${d.rating_name}<br>
                    <b>Positive Ratio:</b> ${(d.positive_ratio).toFixed(1)}%
                `)
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .merge(circles)
        .attr("cx", (d) => currentTransform.applyX(xScale(d.price_original)))
        .attr("cy", (d) => currentTransform.applyY(yScale(d.user_reviews)))
        .attr("fill", (d) =>
            disabledRatings.has(d.rating_name)
                ? "#ccc"
                : colorScale(d.rating_name)
        )
        .attr("opacity", (d) =>
            disabledRatings.has(d.rating_name) ? 0.3 : 1
        )
        .attr("r", baseRadius * scaleFactor)

    circles.exit().remove();
}

function createLegend(data) {
    const uniqueRatings = new Set(data.map((d) => d.rating_name));
    const sortedRatings = ratingOrder;

    const legend = d3.select("#legend");
    legend.html("");

    sortedRatings.forEach((rating) => {
        const isDisabled = disabledRatings.has(rating);

        const item = legend
            .append("div")
            .attr("class", "legend-item")
            .style("user-select", "none")
            .style("cursor", "pointer")
            .style("opacity", uniqueRatings.has(rating) ? 1 : 0.3)
            .on("click", () => {
                if (disabledRatings.has(rating)) {
                    disabledRatings.delete(rating);
                } else {
                    disabledRatings.add(rating);
                }
                updateLegendStyles();
                updatePointColors(rating);
            });

        item
            .append("div")
            .attr("class", "legend-color")
            .style("background-color", colorScale(rating));

        item
            .append("span")
            .text(rating)
            .style("text-decoration", isDisabled ? "line-through" : "none");
    });
}

function fetchDataAndRender(query = "") {
    d3.json(`/data${query}`)
        .then((data) => {
        // Coerce numeric types
        data.forEach((d) => {
            d.price_original = +d.price_original;
            d.user_reviews = +d.user_reviews;
        });

        originalData = data;
        createScales(originalData);
        
         // Reset zoom state
        const tempTransform = currentTransform;
        currentTransform = d3.zoomIdentity;
        svg.call(zoom.transform, currentTransform);

        updateAxes(xScale, yScale); 
        createLegend(originalData);
        updateLegendStyles();
        updatePointColors();
        updateScatterplot(data);
        highlightSearchedGame();

        currentTransform = tempTransform;
        svg.call(zoom.transform, currentTransform);

        // Populate datalist for search
        const datalist = document.getElementById("gameTitles");
        datalist.innerHTML = "";
        data.forEach((d) => {
        const option = document.createElement("option");
        option.value = d.title;
        datalist.appendChild(option);
        });
    })
    .catch((error) => console.error("Error loading data:", error));
}

// Zoom functionality
const baseRadius = 4;

const zoomScaleMilestones = [
    { maxZoom: 0.5, scale: 1.5 },     // Very zoomed out → bigger points
    { maxZoom: 1, scale: 1.2 },
    { maxZoom: 2, scale: 1 },
    { maxZoom: 4, scale: 0.55 },
    { maxZoom: 8, scale: 0.32 },
    { maxZoom: 16, scale: 0.15 },
    { maxZoom: 32, scale: 0.085 },
    { maxZoom: 64, scale: 0.05 },
    { maxZoom: 128, scale: 0.025 },
    { maxZoom: 256, scale: 0.01 },
    { maxZoom: 512, scale: 0.005 },
    { maxZoom: Infinity, scale: 0.002 }, // Deep zooms, small radius
];

let currentMilestoneIndex = -1; // no milestone selected initially
let scaleFactor = 1;

const zoomHandler = (event) => {
    currentTransform = event.transform;
    pointsGroup.attr("transform", currentTransform);

    const newXScale = currentTransform.rescaleX(xScale);
    const newYScale = currentTransform.rescaleY(yScale);
    updateAxes(newXScale, newYScale);

    const currentScale = event.transform.k;
    const newMilestoneIndex = zoomScaleMilestones.findIndex(m => currentScale <= m.maxZoom);

    if (newMilestoneIndex !== currentMilestoneIndex) {
        currentMilestoneIndex = newMilestoneIndex;

        scaleFactor = zoomScaleMilestones[currentMilestoneIndex].scale;
        pointsGroup.selectAll("circle")
        .attr("r", baseRadius * scaleFactor);
    }

    //console.log(currentMilestoneIndex);
};

const zoom = d3.zoom()
    .scaleExtent([0.5, 1000])
    .translateExtent([[0, 0], [innerWidth, innerHeight]])
    .on("zoom", zoomHandler);

svg.call(zoom);

// Event listeners
document.getElementById("applyFilter").addEventListener("click", () => {
    const priceMin = document.getElementById("priceMin").value || 0;
    const priceMax = document.getElementById("priceMax").value || 1000;
    const reviewsMin = document.getElementById("reviewsMin").value || 0;
    const reviewsMax = document.getElementById("reviewsMax").value || 10000000;

    const query = `?priceMin=${priceMin}&priceMax=${priceMax}&reviewsMin=${reviewsMin}&reviewsMax=${reviewsMax}`;

    fetchDataAndRender(query);
});

document.getElementById("resetFilter").addEventListener("click", () => {
    location.reload();
});

document.getElementById("gameSearch").addEventListener("input", highlightSearchedGame);

document.getElementById("gameSearch").addEventListener("change", searchedGameBlank);

function highlightSearchedGame() {
    const searchTerm = document.getElementById("gameSearch").value.trim().toLowerCase();
    if (searchTerm === "") return;

    const circles = pointsGroup.selectAll("circle");
    circles.each(function(d) {
        const circle = d3.select(this);
        const isMatch = d.title.toLowerCase() === searchTerm;
        // Only update if necessary to reduce DOM writes
        const currentFill = circle.attr("fill");
        const targetFill = isMatch ? colorScale(d.rating_name) : "#ccc";
        if (currentFill !== targetFill) circle.attr("fill", targetFill);

        const currentRadius = +circle.attr("r");
        const targetRadius = isMatch ? 6 * scaleFactor : baseRadius * scaleFactor;
        if (currentRadius !== targetRadius) circle.attr("r", targetRadius);
    });

    // Raise matched circles only once
    pointsGroup.selectAll("circle")
        .filter(d => d.title.toLowerCase() === searchTerm)
        .raise();
}

function searchedGameBlank() {
    if (document.getElementById("gameSearch").value.trim() === "") {
        pointsGroup.selectAll("circle")
            .attr("fill", (d) => colorScale(d.rating_name))
            .attr("r", baseRadius * scaleFactor);
    }
}

function updateLegendStyles() {
    d3.selectAll(".legend-item").each(function() {
        const item = d3.select(this);
        const ratingText = item.select("span").text();
        const isDisabled = disabledRatings.has(ratingText);
        item.style("opacity", isDisabled ? 0.3 : 1);
        item.select("span").style("text-decoration", isDisabled ? "line-through" : "none");
    });
}

function updatePointColors(toggledRating) {
    const circles = g.selectAll("circle.data-point");

    // Raise only toggledRating circles once, if any
    if (toggledRating) {
        circles.filter(d => d.rating_name === toggledRating).raise();
    }

    circles.each(function(d) {
        const circle = d3.select(this);
        const disabled = disabledRatings.has(d.rating_name);
        const fill = disabled ? "#ccc" : colorScale(d.rating_name);
        const opacity = disabled ? 0.3 : 1;

        if (circle.attr("fill") !== fill) circle.attr("fill", fill);
        if (+circle.attr("opacity") !== opacity) circle.attr("opacity", opacity);

        if (disabled) circle.lower();
    });

    highlightSearchedGame();
}

// Initial load
renderAxes();
fetchDataAndRender();
