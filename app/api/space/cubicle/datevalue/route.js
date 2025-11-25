import fs from "fs";
import path from "path";
import JSONStream from "JSONStream";
import moment from "moment";

export async function POST(req) {
  try {
    const { file, minOccupancy, qualifiedPercentage } = await req.json();

    const filePath = path.join(process.cwd(), "data", `${file}.json`);

    if (!fs.existsSync(filePath)) {
      return Response.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    const parser = JSONStream.parse("*");

    const stats = new Map();

    await new Promise((resolve, reject) => {
      stream
        .pipe(parser)
        .on("data", (dataObj) => {
          const cubicle = dataObj[0];
          const occupiedMinutes = dataObj[1];
          const ts = dataObj[7];

          const time = moment.unix(ts).format("YYYY-MM-DD 00:00:00");
          const occupied = occupiedMinutes > minOccupancy ? 100 : 0;

          if (!stats.has(time)) stats.set(time, new Map());

          const cubMap = stats.get(time);
          if (!cubMap.has(cubicle)) cubMap.set(cubicle, { sum: 0, count: 0 });

          const rec = cubMap.get(cubicle);
          rec.sum += occupied;
          rec.count++;
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const result = [];

    for (const [time, cubMap] of stats.entries()) {
      let occupiedCubicles = 0;

      for (const [, { sum, count }] of cubMap.entries()) {
        const avg = sum / count;

        if (avg > qualifiedPercentage) {
          occupiedCubicles++;
        }
      }
      const date = new Date(time);
      result.push({ date: date.getTime(), occupiedCubicles });
    }

    result.sort((a, b) => (a.time > b.time ? 1 : -1));

    return Response.json({
      success: true,
      totalTimes: result.length,
      data: result,
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
