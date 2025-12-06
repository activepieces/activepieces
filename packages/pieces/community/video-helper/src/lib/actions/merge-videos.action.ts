import { createAction, Property } from "@activepieces/pieces-framework";
import ffmpeg from "fluent-ffmpeg";
import { File } from "@activepieces/shared";
import fs from "fs";
import os from "os";
import path from "path";

export const mergeVideos = createAction({
  name: "merge_videos",
  displayName: "Merge Videos",
  description: "Merge multiple MP4 videos into one.",
  props: {
    videos: Property.Array({
      displayName: "Video Files",
      required: true,
      properties: {
        file: Property.File({ displayName: "File", required: true }),
      },
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const inputFiles = p["videos"] as any[];

    // create tmp list.txt
    const listFile = path.join(os.tmpdir(), `list-${Date.now()}.txt`);
    let listContent = "";

    const tmpFiles: string[] = [];

    for (const item of inputFiles) {
      const f = item["file"];
      const raw = f.data;
      const buffer =
        typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

      const tmp = path.join(os.tmpdir(), `part-${Date.now()}-${Math.random()}.mp4`);
      tmpFiles.push(tmp);

      await fs.promises.writeFile(tmp, buffer);
      listContent += `file '${tmp}'\n`;
    }

    await fs.promises.writeFile(listFile, listContent);

    const out = path.join(os.tmpdir(), `merged-${Date.now()}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .output(out)
        .on("end", () => resolve())
        .on("error", (err: any) => reject(err))
        .run();
    });

    const output = await fs.promises.readFile(out);

    return {
      success: true,
      outputFile: {
        data: output.toString("base64"),
        type: "video/mp4",
        extension: "mp4",
      },
    };
  },
});
