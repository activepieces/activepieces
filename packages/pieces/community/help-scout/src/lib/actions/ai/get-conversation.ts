import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const getConversation = createAction({
  auth: helpScoutAuth,
  name: 'get_conversation',
  classification: 'READ',
  displayName: 'Get Conversation',
  description: 'Gets one conversation by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one Help Scout conversation by numeric ID: subject, status, mailbox, assignee, tags, primary customer and custom fields, plus its threads (messages, replies, notes) when includeThreads is "yes". Use before replying or updating. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['conversation'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    includeThreads: Property.StaticDropdown({
      displayName: 'Include Threads',
      required: false,
      defaultValue: 'yes',
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await helpScoutApi.request({
      method: HttpMethod.GET,
      path: `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}`,
      auth,
      queryParams: propsValue.includeThreads === 'no' ? {} : { embed: 'threads' },
    });
    const conversation = helpScoutApi.stripLinksDeep(response.body);
    return helpScoutApi.isRecord(conversation) ? conversation : {};
  },
});
