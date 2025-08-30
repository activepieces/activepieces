import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listFormSubmissions = createAction({
  name: "list_form_submissions",
  displayName: "List Form Submissions",
  description: "Returns a list of verified form submissions across all forms for a specific site",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to list form submissions for",
      required: true,
    }),
    formId: Property.ShortText({
      displayName: "Form ID (Optional)",
      description: "The specific form ID to get submissions for. Leave empty for all forms.",
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: "Submission State",
      description: "Filter submissions by state",
      required: false,
      options: {
        options: [
          { label: "All Submissions", value: "all" },
          { label: "Verified Only", value: "verified" },
          { label: "Spam Only", value: "spam" },
        ],
      },
      defaultValue: "verified",
    }),
    page: Property.Number({
      displayName: "Page",
      description: "Page number for pagination (starts from 1)",
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: "Per Page",
      description: "Number of items per page (max 100)",
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { siteId, formId, state, page, perPage } = context.propsValue;

    let url: string;
    if (formId) {
      url = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;
    } else {
      url = `https://api.netlify.com/api/v1/sites/${siteId}/submissions`;
    }

    const queryParams = new URLSearchParams();
    if (state && state !== "all") {
      queryParams.append("state", state);
    }
    if (page) queryParams.append("page", page.toString());
    if (perPage) queryParams.append("per_page", Math.min(perPage, 100).toString());

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list form submissions: ${response.status} ${response.statusText}`);
  },
});
