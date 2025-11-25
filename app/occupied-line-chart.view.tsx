"use client";

import React, { useEffect, useRef } from "react";

// AmCharts 5
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface IProps {
  data: { time: string | number | Date; occupiedCubicles: number }[];
  height?: number;
}

const OccupiedLineChart: React.FC<IProps> = ({ data = [], height = 350 }) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  // Convert data
  const seriesData = data.map((d: any) => {
    // const today = new Date();
    const { date } = d;
    // const [h, m, s] = time.split(":").map(Number);

    // const date = new Date(
    //   today.getFullYear(),
    //   today.getMonth(),
    //   today.getDate(),
    //   h,
    //   m,
    //   s
    // );

    return {
      date,
      occupied: Number(d.occupiedCubicles),
    };
  });

  // Initialize chart once
  useEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
      })
    );

    // Date Axis
    const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 50 });
    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
    });

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "minute", count: 1 },
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // Value Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Line Series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Occupied Cubicles",
        valueYField: "occupied",
        valueXField: "date",
        xAxis,
        yAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueX.formatDate('yyyy-MM-dd HH:mm')}: {valueY}",
        }),
      })
    );

    // Bullets
    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          strokeWidth: 1,
          stroke: am5.color(0xffffff),
        }),
      })
    );

    // Cursor
    chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "zoomX" }));

    // Scrollbar
    chart.set(
      "scrollbarX",
      am5.Scrollbar.new(root, { orientation: "horizontal" })
    );

    // Initial Data
    series.data.setAll(seriesData);

    series.appear(800);
    chart.appear(800, 100);

    return () => {
      root.dispose();
    };
  }, []);

  // Update chart when data changes
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const chart = root.container.children.getIndex(0) as any;
    if (!chart) return;

    const series = chart.series.getIndex(0);
    if (series) {
      series.data.setAll(seriesData);
    }
  }, [data]);

  return (
    <div style={{ width: "100%", height }}>
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default OccupiedLineChart;
