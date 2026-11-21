import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_ENRICH_MODE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

const MAX_IDENTIFIERS = 10;

function toIdentifierType(value: string | undefined): IdentifierType | undefined {
  return IDENTIFIER_TYPES.find((type) => type === value);
}

const IDENTIFIER_TYPES: IdentifierType[] = ['domain', 'linkedin_url', 'url'];

type IdentifierType = 'domain' | 'linkedin_url' | 'url';

interface IdentifierRow {
  identifierType?: IdentifierType;
  identifierValue?: string;
}

export const enrichCompanyBulk = createAction({
  auth: villageAuth,
  name: 'enrich_company_bulk',
  classification: 'READ',
  displayName: 'Enrich Company (Bulk)',
  description:
    'Get detailed information for up to 10 companies in a single request. Each result contains either company data or an error.',
  audience: 'human',
  aiMetadata: {
    description:
      'Read-only batch lookup of detailed firmographics for up to 10 companies, each identified by domain, LinkedIn URL, or generic url. Use when you already have multiple known companies; for one company use Enrich Company, and for criteria-based discovery use Search Companies. Per-row errors are returned for misses. Pure query, safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.enrichCompanyBulk,
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
    mode: Property.StaticDropdown({
      displayName: 'Cache Mode',
      description:
        'cached_first (default) charges credits only when Village has to fetch live data; cached_only never charges and returns per-item not found on a cache miss; realtime_only always fetches live and charges when found.',
      required: false,
      options: { options: VILLAGE_ENRICH_MODE_OPTIONS },
    }),
  },
  async run(context) {
    const rows: IdentifierRow[] = villageApi.objectRows(context.propsValue.identifiers).map((row) => ({
      identifierType: toIdentifierType(villageApi.rowText({ row, key: 'identifierType' })),
      identifierValue: villageApi.rowText({ row, key: 'identifierValue' }),
    }));

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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/companies/enrich/bulk`,
      body: context.propsValue.mode ? { identifiers, mode: context.propsValue.mode } : { identifiers },
    });
    return response;
  },
});
