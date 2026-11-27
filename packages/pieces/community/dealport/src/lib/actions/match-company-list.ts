import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import { dealportRequest } from '../common/client';

export const matchCompanyListAction = createAction({
  auth: dealportAuth,
  name: 'match-company-list',
  displayName: 'Match Company List ($0.00)',
  description:
    'Match a CSV or JSON list of company names and domains against 28M+ US private company Records for free ($0.00).',
  props: {
    csv: Property.LongText({
      displayName: 'CSV Text',
      description:
        'Raw CSV string with header row (name,domain,city,state). Provide either CSV Text or Items JSON.',
      required: false,
    }),
    items_json: Property.LongText({
      displayName: 'Items JSON',
      description:
        'JSON array of up to 250 objects ({name, domain, city, state, external_id}).',
      required: false,
    }),
  },
  async run(context) {
    const csv = context.propsValue.csv?.trim();
    const itemsJson = context.propsValue.items_json?.trim();
    if (!csv && !itemsJson) {
      throw new Error('Provide either CSV Text or Items JSON.');
    }

    let items: Record<string, unknown>[] | undefined;
    if (itemsJson) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(itemsJson);
      } catch {
        throw new Error('Items JSON must be valid JSON.');
      }
      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        parsed.length > 250 ||
        !parsed.every(
          (entry) =>
            typeof entry === 'object' && entry !== null && !Array.isArray(entry)
        )
      ) {
        throw new Error(
          'Items JSON must be a non-empty JSON array of 1 to 250 company objects.'
        );
      }
      items = parsed as Record<string, unknown>[];
    }

    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/companies/match',
      body: {
        csv,
        items,
        watch: false,
      },
    });
  },
});
