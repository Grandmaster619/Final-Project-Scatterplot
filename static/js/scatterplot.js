console.log("scatterplot.js loaded");

const svg = d3.select("#scatterplot"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    margin = { top: 20, right: 80, bottom: 50, left: 80 },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

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

function createScales(data) {
    xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.price_original))
        .range([0, innerWidth])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.user_reviews))
        .range([innerHeight, 0])
        .nice();
}

function renderAxes() {
    // Create empty axis groups (we'll move and update them later)
    g.append("g").attr("class", "x-axis");
    g.append("g").attr("class", "y-axis");

    // Axis labels
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("y", 40)
        .text("Price ($)");

    g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -60)
        .text("User Reviews");
}

function updateAxes(newXScale, newYScale) {
    const xZero = newYScale(0); // Y position for x-axis at y=0
    const yZero = newXScale(0); // X position for y-axis at x=0

    g.select(".x-axis")
        .attr("transform", `translate(0, ${xZero})`)
        .call(d3.axisBottom(newXScale));

    g.select(".y-axis")
        .attr("transform", `translate(${yZero}, 0)`)
        .call(d3.axisLeft(newYScale));

    // Reposition axis labels as well
    g.select(".x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", xZero + 40); // relative to x-axis

    g.select(".y-axis-label")
        .attr("x", -innerHeight / 2)
        .attr("y", yZero - 60); // relative to y-axis
}

function updateScatterplot(dataToPlot) {
    filteredData = dataToPlot;

    const circles = g.selectAll("circle").data(filteredData, (d) => d.title);

    circles
        .enter()
        .append("circle")
        .attr("class", "data-point") // Assign class here
        .attr("r", 5)
        .attr("fill", (d) => colorScale(d.rating_name))
        .on("mouseover", (event, d) => {
            tooltip
                .style("opacity", 0.9)
                .html(
                    `Title: ${d.title}<br>Price: $${d.price_original}<br>User Reviews: ${d.user_reviews}<br>Rating: ${d.rating_name}<br>Positive Ratio: ${d.positive_ratio}`
                )
                .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .merge(circles)
        .attr("cx", (d) => xScale(d.price_original))
        .attr("cy", (d) => yScale(d.user_reviews));

    circles.exit().remove();
}

function createLegend(data) {
    const uniqueRatings = new Set(data.map((d) => d.rating_name));
    const sortedRatings = ratingOrder;

    const legend = d3.select("#legend");
    legend.html("");

    sortedRatings.forEach((rating) => {
        const item = legend
            .append("div")
            .attr("class", "legend-item")
            .style("user-select", "none")
            .style("opacity", uniqueRatings.has(rating) ? 1 : 0.3); // Dim if not in data
    
        item
            .append("div")
            .attr("class", "legend-color")
            .style("background-color", colorScale(rating));
    
        item.append("span").text(rating);
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
        updateAxes(xScale, yScale); 
        createLegend(originalData);
        updateScatterplot(data);
        highlightSearchedGame();

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
const zoom = d3
    .zoom()
    .scaleExtent([0.1, 20])
    .translateExtent([
        [-margin.left, -margin.top],
        [innerWidth + margin.right, innerHeight + margin.bottom],
    ])
    .on("zoom", (event) => {
        const transform = event.transform;
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);

        updateAxes(newXScale, newYScale);

        g.selectAll("circle")
        .attr("cx", (d) => newXScale(d.price_original))
        .attr("cy", (d) => newYScale(d.user_reviews));
    });

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
    document.getElementById("priceMin").value = 1;
    document.getElementById("priceMax").value = "";
    document.getElementById("reviewsMin").value = 50;
    document.getElementById("reviewsMax").value = "";

    const query = `?priceMin=${priceMin}&priceMax=${priceMax}&reviewsMin=${reviewsMin}&reviewsMax=${reviewsMax}`;

    fetchDataAndRender(query);
});

document.getElementById("gameSearch").addEventListener("input", highlightSearchedGame);

document.getElementById("gameSearch").addEventListener("change", function () {
    if (this.value.trim() === "") {
        g.selectAll("circle")
            .attr("fill", (d) => colorScale(d.rating_name))
            .attr("r", 5);
    }
});

function highlightSearchedGame() {
    const searchTerm = document.getElementById("gameSearch").value.trim().toLowerCase();

    if (searchTerm === "")
        return;

    g.selectAll("circle")
        .attr("fill", (d) =>
            d.title.toLowerCase() === searchTerm ? colorScale(d.rating_name) : "#ccc"
        )
        .attr("r", (d) => (d.title.toLowerCase() === searchTerm ? 8 : 5))
    
        // Bring the matched circle to front
    g.selectAll("circle")
    .filter((d) => d.title.toLowerCase() === searchTerm)
    .raise(); // <-- this brings the matched circle to the front
}

// Initial load
renderAxes();
fetchDataAndRender();
