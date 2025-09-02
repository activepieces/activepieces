import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth, browserlessCommon } from '../common';

export const captureScreenshot = createAction({
  auth: browserlessAuth,
  name: 'captureScreenshot',
  displayName: 'Capture a Screenshot',
  description: 'Take a screenshot of a page.',
  props: browserlessCommon.captureScreenshotProperties,
  async run({ auth: token, propsValue }) {
    propsValidation.validateZod(
      propsValue,
      browserlessCommon.captureScreenshotSchema
    );
    if (!propsValue.url && !propsValue.html) {
      throw new Error('Either url or html must be provided');
    }
    const {
      optimizeForSpeed,
      type,
      fromSurface,
      fullPage,
      omitBackground,
      path,
      clip,
      encoding,
      captureBeyondViewport,
    } = propsValue;

    const options = {
      optimizeForSpeed,
      type: type ? (type as 'jpeg' | 'png' | 'webp') : undefined,
      fromSurface,
      fullPage,
      omitBackground,
      path,
      clip: clip as {
        width: number;
        height: number;
        x: number;
        y: number;
        scale?: number;
      },
      encoding: encoding as 'base64' | 'binary',
      captureBeyondViewport,
    };
    return await browserlessCommon.captureScreenshot({
      token,
      body: {
        options,
        ...propsValue,
        addScriptTag: propsValue.addScriptTag?.map((item: unknown) => {
          // Cast or map each item to the expected type
          return item as {
            url?: string;
            path?: string;
            content?: string;
            type?: string;
            id?: string;
          };
        }),
      },
    });
  },
});
