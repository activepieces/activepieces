import { createAction, Property } from "@activepieces/pieces-framework";

export const searchCompanies = createAction({
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Search for companies with filters and pagination',
  props: {
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination',
      required: true,
      defaultValue: 1
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page',
      required: true,
      defaultValue: 10
    }),
    requestBody: Property.Json({
      displayName: 'Request Body',
      description: 'The JSON body for the search request. Do not include pagination (pages), it will be added automatically.',
      required: true,
      defaultValue: {
        "filters": {
          "contacts": {
            "include": {
              "countries": ["ES"]
            }
          },
          "companies": {
            "include": {
              "sizes": [
                {
                  "max": 50,
                  "min": 11
                }
              ],
              "locations": [
                {
                  "country": "Spain"
                }
              ],
              "mainIndustriesIds": [17, 14]
            }
          }
        }
      }
    })
  },
  async run(context) {
    const { page, pageSize, requestBody } = context.propsValue;

    const payload = {
      ...requestBody,
      pages: {
        page: page,
        size: pageSize
      }
    };

    const response = await fetch('https://api.lusha.com/prospecting/company/search', {
      method: 'POST',
      headers: {
        'x-app': 'activepieces',
        'x-api-key': context.auth as string,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    return await response.json();
  }
});
