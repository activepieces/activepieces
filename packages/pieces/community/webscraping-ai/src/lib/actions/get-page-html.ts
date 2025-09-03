import { createAction, Property } from "@activepieces/pieces-framework";
import { WebScrapingAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";

export const getPageHtml = createAction({
  auth: WebScrapingAuth,
  name: "get_page_html",
  displayName: "Get Page HTML",
  description: "Fetch the raw HTML of a web page.",
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
        "/html",
        { url: propsValue.url }
      );

      return {
        success: true,
        html: response,
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
