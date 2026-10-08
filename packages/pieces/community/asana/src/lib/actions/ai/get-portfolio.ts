import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaGetPortfolioAction = createAction({
  auth: asanaAuth,
  name: 'get_portfolio',
  classification: 'READ',
  displayName: 'Get Portfolio',
  description: 'Get the details of an Asana portfolio (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one portfolio: name, owner, creator, members, dates, privacy, color, archived state, latest status update and link. For the projects inside it use List Portfolio Items. Portfolios need an Advanced or higher Asana plan. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    portfolio: Property.ShortText({
      displayName: 'Portfolio GID',
      description: 'Gid of the portfolio. Obtain it from List My Portfolios.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/portfolios/${asanaUtils.pathSegment(context.propsValue.portfolio)}`,
      operation: 'Get Portfolio',
      query: { opt_fields: ASANA_FIELDS.portfolio },
    });
  },
});
