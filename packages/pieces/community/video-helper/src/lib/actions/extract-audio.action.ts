import { createAction, Property } from "@activepieces/pieces-framework";
import ffmpeg from "fluent-ffmpeg";
import { File } from "@activepieces/shared";
import fs from "fs";
import os from "os";
import path from "path";

export const extractAudio = createAction({
  name: "extract_audio",
  displayName: "Extract Audio",
  description: "Extract the audio track from a video file.",
  props: {
    inputFile: Property.File({
      displayName: "Video File",
      required: true,
    }),
  },

  async run(context) {
    const p = context.propsValue as any;
    const inputFile = p["inputFile"] as File;

    const raw = inputFile.data as any;
    const buffer =
      typeof raw === "string" ? Buffer.from(raw, "base64") : Buffer.from(raw);

    const tmpIn = path.join(os.tmpdir(), `in-${Date.now()}.mp4`);
    const tmpOut = path.join(os.tmpdir(), `out-${Date.now()}.mp3`);

    await fs.promises.writeFile(tmpIn, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .noVideo()
        .audioCodec("libmp3lame")
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
        extension: "mp3",
        type: "audio/mpeg",
      },
    };
  },
});
