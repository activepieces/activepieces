import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';

export const asanaListPortfoliosAction = createAction({
  auth: asanaAuth,
  name: 'list_portfolios',
  classification: 'SEARCH',
  displayName: 'List My Portfolios',
  description: 'List the Asana portfolios owned by the connected user in a workspace (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the portfolios in a workspace that the connected user owns, with owner, dates, privacy and color. Asana requires an owner filter and only returns the calling user\'s own portfolios to OAuth apps, so the action always sends owner=me. Use it to find a portfolio gid for Get Portfolio, List Portfolio Items or Add Portfolio Item. Portfolios need an Advanced or higher Asana plan; lower plans get a paid-plan error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace. Obtain it from List Workspaces.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'portfolios' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/portfolios',
      operation: 'List My Portfolios',
      query: { workspace: workspace.trim(), owner: 'me', opt_fields: ASANA_FIELDS.portfolioList },
      limit,
      offset,
    });
  },
});
