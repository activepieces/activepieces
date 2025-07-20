import {
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';
import { tagIdProp } from '../common/props';

export const conversationPartTagged = createTrigger({
  name: 'conversationPartTagged',
  displayName: 'Tag added to a conversation part',
  description: 'Triggers when a conversation part is tagged.',
  props: {
    tagId: tagIdProp('Tag', false),
  },
  auth: intercomAuth,
  type: TriggerStrategy.APP_WEBHOOK,
  async onEnable(context) {
    const client = intercomClient(context.auth);
    const response = await client.admins.identify();

    if (!response.app?.id_code) {
      throw new Error('Could not find admin id code');
    }

    context.app.createListeners({
      events: ['conversation_part.tag.created'],
      identifierValue: response['app']['id_code'],
    });
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },

  async run(context) {
    const tag = context.propsValue.tagId;
    const payloadBody = context.payload.body as IntercomPayloadBodyType;
    if (!tag || payloadBody?.data?.item?.tag.id === tag) {
      return [payloadBody.data.item];
    }
    return [];
  },
  sampleData: undefined
});

type IntercomPayloadBodyType = {
	data: {
		item: {
			tag: {
				id: string;
			};
		};
	};
};
