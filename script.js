const margin = { top: 20, right: 150, bottom: 70, left: 70 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const svg = d3.select(".bubble-plot") // Select the bubble plot SVG
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Title for the Bubble Plot
svg.append("text")
.attr("class", "bubble-plot-title")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", -margin.top / 3.5)
.text("Goals Per 90 across Europe's Top 5 Leagues in the 2022/23 Season")
.style("font-size", "18px")
.style("font-weight", "bold")
.style("font-family", "Arial");

// Axes
svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);

svg.append("g")
    .attr("class", "y-axis");

svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 20)
    .text("Match Index")
    .style("font-size", "16px")
    .style("font-family", "Arial");

svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", -(height / 2))
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .text("Goals per 90")
    .style("font-size", "16px")
    .style("font-family", "Arial");

// container for the legend
const legendContainer = d3.select('body').selectAll('.legend-container')
    .data([0])
    .join('div')
    .attr('class', 'legend-container');

// separate div for each legend item
const legendGoals = legendContainer.append('div')
    .attr('class', 'legend-block');

const legendColors = legendContainer.append('div')
    .attr('class', 'legend-block');

legendGoals.append('div')
    .attr('class', 'legend-title')
    .text('Bubbles');

legendGoals.append('div')
    .attr('class', 'legend-text')
    .text('Denote the number of goals scored by individual players.');

const legendMins = legendContainer.append('div')
    .attr('class', 'legend-block');

legendMins.append('div')
    .attr('class', 'legend-title')
    .text('Bubble Size');

legendMins.append('div')
    .attr('class', 'legend-text')
    .text('Denotes minutes played for individual players.');

legendColors.append('div')
    .attr('class', 'legend-title')
    .text('Bubble Colors');

legendColors.append('div')
    .attr('class', 'legend-text')
    .text('Are unique to each team.');


// tooltip
const tooltip = d3.select(".svg-container").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


let originalData;
let radarFilteredData = originalData;
let bubbleFilteredData = originalData;

// Define a color scale for teams
let colorScale;

