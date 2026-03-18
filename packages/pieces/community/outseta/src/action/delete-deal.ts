import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const deleteDealAction = createAction({
  name: 'delete_deal',
  auth: outsetaAuth,
  displayName: 'Delete Deal',
  description: 'Delete a deal from the CRM.',
  props: {
    dealUid: Property.ShortText({
      displayName: 'Deal UID',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.delete<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`
    );

    return { deleted: true, dealUid: context.propsValue.dealUid };
  },
});
