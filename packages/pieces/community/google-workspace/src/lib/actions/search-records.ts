import { createAction, Property } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceClient } from '../common/client';
import { googleWorkspaceProps } from '../common/props';
import { googleWorkspaceUtils } from '../common/utils';
import { searchRecordsOutputSchema } from '../output-schemas';

import type { GoogleWorkspaceQuery } from '../common/types';

function queryableLabels(): string {
  return Object.values(googleWorkspaceUtils.resources)
    .filter((def) => def.supportsQuery)
    .map((def) => def.label)
    .join(', ');
}

const DEFAULT_MAX_ROWS = 500;
const HARD_MAX_ROWS = 10_000;

export const searchRecords = createAction({
  name: 'searchRecords',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'List records of one type with the Directory search syntax and pagination',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Google Workspace directory records of one type (users, groups, group members, organizational units, mobile or Chrome OS devices, role assignments), optionally filtered with the Directory search syntax (users, groups and devices only) or a domain (users and groups only). Returns one page with a next page token, or every page up to Max Rows. Read-only and safe to retry; use Get Record when the identifier is known.',
    idempotent: true,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: googleWorkspaceProps.resourceType({ verb: 'list' }),
    parent: googleWorkspaceProps.parent({ required: false }),
    query: Property.ShortText({
      displayName: 'Query',
      description: `Directory search syntax (only for ${queryableLabels()}). Examples: \`email:sales*\` · \`orgUnitPath=/Sales isSuspended=false\` · \`name:'Jane Doe'\` · \`manager='boss@example.com'\`. Leave empty to list everything.`,
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'Only users and groups: restrict to one domain of the account (default: every domain of the customer).',
      required: false,
    }),
    params: Property.Object({
      displayName: 'Extra Query Parameters',
      description: Object.values(googleWorkspaceUtils.resources)
        .filter((def) => def.extraListParams?.length)
        .map((def) => `**${def.label}**: ${def.extraListParams?.join(', ')}`)
        .join(' · '),
      required: false,
    }),
    fetchAllPages: Property.Checkbox({
      displayName: 'Fetch All Pages',
      description:
        'Follow the pagination until the list is exhausted (up to Max Rows). Off: return one page and its next page token.',
      required: false,
      defaultValue: false,
    }),
    maxRows: Property.Number({
      displayName: 'Max Rows',
      description: `With "Fetch All Pages": stop after this many records (default ${DEFAULT_MAX_ROWS}, at most ${HARD_MAX_ROWS}). Without it: the page size (Google caps it per collection); organizational units have no paging, so extra rows are dropped and Truncated is set.`,
      required: false,
      defaultValue: DEFAULT_MAX_ROWS,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description:
        'Only without "Fetch All Pages": the `nextPageToken` of a previous run to continue from.',
      required: false,
    }),
  },
  outputSchema: searchRecordsOutputSchema,
  async run(context) {
    const { resourceType, parent, query, domain, params, fetchAllPages, maxRows, pageToken } =
      context.propsValue;
    const def = googleWorkspaceUtils.resourceDefinition(resourceType);
    googleWorkspaceUtils.assertVerb({ def, verb: 'list' });

    if (query && !def.supportsQuery) {
      throw new Error(
        `${def.label} records cannot be filtered with a query; use the extra parameters (${
          def.extraListParams?.join(', ') ?? 'none'
        }) instead.`,
      );
    }
    if (domain && !def.supportsDomain) {
      throw new Error('The domain filter only applies to users and groups.');
    }

    const auth = await googleWorkspaceClient.resolveAuth(context.auth);
    const path = def.collectionPath(parent);
    const cap = Math.floor(
      Math.min(Math.max(Number(maxRows) || DEFAULT_MAX_ROWS, 1), HARD_MAX_ROWS),
    );
    const extraParams = googleWorkspaceUtils.stringValues(params);
    const baseQuery: GoogleWorkspaceQuery = {
      ...(def.supportsDomain && !domain && !extraParams['userKey']
        ? { customer: googleWorkspaceUtils.myCustomer }
        : {}),
      ...(domain ? { domain } : {}),
      ...(query ? { query } : {}),
      ...extraParams,
    };
    const pageSize = def.maxPageSize ? { maxResults: Math.min(cap, def.maxPageSize) } : {};

    if (fetchAllPages) {
      const { items, truncated } = await googleWorkspaceClient.listAll<Record<string, unknown>>({
        auth,
        path,
        itemsKey: def.itemsKey,
        query: { ...baseQuery, ...pageSize },
        maxRows: cap,
      });
      return { resourceType: def.type, items, count: items.length, truncated };
    }

    const page = await googleWorkspaceClient.listPage<Record<string, unknown>>({
      auth,
      path,
      itemsKey: def.itemsKey,
      query: {
        ...baseQuery,
        ...pageSize,
        pageToken: pageToken || undefined,
      },
    });
    const items = page.items.slice(0, cap);
    return {
      resourceType: def.type,
      items,
      count: items.length,
      nextPageToken: page.nextPageToken ?? null,
      truncated: items.length < page.items.length,
    };
  },
});
