import { createAction, Property } from "@activepieces/pieces-framework";
import { lushaAuth } from "../../..";

export const enrichCompanies = createAction({
  name: 'enrich_companies',
  auth: lushaAuth,
  displayName: 'Enrich Companies',
  description: 'Enrich companies details using requestId and company IDs from search results',
  audience: 'both',
  aiMetadata: { description: 'Fetch full company profiles from Lusha for the companies returned by a prior Search Companies call, using that search step\'s requestId and the company IDs in its data. Use after Search Companies when you need detailed company records rather than just match candidates; it requires the raw search-results object and cannot enrich arbitrary company IDs. Read-only lookup and idempotent.', idempotent: true },
  props: {
    searchResults: Property.Json({
      displayName: 'Search Results',
      description: 'The results from the Search Companies step',
      required: true,
    }),
  },
  async run(context) {
    const searchResults = context.propsValue.searchResults as {
        requestId: string;
        data: Array<{ id: string }>;
    };

    const requestId = searchResults.requestId;
    const companyIds = searchResults.data.map(item => item.id);

    const payload = {
        requestId: requestId,
        companiesIds: companyIds
    };

    const response = await fetch('https://api.lusha.com/prospecting/company/enrich', {
      method: 'POST',
      headers: {
        'x-app': 'activepieces',
        'x-api-key': context.auth.secret_text,
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