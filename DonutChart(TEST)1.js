define([
    "baja!",
    "bajaux/Widget",
    "d3"
], function (
    baja,
    Widget,
    d3
) {

    "use strict";

    var PieDonutChart = function () {
        Widget.apply(this, arguments);

        this.properties().addAll([
            { name: "ChartType", value: "pie", typeSpec: "baja:String" }, // "pie" หรือ "donut"
            { name: "Strokes", value: "black", typeSpec: "gx:Color" },
            { name: "TextColor", value: "black", typeSpec: "gx:Color" },
            { name: "mColor", value: "red", typeSpec: "gx:Color" },
            { name: "WidthStrokes", value: "1", typeSpec: "baja:Format" },
            { name: "Units", value: "", typeSpec: "baja:Format" },
            { name: "color1", value: "steelblue", typeSpec: "gx:Color" },
            { name: "color2", value: "blue", typeSpec: "gx:Color" },
            { name: "color3", value: "pink", typeSpec: "gx:Color" },
            { name: "color4", value: "orange", typeSpec: "gx:Color" },
            { name: "value1", value: "null", typeSpec: "baja:Ord" },
            { name: "value2", value: "null", typeSpec: "baja:Ord" },
            { name: "value3", value: "null", typeSpec: "baja:Ord" },
            { name: "value4", value: "null", typeSpec: "baja:Ord" }
        ]);
    };

    PieDonutChart.prototype = Object.create(Widget.prototype);
    PieDonutChart.prototype.constructor = PieDonutChart;

    PieDonutChart.prototype.doInitialize = function (element) {
        element[0].style.overflow = "hidden";
        element[0].parentElement.parentElement.style.backgroundColor = "transparent";

        // Properties
        var Strokes = this.properties().getValue("Strokes");
        var TextColor = this.properties().getValue("TextColor");
        var WidthStrokes = this.properties().getValue("WidthStrokes");
        var Units = this.properties().getValue("Units");
        var mColor = this.properties().getValue("mColor");
        var ChartType = this.properties().getValue("ChartType");

        // Collect colors & ords
        var colors = [];
        var ords = [];
        this.properties().each((i, name, value) => {
            if (name.startsWith("color")) colors.push(value);
            if (name.startsWith("value") && value !== "null") ords.push(value);
        });

        var data = [10, 20, 30, 40]; // default

        // SVG setup
        var width = 400, height = 400, margin = 50;
        var radius = Math.min(width, height) / 2 - margin;

        var svg = d3.select(element[0])
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 400 400")
            .classed("svg-content", true)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var color = d3.scaleOrdinal(colors);
        var pie = d3.pie().value(function (d) { return d; });
        var arc = d3.arc()
            .innerRadius(ChartType === "donut" ? radius - 50 : 0)
            .outerRadius(radius);

        // ----------- [แก้ใหม่: ใช้ join pattern แทนการลบ svg] -----------
        var draw = function () {
            var data_ready = pie(data);

            // JOIN
            var u = svg.selectAll("path")
                .data(data_ready);

            // ENTER + UPDATE
            u.enter()
                .append("path")
                .merge(u)
                .transition()
                .duration(500)
                .attr("d", arc)
                .style("fill", function (d, i) { return color(i); })
                .style("stroke", Strokes)
                .style("stroke-width", WidthStrokes)
                .style("opacity", 0.8);

            // EXIT
            u.exit().remove();

            // Labels
            var t = svg.selectAll("text")
                .data(data_ready);

            t.enter()
                .append("text")
                .merge(t)
                .transition()
                .duration(500)
                .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("text-anchor", "middle")
                .text(function (d) { return d.data + Units; })
                .style("fill", TextColor)
                .style("font-size", "14px")
                .style("font-weight", "bold");

            t.exit().remove();
        };
        // -----------------------------------------------------------------

        // Subscribe to Niagara points
        if (ords.length > 0) {
            var sub = new baja.Subscriber();

            sub.attach("changed", function (prop) {
                if (prop.getName() === "out") {
                    data = ords.map(function (ord) {
                        try {
                            var v = ord.getOut().getValueDisplay();
                            return isNaN(parseFloat(v)) ? 0 : parseFloat(v); // [แก้: ถ้า null/NaN ให้เป็น 0]
                        } catch (e) {
                            return 0;
                        }
                    });
                    draw();
                }
            });

            baja.BatchResolve.resolve({ ords: ords, subscriber: sub })
                .then(function (batch) {
                    var tmp = [];
                    batch.each(function () {
                        try {
                            var v = this.getOut().getValueDisplay();
                            tmp.push(isNaN(parseFloat(v)) ? 0 : parseFloat(v)); // [แก้เหมือนกัน]
                        } catch (e) {
                            tmp.push(0);
                        }
                    });
                    data = tmp;
                    draw();
                });
        } else {
            draw();
        }
    };

    return PieDonutChart;
});
