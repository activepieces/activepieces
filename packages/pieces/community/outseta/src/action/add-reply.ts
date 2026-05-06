import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addReplyAction = createAction({
  name: 'add_reply',
  auth: outsetaAuth,
  displayName: 'Reply to Ticket',
  description: 'Add a reply to an existing support ticket (case) in Outseta.',
  props: {
    caseUid: Property.ShortText({
      displayName: 'Case UID',
      required: true,
      description: 'The UID of the support ticket to reply to.',
    }),
    agentName: Property.ShortText({
      displayName: 'Agent Name',
      required: true,
      description: 'Name of the agent sending the reply.',
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      required: true,
      description: 'The reply content.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body = {
      AgentName: context.propsValue.agentName,
      Case: { Uid: context.propsValue.caseUid },
      Comment: context.propsValue.comment,
    };

    const result = await client.post<any>(
      `/api/v1/support/cases/${context.propsValue.caseUid}/replies`,
      body
    );

    return result;
  },
});
