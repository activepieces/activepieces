import { createAction, Property } from "@activepieces/pieces-framework";
import ffmpeg from "fluent-ffmpeg";
import { File } from "@activepieces/shared";
import fs from "fs";
import os from "os";
import path from "path";

export const trimVideo = createAction({
  name: "trim_video",
  displayName: "Trim Video",
  description: "Cut a specific portion of a video",
  props: {
    inputFile: Property.File({
      displayName: "Video File",
      required: true,
    }),
    start: Property.Number({
      displayName: "Start time (seconds)",
      required: true,
    }),
    duration: Property.Number({
      displayName: "Duration (seconds)",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;

    const inputFile = p["inputFile"] as File;
    const start = p["start"];
    const duration = p["duration"];

    const raw = inputFile.data as any;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const tmpIn = path.join(os.tmpdir(), `in-${Date.now()}.mp4`);
    const tmpOut = path.join(os.tmpdir(), `out-${Date.now()}.mp4`);

    await fs.promises.writeFile(tmpIn, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .setStartTime(start)
        .setDuration(duration)
        .output(tmpOut)
        .on("end", () => resolve())
        .on("error", (err: any) => reject(err))
        .run();
    });

    const output = await fs.promises.readFile(tmpOut);

    return {
      success: true,
      outputFile: {
        data: output.toString("base64"),
        extension: "mp4",
        type: "video/mp4",
      },
    };
  },
});
