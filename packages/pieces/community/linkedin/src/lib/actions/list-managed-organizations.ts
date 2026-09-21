import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  buildLinkedinError,
  encodeUrn,
  linkedinCommon,
  linkedinRawGet,
  organizationIdOf,
} from '../common';
import { linkedinAuth } from '../..';
import { listManagedOrganizationsActionOutputSchema } from '../output-schemas';

const ACL_PAGE_SIZE = 100;
const ACL_MAX_PAGES = 20;
const LOOKUP_CHUNK_SIZE = 50;

const readAclOrganizationUrn = (element: AclElement): string | null =>
  element.organizationTarget ??
  element.organization ??
  element.organizationalTarget ??
  null;

const hasNextLink = (paging: AclPaging | undefined): boolean | null => {
  if (paging === undefined || !Array.isArray(paging.links)) {
    return null;
  }
  return paging.links.some((link) => link.rel === 'next');
};

const chunk = <T>(values: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const fetchAllAclElements = async ({
  accessToken,
}: {
  accessToken: string;
}): Promise<AclElement[]> => {
  const collected: AclElement[] = [];
  let start = 0;

  for (let page = 0; page < ACL_MAX_PAGES; page++) {
    const response = await httpClient.sendRequest<AclResponse>({
      method: HttpMethod.GET,
      url: `${linkedinCommon.baseUrl}/rest/organizationAcls`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      headers: { ...linkedinCommon.linkedinHeaders },
      queryParams: {
        q: 'roleAssignee',
        role: 'ADMINISTRATOR',
        state: 'APPROVED',
        start: String(start),
        count: String(ACL_PAGE_SIZE),
      },
    });

    const elements = response.body.elements ?? [];
    collected.push(...elements);

    if (elements.length === 0) {
      break;
    }
    const next = hasNextLink(response.body.paging);
    if (next === false) {
      break;
    }
    if (next === null && elements.length < ACL_PAGE_SIZE) {
      break;
    }
    start += elements.length;
  }

  return collected;
};

export const listManagedOrganizations = createAction({
  auth: linkedinAuth,
  name: 'list_managed_organizations',
  classification: 'SEARCH',
  displayName: 'List Managed Organizations',
  description:
    'List the LinkedIn organization pages the connected member administers',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists every LinkedIn company page on which the connected member holds an approved administrator role, with each page's organization id, URN, vanity name, website and the member's role on it. Use it to discover or audit which company pages an account manages; no other action in this piece consumes the organization id yet. Safe to retry; read-only.",
    idempotent: true,
  },
  props: {},
  outputSchema: listManagedOrganizationsActionOutputSchema,

  run: async (context) => {
    const accessToken = context.auth.access_token;
    try {
      const elements = await fetchAllAclElements({ accessToken });
      const seen = new Set<string>();
      const rows = elements
        .map((element) => ({
          organization_urn: readAclOrganizationUrn(element),
          role: element.role ?? null,
          state: element.state ?? null,
        }))
        .filter((row) => {
          if (row.organization_urn === null || seen.has(row.organization_urn)) {
            return false;
          }
          seen.add(row.organization_urn);
          return true;
        });

      if (elements.length > 0 && rows.length === 0) {
        throw new Error(
          `LinkedIn returned ${elements.length} organization role assignment(s) but none carried a recognised organization URN, so no organization id could be resolved. The keys present on the first entry were: ${Object.keys(
            elements[0]
          ).join(', ')}. This is an API shape change, not an empty account.`
        );
      }

      if (rows.length === 0) {
        return { organizations: [], count: 0 };
      }

      const ids = rows.map((row) => organizationIdOf(String(row.organization_urn)));
      const results: OrganizationLookupResults = {};
      for (const idChunk of chunk(ids, LOOKUP_CHUNK_SIZE)) {
        const lookup = await linkedinRawGet<OrganizationLookupResponse>({
          accessToken,
          resource: 'the names of the administered organizations',
          url: `${linkedinCommon.baseUrl}/rest/organizations?ids=List(${idChunk
            .map((id) => encodeUrn(id))
            .join(',')})`,
        });
        Object.assign(results, lookup.results ?? {});
      }

      const organizations = rows.map((row) => {
        const id = organizationIdOf(String(row.organization_urn));
        const organization = results[id];
        return {
          organization_urn: row.organization_urn,
          organization_id: id,
          name: organization?.localizedName ?? null,
          vanity_name: organization?.vanityName ?? null,
          website: organization?.localizedWebsite ?? null,
          role: row.role,
          state: row.state,
        };
      });

      return { organizations, count: organizations.length };
    } catch (error) {
      throw buildLinkedinError({
        error,
        resource: 'the organizations administered by this account',
      });
    }
  },
});

interface AclElement {
  role?: string;
  state?: string;
  organization?: string;
  organizationTarget?: string;
  organizationalTarget?: string;
}

interface AclPaging {
  links?: { rel?: string }[];
}

interface AclResponse {
  elements?: AclElement[];
  paging?: AclPaging;
}

type OrganizationLookupResults = Record<
  string,
  {
    localizedName?: string;
    vanityName?: string;
    localizedWebsite?: string;
  }
>;

interface OrganizationLookupResponse {
  results?: OrganizationLookupResults;
}
