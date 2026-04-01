import { createAction } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { dealUidDropdown } from '../common/dropdowns';

export const deleteDealAction = createAction({
  name: 'delete_deal',
  auth: outsetaAuth,
  displayName: 'Delete Deal',
  description: 'Delete a deal from the CRM.',
  props: {
    dealUid: dealUidDropdown(),
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

    return { deleted: true, deal_uid: context.propsValue.dealUid };
  },
});
