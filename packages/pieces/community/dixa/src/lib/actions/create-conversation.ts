import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  agentIdProp,
  channelProp,
  directionProp,
  emailIntegrationIdProp,
  endUserIdProp,
} from '../common/props';

export const createConversation = createAction({
  auth: dixaAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description:
    'Creates a new email or contact form-based conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a new Dixa email or contact form conversation for an end user. Outbound conversations require an agent ID and only support the Email channel.',
    idempotent: false,
  },
  props: {
    requesterId: endUserIdProp('Requester ID'),
    direction: directionProp,
    channel: channelProp,
    emailIntegrationId: emailIntegrationIdProp,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the conversation',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The content message.',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'The 2-letter ISO 639-1 language of the conversation (e.g. en).',
      required: false,
    }),
    agentId: agentIdProp({
      description: 'Required when direction is Outbound.',
      required: false,
      refreshers: ['direction'],
    }),
  },
  async run({ auth, propsValue }) {
    const {
      requesterId,
      direction,
      channel,
      emailIntegrationId,
      subject,
      message,
      language,
      agentId,
    } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/conversations',
      {
        subject,
        emailIntegrationId,
        language,
        requesterId,
        message: {
          agentId: direction === 'Outbound' ? agentId : undefined,
          content: {
            _type: 'Text',
            value: message,
          },
          _type: direction,
        },
        _type: channel,
      }
    );
  },
});
