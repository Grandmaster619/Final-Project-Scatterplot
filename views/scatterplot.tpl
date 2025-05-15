<!DOCTYPE html>
<html lang="en">
<head>
  <title>3630 Final Project</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    /* Set height of the grid so .sidenav can be 100% (adjust as needed) */
    .row.content {min-height: 550px} /* Use min-height for flexibility */

    /* Set gray background color and 100% height */
    .sidenav {
      background-color: #f1f1f1;
      height: 100%;
    }

    /* On small screens, set height to 'auto' for the grid */
    @media screen and (max-width: 767px) {
      .row.content {height: auto;}
    }

    /* Basic Tooltip CSS */
    .tooltip {
      position: absolute; /* Important for positioning next to mouse */
      text-align: center;
      padding: 8px;
      font: 12px sans-serif;
      background: lightsteelblue;
      border: 1px solid #ccc;
      border-radius: 8px;
      pointer-events: none; /* IMPORTANT: Prevents tooltip from blocking mouse events */
      opacity: 0; /* Initially hidden */
      transition: opacity 0.2s;
    }

    /* Basic Legend CSS */
    #legend {
    margin-left: 20px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 5px;
    min-width: 120px;
    } 
    .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
    }
    .legend-color {
        width: 15px;
        height: 15px;
        margin-right: 8px;
        border: 1px solid #777;
    }
  </style>
</head>
<body>
    <div class="container-fluid">
      <div class="row">
          <div class="col-sm-12">
              <div class="well">
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">

                  <!-- First Row -->
                  <div style="display: flex; align-items: center; gap: 20px;">
                    <label for="priceMax" style="min-width: 120px;">Max Price:</label>
                    <input type="number" id="priceMax" step="0.01" placeholder="e.g. 20">

                    <label for="reviewsMax" style="min-width: 180px;">Max User Reviews:</label>
                    <input type="number" id="reviewsMax" placeholder="e.g. 5000">

                    <button id="applyFilter" style="min-width: 180px;">Apply Filter</button>
                  </div>

                  <!-- Second Row -->
                  <div style="display: flex; align-items: center; gap: 20px;">
                    <label for="priceMin" style="min-width: 120px;">Min Price:</label>
                    <input type="number" id="priceMin" value="1" placeholder="e.g. 5">
                    <label for="reviewsMin" style="min-width: 180px;">Min User Reviews:</label>
                    <input type="number" id="reviewsMin" value="50" placeholder="e.g. 10000">

                    <button id="resetFilter" style="min-width: 180px;">Reset</button>
                  </div>
                  <!-- Search Box -->
                  <div style="margin-bottom: 10px;">
                    <label for="gameSearch">Search Game Title:</label>
                    <input type="text" id="gameSearch" list="gameTitles" placeholder="Start typing...">
                    <datalist id="gameTitles"></datalist>
                  </div>
                </div>
                  <h4>Steam Games: Price vs. User Reviews</h4>
                  <div style="display: flex; flex-direction: row; gap: 20px; align-items: flex-start;">
                    <svg id="scatterplot" width="800" height="600"></svg>
                    <div id="legend"></div>
                  </div>
                  <div class="tooltip"></div>
                  <div>
                      This scatterplot visualizes the relationship between game prices and ratings.
                  </div>
                  <script src="/static/js/scatterplot.js"></script>
              </div>
          </div>
      </div>
  </div>
</body>
</html>
