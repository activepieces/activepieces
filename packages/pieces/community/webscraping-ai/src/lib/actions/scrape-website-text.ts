import { createAction, Property } from '@activepieces/pieces-framework';
import { WebScrapingAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const scrapeWebsiteText = createAction({
  auth: WebScrapingAuth,
  name: "scrape_website_text",
  displayName: "Scrape Website Text",
  description: "Extract visible text from a webpage.",
  props: {
    url: Property.ShortText({
      displayName: "Page URL",
      required: true,
    }),
  },
   async run({ auth, propsValue }) {
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        "/text",
        { url: propsValue.url }
      );

      return {
        success: true,
        text: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message ?? error}`,
        details: error.response ?? error,
        request: {
          url: propsValue.url,
        },
      };
    }
  },
});