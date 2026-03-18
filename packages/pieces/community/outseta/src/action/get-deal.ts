import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getDealAction = createAction({
  name: 'get_deal',
  auth: outsetaAuth,
  displayName: 'Get Deal',
  description: 'Retrieve a deal by its UID.',
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

    return await client.get<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`
    );
  },
});
