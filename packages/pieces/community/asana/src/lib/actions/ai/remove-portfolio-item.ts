import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaPortfolioItemChangeOutputSchema } from '../../output-schemas';

export const asanaRemovePortfolioItemAction = createAction({
  auth: asanaAuth,
  name: 'remove_portfolio_item',
  classification: 'WRITE',
  displayName: 'Remove Portfolio Item',
  description: 'Take a project or portfolio out of an Asana portfolio (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a project (or nested portfolio) from a portfolio. The project itself is kept and nobody loses access to it; to delete a project use Delete Project. Portfolios need an Advanced or higher Asana plan. Removing an item that is already gone converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaPortfolioItemChangeOutputSchema,
  props: {
    portfolio: Property.ShortText({
      displayName: 'Portfolio GID',
      description: 'Gid of the portfolio. Obtain it from List My Portfolios.',
      required: true,
    }),
    item: Property.ShortText({
      displayName: 'Item GID',
      description: 'Gid of the project or portfolio to remove. Obtain it from List Portfolio Items.',
      required: true,
    }),
  },
  async run(context) {
    const { portfolio, item } = context.propsValue;
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/portfolios/${asanaUtils.pathSegment(portfolio)}/removeItem`,
      operation: 'Remove Portfolio Item',
      data: { item: item.trim() },
    });
    return { success: true, portfolio_gid: portfolio.trim(), item_gid: item.trim() };
  },
});
