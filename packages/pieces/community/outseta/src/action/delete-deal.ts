import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const deleteDealAction = createAction({
  name: 'delete_deal',
  auth: outsetaAuth,
  displayName: 'Delete Deal',
  description: 'Delete a deal from the CRM.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes an Outseta CRM deal by its UID. Use to remove a deal you have the UID for. Destructive; repeating the call after the deal is gone will error rather than succeed silently.',
    idempotent: false,
  },
  props: {
    dealUid: Property.ShortText({
      displayName: 'Deal UID',
      description: 'The UID of the deal to delete.',
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

    return { deleted: true, deal_uid: context.propsValue.dealUid };
  },
});
