fetch("http://localhost:5000/api/games")
  .then(response => response.json())
  .then(data => {
    const width = 800, height = 600;
    const svg = d3.select("#scatter")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price)])
      .range([50, width - 50]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.play_count)])
      .range([height - 50, 50]);

      const colorScale = d3.scaleOrdinal()
      .domain([
        "Overwhelmingly Positive", "Very Positive", "Positive", "Mostly Positive",
        "Mixed", "Mostly Negative", "Negative", "Very Negative", "Overwhelmingly Negative"
      ])
      .range([
        "#1b7837", // Overwhelmingly Positive
        "#5aae61", // Very Positive
        "#a6dba0", // Positive
        "#d9f0d3", // Mostly Positive
        "#f7f7f7", // Mixed
        "#fddbc7", // Mostly Negative
        "#f4a582", // Negative
        "#d6604d", // Very Negative
        "#b2182b"  // Overwhelmingly Negative
      ]);

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.price))
      .attr("cy", d => y(d.play_count))
      .attr("r", 6)
      .attr("fill", d => colorScale(d.rating))
      .append("title")
      .text(d => `${d.title}\nRating: ${d.rating}\nPrice: $${d.price}\nPlays: ${d.play_count}`);
  });