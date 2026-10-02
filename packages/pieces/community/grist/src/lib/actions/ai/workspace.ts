import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristGetOrgAccessOutputSchema, gristListOrganizationsOutputSchema, gristRunSqlQueryOutputSchema, gristListWorkspacesOutputSchema } from '../../output-schemas';

const orgIdProp = Property.ShortText({
  displayName: 'Organization ID',
  description:
    'Numeric org ID or subdomain from **List Organizations**. Use `current` for the site in the connection domain.',
  required: false,
  defaultValue: 'current',
});

export const gristRunSqlQueryAction = createAction({
  auth: gristAuth,
  name: 'grist_run_sql_query',
  outputSchema: gristRunSqlQueryOutputSchema,
  displayName: 'Run SQL Query',
  description: 'Runs a read-only SQL SELECT query against a document.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs a SQLite SELECT statement against a Grist document (table IDs are SQL table names) and returns the rows. Use `?` placeholders with Arguments. Read-only; use it for joins and aggregates that **List Records** cannot do.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    sql: Property.LongText({
      displayName: 'SQL',
      description: 'A single SELECT statement.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for the `?` placeholders, in order.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, sql, args, timeout } = context.propsValue;
    const response = await client.makeRequest<{
      records: { fields: Record<string, unknown> }[];
    }>(HttpMethod.POST, `/docs/${documentId}/sql`, undefined, undefined, {
      sql,
      ...(args && args.length > 0 ? { args } : {}),
      ...(timeout ? { timeout } : {}),
    });
    const rows = response.records.map((record) => record.fields);
    return { rows, count: rows.length };
  },
});

export const gristListOrganizationsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_organizations',
  outputSchema: gristListOrganizationsOutputSchema,
  displayName: 'List Organizations',
  description: 'Lists the organizations you can access.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the Grist orgs (team sites and personal areas) the API key can access, with their IDs and your access level.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const organizations = await client.makeRequest<unknown[]>(
      HttpMethod.GET,
      '/orgs',
      undefined,
      undefined
    );
    return { organizations, count: organizations.length };
  },
});

export const gristGetOrgAccessAction = createAction({
  auth: gristAuth,
  name: 'grist_get_org_access',
  outputSchema: gristGetOrgAccessOutputSchema,
  displayName: 'Get Org Access',
  description: 'Lists the users with access to an organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the users of an organization with their emails and access roles (owner, editor, viewer). Use it to look up user IDs or check permissions.',
    idempotent: true,
  },
  props: { orgId: orgIdProp },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    return await client.makeRequest(
      HttpMethod.GET,
      `/orgs/${context.propsValue.orgId || 'current'}/access`,
      undefined,
      undefined
    );
  },
});

export const gristListWorkspacesAction = createAction({
  auth: gristAuth,
  name: 'grist_list_workspaces',
  outputSchema: gristListWorkspacesOutputSchema,
  displayName: 'List Workspaces',
  description: 'Lists the workspaces and documents of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every workspace in an org together with the documents each contains. This is where workspace IDs (for **Create Document**) and document IDs (for every other action) come from.',
    idempotent: true,
  },
  props: { orgId: orgIdProp },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const workspaces = await client.makeRequest<unknown[]>(
      HttpMethod.GET,
      `/orgs/${context.propsValue.orgId || 'current'}/workspaces`,
      undefined,
      undefined
    );
    return { workspaces, count: workspaces.length };
  },
});
