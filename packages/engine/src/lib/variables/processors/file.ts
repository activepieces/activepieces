import { ApFile } from "@activepieces/pieces-framework";
import { isNil, isString } from "@activepieces/shared";
import isBase64 from "is-base64";
import { handleAPFile } from "packages/engine/src/lib/services/files.service";
import { ProcessorFn } from "packages/engine/src/lib/variables/processors";

export const fileProcessor = ({ apiUrl, engineToken }: { apiUrl: string, engineToken: string }): ProcessorFn => async (_property, urlOrBase64) => {
  // convertUrlOrBase64ToFile
  if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
    return null;
  }
  // Get the file from the URL
  try {
    // Check if the string is a Base64 string
    if (isBase64(urlOrBase64, { allowMime: true })) {
      const matches = urlOrBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/); // example match: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC
      let base64 = urlOrBase64;

      if (matches && matches?.length === 3) {
        base64 = matches[2];

        return new ApFile(
          'unknown.bin',
          Buffer.from(base64, 'base64'),
        );
      }
    }

    return await handleAPFile({
      apiUrl: apiUrl,
      path: urlOrBase64.trim(),
      engineToken: engineToken,
    })
  } catch (e) {
    console.error(e);
    return null;
  }
}