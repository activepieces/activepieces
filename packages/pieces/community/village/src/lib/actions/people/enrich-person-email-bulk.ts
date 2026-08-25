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

export const enrichPersonEmailBulk = createAction({
  auth: villageAuth,
  name: 'enrich_person_email_bulk',
  displayName: 'Enrich Person Email (Bulk)',
  description:
    'Find email addresses for up to 10 people in a single request. Returns email addresses where found, with error messages for failed lookups.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only batch lookup of email addresses for up to 10 people, each identified by a LinkedIn URL or generic URL. Use specifically when you need contact emails; for general profile attributes use Enrich Person. Per-row errors are returned for misses rather than failing the whole call. Pure query, safe to retry.',
    idempotent: true,
  },
  props: {
    identifiers: Property.Array({
      displayName: 'Identifiers',
      description: 'Up to 10 people to look up emails for. Each row is one person.',
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
      url: `${VILLAGE_API_BASE_URL}/v2/people/enrich/emails/bulk`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
