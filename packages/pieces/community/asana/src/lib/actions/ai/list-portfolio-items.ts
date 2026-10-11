import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListPortfolioItemsAction = createAction({
  auth: asanaAuth,
  name: 'list_portfolio_items',
  classification: 'SEARCH',
  displayName: 'List Portfolio Items',
  description: 'List the projects and nested portfolios inside an Asana portfolio (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the items of a portfolio (projects and nested portfolios) as compact records with gid, name and resource_type. Use Get Project or Get Portfolio for details of an item. Portfolios need an Advanced or higher Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    portfolio: Property.ShortText({
      displayName: 'Portfolio GID',
      description: 'Gid of the portfolio. Obtain it from List My Portfolios.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'items' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { portfolio, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/portfolios/${asanaUtils.pathSegment(portfolio)}/items`,
      operation: 'List Portfolio Items',
      limit,
      offset,
    });
  },
});
