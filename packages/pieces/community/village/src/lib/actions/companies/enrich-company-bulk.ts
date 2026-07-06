import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_IDENTIFIERS = 10;

type IdentifierType = 'domain' | 'linkedin_url' | 'url';

interface IdentifierRow {
  identifierType?: IdentifierType;
  identifierValue?: string;
}

export const enrichCompanyBulk = createAction({
  auth: villageAuth,
  name: 'enrich_company_bulk',
  displayName: 'Enrich Company (Bulk)',
  description:
    'Get detailed information for up to 10 companies in a single request. Each result contains either company data or an error.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only batch lookup of detailed firmographics for up to 10 companies, each identified by domain, LinkedIn URL, or generic url. Use when you already have multiple known companies; for one company use Enrich Company, and for criteria-based discovery use Search Companies. Per-row errors are returned for misses. Pure query, safe to retry.',
    idempotent: true,
  },
  props: {
    identifiers: Property.Array({
      displayName: 'Identifiers',
      description: 'Up to 10 companies to look up. Each row specifies an identifier type and value.',
      properties: {
        identifierType: Property.StaticDropdown({
          displayName: 'Identifier Type',
          required: true,
          options: {
            options: [
              { label: 'Domain', value: 'domain' },
              { label: 'LinkedIn URL', value: 'linkedin_url' },
              { label: 'URL (auto-detected)', value: 'url' },
            ],
          },
        }),
        identifierValue: Property.ShortText({
          displayName: 'Identifier Value',
          required: true,
        }),
      },
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const rows = (context.propsValue.identifiers ?? []) as IdentifierRow[];

    if (rows.length === 0) {
      throw new Error('At least one identifier is required');
    }
    if (rows.length > MAX_IDENTIFIERS) {
      throw new Error(`Maximum ${MAX_IDENTIFIERS} identifiers per bulk request`);
    }

    const identifiers = rows.map((row, index) => {
      if (!row.identifierType || !row.identifierValue) {
        throw new Error(
          `Identifier at index ${index} is missing identifierType or identifierValue`,
        );
      }
      return { [row.identifierType]: row.identifierValue };
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/enrich/bulk`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { identifiers },
    });
    return response.body;
  },
});