// Load external data from Github
d3.csv("https://raw.githubusercontent.com/RonGO4/Football-Player-Dataset-2022-2023-/main/Football%20player_stats%20.csv").then(function(data) {
    originalData = data.filter(d => d.Position.includes("MF") || d.Position.includes("FW") || (d.Position.includes("MF") && d.Position.includes("FW")));
    
    // Data cleaning
    data.forEach(d => {
        Object.keys(d).forEach(k => d[k.trim()] = d[k].trim());
        d.Mins = +d.MIn.replace(/[^0-9.]/g, "");
        d.Goals = +d.Goal || 0;
        d.MatchIndex = +d['Match played'] || 0;
        d.Assists = +d.Assist || 0;
        d.ExpectedGoals = +d['Expected Goal'] || 0;
        d.ExpectedAssists = +d['Expected Assisted Goal'] || 0;
        d.ProgressiveCarries = +d['Progressive Carries'] || 0;
        d.ProgressivePasses = +d['Progressive Passes'] || 0;
    });

// filter data
    let competitions = new Set(data.map(d => d.Compition));
    competitions = ["All", ...Array.from(competitions).sort()];

    let positions = ["MF", "FW"];

    let teams = Array.from(new Set(originalData.map(d => d.Squad)));

    colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(teams);


    // Dropdowns
    const leagueSelect = d3.select('#league-select');
    const team1Select = d3.select('#team1-select');
    const team2Select = d3.select('#team2-select');
    const positionSelect = d3.select('#position-select');
    const player1Select = d3.select('#player1-select');
    const player2Select = d3.select('#player2-select');

    leagueSelect
        .selectAll('option')
        .data(competitions)
        .enter()
        .append('option')
        .text(d => d);

    positionSelect
        .selectAll('option')
        .data(["All", ...positions])
        .enter()
        .append('option')
        .text(d => d);

        updateTeamDropdown("All");

        function updateTeamDropdown(selectedLeague) {
            const relevantTeams = selectedLeague === "All" ?
                originalData.map(d => d.Squad) :
                originalData.filter(d => d.Compition === selectedLeague).map(d => d.Squad);
            const teams = new Set(relevantTeams);
            team1Select.selectAll('option').remove();
            team1Select
                .selectAll('option')
                .data(["All", ...Array.from(teams).sort()])
                .enter()
                .append('option')
                .text(d => d);
        
            team2Select.selectAll('option').remove();
            team2Select
                .selectAll('option')
                .data(["All", ...Array.from(teams).sort()])
                .enter()
                .append('option')
                .text(d => d);
        
            updatePlayerDropdowns();
        }
        
        function updatePlayerDropdowns() {
            const selectedLeague = leagueSelect.node().value;
            const selectedTeam1 = team1Select.node().value;
            const selectedTeam2 = team2Select.node().value;
        
            const leagueFilteredData = selectedLeague === "All"
                ? originalData
                : originalData.filter(d => d.Compition === selectedLeague);
        
            const team1Players = selectedTeam1 === "All"
                ? leagueFilteredData
                : leagueFilteredData.filter(d => d.Squad === selectedTeam1);
            const uniqueTeam1Players = Array.from(new Set(team1Players.map(p => p['Player name']))).sort();
        
            player1Select.selectAll('option').remove();
            player1Select
                .selectAll('option')
                .data(["-", ...uniqueTeam1Players])
                .enter()
                .append('option')
                .text(d => d);
        
            const team2Players = selectedTeam2 === "All"
                ? leagueFilteredData
                : leagueFilteredData.filter(d => d.Squad === selectedTeam2);
            const uniqueTeam2Players = Array.from(new Set(team2Players.map(p => p['Player name']))).sort();
        
            player2Select.selectAll('option').remove();
            player2Select
                .selectAll('option')
                .data(["-", ...uniqueTeam2Players])
                .enter()
                .append('option')
                .text(d => d);
        }
        
        leagueSelect.on('change', function() {
            updateTeamDropdown(this.value);
            updatePlayerDropdowns();  
            updateVisuals();
        });
        
        team1Select.on('change', function() {
            updatePlayerDropdowns();
            updateVisuals();
        });
        
        team2Select.on('change', function() {
            updatePlayerDropdowns();
            updateVisuals();
        });
        
        positionSelect.on('change', updateVisuals);
        player1Select.on('change', updateVisuals);
        player2Select.on('change', updateVisuals);
        
        // Update visuals based on the dropdowns
        function updateVisuals() {
            updateBubbleFilteredData();
            drawBubbles(bubbleFilteredData);
        
            updateRadarFilteredData();
            transitionRadarPlot();
            displayPlayerInfo();
        }

    // Update the data based on the dropdowns
    function updateBubbleFilteredData() {
        const selectedLeague = leagueSelect.node().value;
        const selectedTeam1 = team1Select.node().value;
        const selectedTeam2 = team2Select.node().value;
        const selectedPosition = positionSelect.node().value;

        bubbleFilteredData = originalData;

        if (selectedLeague !== "All") {
            bubbleFilteredData = bubbleFilteredData.filter(d => d.Compition === selectedLeague);
        }
        if (selectedTeam1 !== "All") {
            bubbleFilteredData = bubbleFilteredData.filter(d => d.Squad === selectedTeam1);
        }
        if (selectedTeam2 !== "All") {
            bubbleFilteredData = bubbleFilteredData.concat(originalData.filter(d => d.Squad === selectedTeam2));
        }
        if (selectedPosition !== "All") {
            bubbleFilteredData = bubbleFilteredData.filter(d => d.Position.includes(selectedPosition));
        }
    }


    // Transition for the radar plot
    function transitionRadarPlot() {
        const svgRadar = d3.select(".radar-chart");
        const radarWrapper = svgRadar.selectAll(".radarWrapper");

        radarWrapper.selectAll(".radarArea")
            .transition()
            .duration(250)
            .style("fill-opacity", 0)
            .remove();

        radarWrapper.selectAll(".radarStroke")
            .transition()
            .duration(250)
            .style("fill", "none")
            .remove();

        setTimeout(() => {
            drawRadarPlot();
        }, 750);
    }

    // Update the data based on the dropdowns
    function updateRadarFilteredData() {
        const selectedPlayer1 = player1Select.node().value;
        const selectedPlayer2 = player2Select.node().value;

        radarFilteredData = originalData;

        if (selectedPlayer1 !== "All") {
            radarFilteredData = radarFilteredData.filter(d => d['Player name'] === selectedPlayer1);
        }
        if (selectedPlayer2 !== "All") {
            radarFilteredData = radarFilteredData.concat(originalData.filter(d => d['Player name'] === selectedPlayer2));
        }
    }

    // Draw the radar plot
function drawRadarPlot() {
    const svgRadar = d3.select(".radar-chart");
    
    svgRadar.selectAll("*").remove();

    // Define margins and dimensions for the radar chart
    const marginRadar = { top: 50, right: 80, bottom: 50, left: 80 };
    const widthRadar = 500 - marginRadar.left - marginRadar.right;
    const heightRadar = 500 - marginRadar.top - marginRadar.bottom;

    const radarChart = svgRadar.append("g")
        .attr("transform", `translate(${marginRadar.left + (widthRadar / 2)}, ${marginRadar.top + (heightRadar / 2)})`);

    // Radar Plot Title
    svgRadar.append("text")
        .attr("class", "radar-title")
        .attr("text-anchor", "middle")
        .attr("x", marginRadar.left + (widthRadar / 2))
        .attr("y", marginRadar.top / 3)
        .text("Player Comparisons")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("font-family", "Arial");

    // Define the categories for the radar chart

    const categories = ["Goals", "Assists", "ExpectedGoals", "ExpectedAssists", "ProgressiveCarries", "ProgressivePasses"];
    const selectedPlayers = radarFilteredData;
    const normalizedData = normalizeData(selectedPlayers, categories);

    const maxValue = 1; // As the data has been normalized, the maximum value is 1

    const angleSlice = Math.PI * 2 / categories.length;

    const rScale = d3.scaleLinear()
        .range([0, widthRadar / 2])
        .domain([0, maxValue]);

    // Draw the circular grids
    const levels = 5;
    for (let level = 0; level < levels; level++) {
        let factor = rScale(maxValue * ((level + 1) / levels));
        radarChart.append("circle")
            .attr("r", factor)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("fill", "none")
            .style("stroke", "grey")
            .style("stroke-opacity", 0.5)
            .style("stroke-dasharray", "2,3");

        // labels for each level

        radarChart.append("text")
        .attr("x", 5) // Offset text a bit right from origin point
        .attr("y", -factor) // Position text in line with each circle
        .attr("fill", "#737373") // Text color
        .style("font-size", "10px")
        .text((maxValue * ((level + 1) / levels)).toFixed(2)); // Text showing the value

    }

    // labels on each slice
    radarChart.selectAll(".axisLabel")
        .data(d3.range(angleSlice, 2 * Math.PI, angleSlice))
        .enter().append("text")
        .attr("class", "axisLabel")
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("x", (d, i) => rScale(maxValue * 1.1) * Math.cos(d - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * 1.1) * Math.sin(d - Math.PI / 2))
        .text((d, i) => categories[i]);

    const axisGrid = radarChart.append("g").attr("class", "axisWrapper");

    // Axis lines for each category
    axisGrid.selectAll(".lines")
        .data(d3.range(0, angleSlice * categories.length, angleSlice))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue) * Math.cos(d - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue) * Math.sin(d - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "grey")
        .style("stroke-width", "1px");

        // The radar chart function
        const radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);

        const radarWrapper = radarChart.selectAll(".radarWrapper")
            .data(normalizedData);
        
        // Radar area
        radarWrapper.enter().append("g")
            .attr("class", "radarWrapper")
            .append("path")
            .attr("class", "radarArea")
            .merge(radarWrapper.select(".radarArea"))
            .transition().duration(750)
            .attr("d", d => radarLine(categories.map(category => ({ value: d[category] }))))
            .style("fill", function(d) { return colorScale(d.Squad); })
            .style("fill-opacity", 0.5)  
            .style("stroke-width", "5px"); 

        radarWrapper.enter().append("g")
            .attr("class", "radarWrapper")
            .append("path")
            .attr("class", "radarStroke")
            .merge(radarWrapper.select(".radarStroke"))
            .transition().duration(750)
            .attr("d", d => radarLine(categories.map(category => ({ value: d[category] }))))
            .style("stroke-width", "5px") 
            .style("stroke", function(d) { return colorScale(d.Squad); })
            .style("fill", "none");

        radarWrapper.exit().remove();
    }


    // Draw the bubbles for the Bubble P;ot
    function drawBubbles(data) {
        const t = svg.transition()
            .duration(750);
        
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.MatchIndex)])
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Goals)])
            .range([height, 0]);
    
        svg.select(".x-axis").transition(t)
            .call(d3.axisBottom(x));
        
        svg.select(".y-axis").transition(t)
            .call(d3.axisLeft(y));
    
        const bubbles = svg.selectAll(".bubble")
            .data(data, d => d['Player name']); 


        // Bubble tooltip functionality
        bubbles.enter().append("circle")
            .attr("class", "bubble")
            .merge(bubbles) 
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .raise() // Bring to front when hovered
                    .transition()
                    .duration(200)
                    .attr("r", Math.sqrt(d.Mins) / 5 + 3) 
                    .style("fill-opacity", 1); 
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(`<strong>${d['Player name']}</strong><br>Goals: ${d.Goals}<br>Minutes Played: ${d.Mins}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr("r", Math.sqrt(d.Mins) / 5)
                    .style("fill-opacity", 0.7); // Reduce opacity back to less focused state
    
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition(t)
            .attr("cx", d => x(d.MatchIndex))
            .attr("cy", d => y(d.Goals))
            .attr("r", d => Math.sqrt(d.Mins) / 5)
            .style("fill", function(d) {
                // Apply grey scale to non-selected players when filtering by player
                const selectedPlayer1 = player1Select.node().value;
                const selectedPlayer2 = player2Select.node().value;
                if ((selectedPlayer1 !== "-" && selectedPlayer1 !== "" && d['Player name'] !== selectedPlayer1) && 
                    (selectedPlayer2 !== "-" && selectedPlayer2 !== "" && d['Player name'] !== selectedPlayer2)) {
                    return "grey";
                } else {
                    return colorScale(d.Squad);
                }
            })
            .style("fill-opacity", 0.7)
            .style("stroke", function(d) {
                const selectedPlayer1 = player1Select.node().value;
                const selectedPlayer2 = player2Select.node().value;
                if (d['Player name'] === selectedPlayer1 || d['Player name'] === selectedPlayer2) {
                    return "black"; // Stroke to highlight selected players
                } else {
                    return "none"; // No stroke for non-selected players
                }
            })
            .style("stroke-width", 3);
    
        // Exit
        bubbles.exit().transition(t)
            .attr("r", 0)
            .remove();
    
        function handleMouseOver(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`<strong>${d['Player name']}</strong><br>Goals: ${d.Goals}<br>Minutes Played: ${d.Mins}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 3);
        }
    
        function handleMouseOut(event, d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this)
                .style("stroke", "none");
        }
    }
    
    function clearRadarPlot() {
        const svgRadar = d3.select(".radar-chart");
        svgRadar.selectAll("*").remove();
    }

    function normalizeData(data, categories) {
        // Calculate the maximum value among the selected players for each category
        const maxValues = {};
        categories.forEach(category => {
            maxValues[category] = Math.max(...data.map(player => player[category]));
        });

        const normalizedData = data.map(player => {
            const normalizedPlayer = {};
            categories.forEach(category => {
                const normalizedValue = player[category] / maxValues[category];
                normalizedPlayer[category] = normalizedValue;
            });
            normalizedPlayer.Squad = player.Squad; // Store the team name for the color scale
            return normalizedPlayer;
        });

        return normalizedData;
    }

    // display player information
    function displayPlayerInfo() {
        const player1InfoDiv = d3.select('#player1-info');
        const player2InfoDiv = d3.select('#player2-info');

        // Clear previous information
        player1InfoDiv.selectAll('*').remove();
        player2InfoDiv.selectAll('*').remove();

        // Get the selected player's data
        const selectedPlayer1 = d3.select('#player1-select').node().value;
        const selectedPlayer2 = d3.select('#player2-select').node().value;

        const player1Data = radarFilteredData.find(d => d['Player name'] === selectedPlayer1);
        const player2Data = radarFilteredData.find(d => d['Player name'] === selectedPlayer2);

        if (player1Data) {
            displayPlayerData(player1InfoDiv, player1Data);
        }

        if (player2Data) {
            displayPlayerData(player2InfoDiv, player2Data);
        }
    }

    function displayPlayerData(playerInfoDiv, playerData) {
        const relevantFields = ['Player name', 'Nation', 'Position', 'Squad', 'Compition', 'Born year', 'Match played', 'Goals', 'Assists', 'ExpectedGoals', 'ExpectedAssists', 'ProgressiveCarries', 'ProgressivePasses'];
    
        // Get the team color from the color scale based on the squad
        const teamColor = colorScale(playerData.Squad);
    
        
        relevantFields.forEach(field => {
            playerInfoDiv.append('div')
                .attr('class', 'player-info-block')
                .style('border', `2px solid ${teamColor}`) 
                .style('padding', '10px') 
                .style('margin', '5px 0') 
                .style('background-color', 'rgba(255, 255, 255, 0.6)') 
                .html(`<strong>${field}:</strong> ${playerData[field]}`);
        });
    }
    
    updateVisuals();

});