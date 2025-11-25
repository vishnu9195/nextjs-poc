"use client";

import { useEffect, useState } from "react";
import OccupiedLineChart from "./occupied-line-chart.view";

interface Product {
  time: string;
  occupiedCubicles: number;
}

const Page: React.FC = () => {
  const [data, setData] = useState<Product[]>([]);
  const [graph2Data, setGraph2Data] = useState<Product[]>([]);
  const file1 = "cubicle_1";
  const [qualifiedPercentage, setQualifiedPercentage] = useState<Number>(10);
  const [minOccupancy, setMinOccupancy] = useState<Number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getProducts = async (
    api: string,
    file: string,
    qualifiedPercentage: Number,
    minOccupancy: Number
  ) => {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        file,
        qualifiedPercentage,
        minOccupancy,
      }),
    });

    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
  };

  const getData = async () => {
    setIsLoading(true);
    const start = performance.now(); // start time
    const [res1] = await Promise.all([
      getProducts(
        "/api/space/cubicle",
        file1,
        qualifiedPercentage,
        minOccupancy
      ),
    ]);
    const { timeData, dailyData } = res1;
    setData(timeData);
    setGraph2Data(dailyData);
    const end = performance.now(); // end time
    const timeInSeconds = ((end - start) / 1000).toFixed(2);

    console.log(`⏱ API Time: ${timeInSeconds} seconds`);
  };

  useEffect(() => {
    console.log("" + minOccupancy + "----------------" + qualifiedPercentage);
    getData();
  }, [qualifiedPercentage, minOccupancy]);

  return (
    <main style={{ padding: "20px", fontFamily: "Arial" }}>
      {isLoading && <div>Loading data</div>}
      <OccupiedLineChart data={data} height={350} />
      <OccupiedLineChart data={graph2Data} height={350} />
    </main>
  );
};

export default Page;
