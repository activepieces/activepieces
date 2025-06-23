import { createAction, Property } from "@activepieces/pieces-framework";

export const searchCompanies = createAction({
  name: 'search_companies',
  displayName: 'Search Companies',
  description: 'Search for companies with filters and pagination',
  props: {
    resultLimit: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of companies to return. The maximum is 10000 results.',
      required: true,
      defaultValue: 10000
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
    const { resultLimit, requestBody } = context.propsValue;
    
    if (resultLimit > 10000)
      throw new Error(`The maximum of result is 10000`);

    // the maximum number of result is 10000
    let allResults: any[] = []
    let currentPage = 0
    let hasMorePages = true
    
    while (hasMorePages && allResults.length < resultLimit) {
      const payload = {
        ...requestBody,
        pages: {
          page: currentPage,
          size: 40 // the maximum for the Lusha API
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
      
      const responseData = await response.json();

      if (!responseData.data || responseData.data.length === 0) {
        hasMorePages = false;
      } else {
        const remainingNeeded = resultLimit - allResults.length;
        if (remainingNeeded < 40) {
          allResults = allResults.concat(responseData.data.slice(0, remainingNeeded));
        } else {
          allResults = allResults.concat(responseData.data);
        }
      }
      
      currentPage++;
    }
    
    return allResults;
  }
});
