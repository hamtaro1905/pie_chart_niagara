define([
    "baja!",
    "bajaux/mixin/responsiveMixIn",
    "bajaux/util/SaveCommand",
    "jquery",
    "Promise",
    "bajaux/Widget",
    "d3",
    "css!nmodule/myFirstModule/rc/myFirstModule"
], function (
    baja,
    responsiveMixIn,
    SaveCommand,
    $,
    Promise,
    Widget,
    d3
) {

    "use strict";

    var DonutChart = function () {
        Widget.apply(this, arguments);

        this.properties().addAll([
            { name: "mColor", value: "red", typeSpec: "gx:Color" },
            { name: "TextColor", value: "black", typeSpec: "gx:Color" },
            { name: "Strokes", value: "black", typeSpec: "gx:Color" },
            { name: "color1", value: "steelblue", typeSpec: "gx:Color" },
            { name: "color2", value: "blue", typeSpec: "gx:Color" },
            { name: "color3", value: "pink", typeSpec: "gx:Color" },
            { name: "color4", value: "orange", typeSpec: "gx:Color" },
            { name: "value1", value: "null", typeSpec: "baja:Ord" },
            { name: "value2", value: "null", typeSpec: "baja:Ord" },
            { name: "value3", value: "null", typeSpec: "baja:Ord" },
            { name: "value4", value: "null", typeSpec: "baja:Ord" },
            { name: "WidthStrokes", value: "1", typeSpec: "baja:Format" },
            { name: "Units", value: "", typeSpec: "baja:Format" }
        ]);
    };

    DonutChart.prototype = Object.create(Widget.prototype);
    DonutChart.prototype.constructor = DonutChart;

    DonutChart.prototype.doInitialize = function (element) {
        var self = this;
        element[0].style.overflow = "hidden";
        element[0].parentElement.parentElement.style.backgroundColor = "transparent";

        // Properties
        var Strokes = this.properties().getValue("Strokes");
        var TextColor = this.properties().getValue("TextColor");
        var WidthStrokes = this.properties().getValue("WidthStrokes");
        var Units = this.properties().getValue("Units");
        var mColor = this.properties().getValue("mColor");

        // Collect colors & ords
        var colors = [];
        var ords = [];
        this.properties().each((i, name, value) => {
            if (name.startsWith("color")) colors.push(value);
            if (name.startsWith("value") && value !== "null") ords.push(value);
        });

        // Default mock data (โชว์ก่อน bind point)
        var data = [10, 20, 30, 40];

        console.log("ORDS:", ords);

        // SVG setup
        var width = 400,
            height = 400,
            margin = 50;

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
            .innerRadius(radius - 50)   // ความหนาของโดนัท
            .outerRadius(radius);

        // Draw function
        var draw = function () {
            console.log("DRAW DATA:", data);

            svg.selectAll("*").remove();

            var data_ready = pie(data);

            // Draw slices
            svg.selectAll("path")
                .data(data_ready)
                .enter()
                .append("path")
                .attr("d", arc)
                .style("fill", function (d, i) { return color(i); })
                .style("stroke", Strokes)
                .style("stroke-width", WidthStrokes)
                .style("opacity", 0.8)
                .on("mouseover", function () {
                    d3.select(this).style("stroke", mColor).style("stroke-width", 2);
                })
                .on("mouseout", function () {
                    d3.select(this).style("stroke", Strokes).style("stroke-width", WidthStrokes);
                });

            // Add labels
            svg.selectAll("text")
                .data(data_ready)
                .enter()
                .append("text")
                .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("text-anchor", "middle")
                .text(function (d) { return d.data + Units; })
                .style("fill", TextColor)
                .style("font-size", "14px")
                .style("font-weight", "bold");
        };

        // Subscribe to points
        if (ords.length > 0) {
            var sub = new baja.Subscriber();

            sub.attach("changed", function (prop) {
                if (prop.getName() === "out") {
                    data = ords.map(function (ord) {
                        try {
                            var val = ord.getOut().getValue();
                            return parseFloat(val.toString()) || 0;
                        } catch (e) {
                            console.warn("Parse error:", e);
                            return 0;
                        }
                    });
                    draw();
                }
            });

            baja.BatchResolve.resolve({ ords: ords, subscriber: sub })
                .then(function (batch) {
                    data = batch.map(function (ord) {
                        try {
                            var val = ord.getOut().getValue();
                            return parseFloat(val.toString()) || 0;
                        } catch (e) {
                            console.warn("Parse error:", e);
                            return 0;
                        }
                    });
                    draw();
                });
        } else {
            // ถ้าไม่มีการ bind point → ใช้ค่า default
            draw();
        }
    };

    return DonutChart;
});
