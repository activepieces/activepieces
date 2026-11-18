import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaPortfolioItemChangeOutputSchema } from '../../output-schemas';

export const asanaAddPortfolioItemAction = createAction({
  auth: asanaAuth,
  name: 'add_portfolio_item',
  classification: 'WRITE',
  displayName: 'Add Portfolio Item',
  description: 'Add a project or portfolio to an Asana portfolio (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a project (or a nested portfolio) to a portfolio, optionally placed before or after an existing item. The project itself is not changed. Remove it again with Remove Portfolio Item. Portfolios need an Advanced or higher Asana plan. Adding an item that is already in the portfolio converges, so it is safe to retry.',
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
      description: 'Gid of the project or portfolio to add. Obtain a project gid from List Projects.',
      required: true,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Item GID',
      description: 'Gid of an item already in the portfolio to place the new item before. Do not combine with Insert After.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Item GID',
      description: 'Gid of an item already in the portfolio to place the new item after. Do not combine with Insert Before.',
      required: false,
    }),
  },
  async run(context) {
    const { portfolio, item, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({ first: insert_before, second: insert_after, firstLabel: 'Insert Before Item GID', secondLabel: 'Insert After Item GID' });
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/portfolios/${asanaUtils.pathSegment(portfolio)}/addItem`,
      operation: 'Add Portfolio Item',
      data: {
        item: item.trim(),
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
    return { success: true, portfolio_gid: portfolio.trim(), item_gid: item.trim() };
  },
});
