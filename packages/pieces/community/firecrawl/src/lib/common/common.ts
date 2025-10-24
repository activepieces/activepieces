
import {
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';

export const forScreenshotOutputFormat = (screenshotOptions: any): any => {
  let fullPage = true;

  if (screenshotOptions['fullPage'] === false) {
    fullPage = false;
  }

  return {
    type: 'screenshot',
    fullPage: fullPage,
  };
}

export const forSimpleOutputFormat = (format: string): string => {
  return format;
}

export async function downloadAndSaveScreenshot(result: any, context: any): Promise<void> {
  const screenshotUrl = result.data.screenshot;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: screenshotUrl,
    responseType: 'arraybuffer'
  });

  const fileName = `screenshot-${Date.now()}.png`;

  const fileUrl = await context.files.write({
    fileName: fileName,
    data: Buffer.from(response.body),
  });

  // replace the screenshot url with the saved file info
  result.data.screenshot = {
    fileName: fileName,
    fileUrl: fileUrl,
  };
}