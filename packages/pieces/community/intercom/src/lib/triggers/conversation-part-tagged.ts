import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';

export const conversationPartTagged = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'conversationPartTagged',
  displayName: 'Tag added to a conversation part',
  description: 'Triggers when a conversation part is tagged',
  props: {
    tag: Property.Dropdown({
      displayName: 'Tag',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your account first',
          };
        }
        const client = intercomClient(auth as OAuth2PropertyValue);
        const tagsResponse = await client.tags.list();
        return {
          options: tagsResponse.data.map((tag) => {
            return {
              label: tag.name,
              value: tag.id,
            };
          }),
        };
      },
    }),
  },
  sampleData: undefined,
  auth: intercomAuth,
  type: TriggerStrategy.APP_WEBHOOK,
  async onEnable(context) {
    const client = intercomClient(context.auth);
    const response: { app: { id_code: string } } = await client.get({
      url: '/me',
    });
    context.app.createListeners({
      events: ['conversation_part.tag.created'],
      identifierValue: response['app']['id_code'],
    });
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const tag = context.propsValue.tag;
    const payloadBody = context.payload.body as IntercomPayloadBodyType;
    if (!tag || payloadBody?.data?.item?.tag.id === tag) {
      return [payloadBody];
    }
    return [];
  },
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
