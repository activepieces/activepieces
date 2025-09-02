import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth, browserlessCommon } from '../common';
import { PaperFormats } from '../common/types';

export const generatePdf = createAction({
  auth: browserlessAuth,
  name: 'generatePdf',
  displayName: 'Generate PDF',
  description: 'Retrieves the raw HTML markup of a web page.',
  props: browserlessCommon.generatePdfProperties,
  async run({ auth: token, propsValue }) {
    propsValidation.validateZod(
      propsValue,
      browserlessCommon.generatePdfSchema
    );
    const {
      scale,
      displayHeaderFooter,
      headerTemplate,
      footerTemplate,
      printBackground,
      landscape,
      pageRanges,
      format,
      width,
      height,
      waitForFonts,
    } = propsValue;
    const options = {
      scale,
      displayHeaderFooter,
      headerTemplate,
      footerTemplate,
      printBackground,
      landscape,
      pageRanges,
      format: format as PaperFormats | undefined,
      width,
      height,
      waitForFonts,
    };
    return await browserlessCommon.generatePdf({
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
