import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_BULK_IDENTIFIERS = 10;
const IDENTIFIER_TYPE_LINKEDIN = 'linkedin_url';
const IDENTIFIER_TYPE_URL = 'url';

type IdentifierRow = {
  identifierType?: string;
  identifierValue?: string;
};

export const enrichPersonBulk = createAction({
  auth: villageAuth,
  name: 'enrich_person_bulk',
  displayName: 'Enrich Person (Bulk)',
  description:
    'Get detailed profile information for up to 10 people in a single request. Partial results are returned if some lookups fail — check each result for success or error status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve detailed profiles for up to 10 people in one call, each identified by a LinkedIn URL or generic URL. Read-only and idempotent; partial results are returned with per-person success or error status when some lookups fail. Use for full profile enrichment; use Enrich Person Email when only an email address is needed.',
    idempotent: true,
  },
  props: {
    identifiers: Property.Array({
      displayName: 'Identifiers',
      description: 'Up to 10 people to enrich. Each row is one person.',
      required: true,
      defaultValue: [],
      properties: {
        identifierType: Property.StaticDropdown({
          displayName: 'Identifier Type',
          required: true,
          options: {
            options: [
              { label: 'LinkedIn URL', value: IDENTIFIER_TYPE_LINKEDIN },
              { label: 'URL (auto-detected)', value: IDENTIFIER_TYPE_URL },
            ],
          },
        }),
        identifierValue: Property.ShortText({
          displayName: 'Identifier Value',
          description:
            'For LinkedIn URL: a LinkedIn person URL. For URL: any URL to auto-detect.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { identifiers } = context.propsValue;

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      throw new Error('At least one identifier is required.');
    }
    if (identifiers.length > MAX_BULK_IDENTIFIERS) {
      throw new Error(`Maximum ${MAX_BULK_IDENTIFIERS} identifiers per bulk request.`);
    }

    const rows = identifiers as IdentifierRow[];
    const body = {
      identifiers: rows.map((row, index) => {
        if (!row?.identifierType || !row?.identifierValue) {
          throw new Error(
            `Identifier at index ${index} is missing identifierType or identifierValue.`,
          );
        }
        return { [row.identifierType]: row.identifierValue };
      }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/enrich/bulk`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
