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

    const timeStats = new Map();
    const dailyStats = new Map();

    await new Promise((resolve, reject) => {
      stream
        .pipe(parser)
        .on("data", (dataObj) => {
          const cubicle = dataObj[0];
          const occupiedMinutes = dataObj[1];
          const ts = dataObj[7];
          const occupied = occupiedMinutes > minOccupancy ? 100 : 0;

          const dateTime = moment.unix(ts).format("YYYY-MM-DD HH:mm:00");
          const [date, time] = dateTime.split(" ");

          // ---------- Time Stats ----------
          if (!timeStats.has(time)) timeStats.set(time, new Map());
          const cubTimeMap = timeStats.get(time);
          const recTime = cubTimeMap.get(cubicle) || { sum: 0, count: 0 };
          recTime.sum += occupied;
          recTime.count++;
          cubTimeMap.set(cubicle, recTime);

          // ---------- Daily Stats ----------
          if (!dailyStats.has(date)) dailyStats.set(date, new Map());
          const cubDailyMap = dailyStats.get(date);
          const recDaily = cubDailyMap.get(cubicle) || { sum: 0, count: 0 };
          recDaily.sum += occupied;
          recDaily.count++;
          cubDailyMap.set(cubicle, recDaily);
        })
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    // ---------- Prepare timeData ----------
    const today = new Date();
    const timeData = Array.from(timeStats.entries())
      .map(([time, cubMap]) => {
        let occupiedCubicles = 0;
        cubMap.forEach(({ sum, count }) => {
          if (sum / count > qualifiedPercentage) occupiedCubicles++;
        });

        const [h, m, s] = time.split(":").map(Number);
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          h,
          m,
          s
        );
        return { date: date.getTime(), occupiedCubicles };
      })
      .sort((a, b) => a.date - b.date);

    // ---------- Prepare dailyData ----------
    const dailyData = Array.from(dailyStats.entries())
      .map(([dateTime, cubMap]) => {
        let occupiedCubicles = 0;
        cubMap.forEach(({ sum, count }) => {
          if (sum / count > qualifiedPercentage) occupiedCubicles++;
        });
        const date = new Date(dateTime);
        return { date: date.getTime(), occupiedCubicles };
      })
      .sort((a, b) => a.date - b.date);

    return Response.json({ success: true, timeData, dailyData });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
