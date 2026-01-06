Promise.all([
    d3.csv("./data/incidents_by_state.csv"),
    d3.csv("./data/guns.csv")
]).then(([incidents, guns]) => {

    const incidentCounts = d3.rollup(
        incidents,
        rows => rows.length,
        row => row.state
    );

    const gunsByState = {};
    guns.forEach(row => {
        gunsByState[row.state] = {
            guns_registered: Number(row.guns_registered),
            guns_per_capita: Number(row.guns_per_capita)
        };
    });

    const merged = [];

incidents.forEach(row => {
    const state = row.state;
    const gunInfo = gunsByState[state];

    if (gunInfo) {
        merged.push({
            state,
            incidents: Number(row.incident_count),
            guns_registered: gunInfo.guns_registered,
            guns_per_capita: gunInfo.guns_per_capita
        });
    }
});


    merged.sort((a, b) => b.incidents - a.incidents);

    function linearRegression(data, xField, yField) {
        const n = data.length;
        let sx = 0, sy = 0, sxy = 0, sxx = 0;

        data.forEach(d => {
            const x = d[xField];
            const y = d[yField];
            sx += x;
            sy += y;
            sxy += x * y;
            sxx += x * x;
        });

        const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        const intercept = (sy - slope * sx) / n;
        return { slope, intercept };
    }

    function exponentialRegression(data, xField, yField) {
        const filtered = data.filter(d => d[yField] > 0);
        const n = filtered.length;

        let sx = 0, sy = 0, sxy = 0, sxx = 0;
        filtered.forEach(d => {
            const x = d[xField];
            const ly = Math.log(d[yField]);
            sx += x;
            sy += ly;
            sxy += x * ly;
            sxx += x * x;
        });

        const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        const A = (sy - b * sx) / n;
        const a = Math.exp(A);
        return { a, b };
    }

    function createScatterPlot(svgId, data, xField, yField, xLabel, yLabel) {
        const svg = d3.select(svgId);
        const width = svg.node().clientWidth - 150;
        const height = svg.node().clientHeight - 120;

        const group = svg.append("g").attr("transform", "translate(80,40)");

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[xField])])
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[yField])])
            .range([height, 0])
            .nice();

        group.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        group.append("g")
            .call(d3.axisLeft(yScale));

        group.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d[xField]))
            .attr("cy", d => yScale(d[yField]))
            .attr("r", 6)
            .attr("fill", "steelblue")
            .attr("opacity", 0.7);

        group.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .text(xLabel);

        group.append("text")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text(yLabel);
    }

    createScatterPlot(
        "#chart1",
        merged,
        "guns_registered",
        "incidents",
        "Guns Registered",
        "Gun Violence Incidents"
    );

    createScatterPlot(
        "#chart2",
        merged,
        "guns_per_capita",
        "incidents",
        "Guns per Capita",
        "Gun Violence Incidents"
    );
});
