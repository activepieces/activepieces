import { createTrigger, Property, assertNotNullOrUndefined } from "@activepieces/framework";
import { TriggerStrategy } from "@activepieces/shared";
import { nanoid } from 'nanoid'
import { figmaAuth } from '../common/props';
import { figmaCommon } from "../common";
import { figmaWebhookPostRequest, figmaDeleteRequest } from '../common/utils';

type TriggerData = {
  webhookId: string;
}

const TRIGGER_DATA_STORE_KEY = 'figma_new_comment_trigger_data'

export const newCommentTrigger = createTrigger({
  name: 'new_comment',
  displayName: 'New comment (Figma Professional plan only)',
  description: 'Triggers when a new comment is posted',
  type: TriggerStrategy.WEBHOOK,
  sampleData: [{
    "id": "12345",
    "team_id": "1234567890",
    "event_type": "FILE_COMMENT",
    "client_id": null,
    "endpoint": "http://localhost:1234/webhook",
    "passcode": "figma-passcode",
    "status": "ACTIVE",
    "description": null,
    "protocol_version": "2"
  }],
  props: {
    authentication: figmaAuth,
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'Naviate to team page, copy the Id from the URL after the word team/',
      required: true,
    }),
  },

  async onEnable(context): Promise<void> {
    const token = context.propsValue["authentication"]?.access_token
    const teamId = context.propsValue["team_id"];

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(teamId, 'teamId');

    const url = `${figmaCommon.baseUrl}/${figmaCommon.webhooks}`;
    const eventType = "FILE_COMMENT";
    const passcode = `figma_passcode_${nanoid()}`;
    const endpoint = context.webhookUrl;

    const { response_body } = await figmaWebhookPostRequest({ token, url, eventType, teamId, endpoint, passcode });

    await context.store?.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
      webhookId: response_body["id"],
    });
  },

  async onDisable(context): Promise<void> {
    const token = context.propsValue["authentication"]?.access_token

    assertNotNullOrUndefined(token, 'token');

    const triggerData = await context.store?.get<TriggerData>(TRIGGER_DATA_STORE_KEY);
    if (triggerData !== null && triggerData !== undefined) {
      const url = `${figmaCommon.baseUrl}/${figmaCommon.webhook}`.replace(':webhook_id', triggerData.webhookId);
      await figmaDeleteRequest({ token, url });
    }
  },

  async run(context) {
    if ('event_type' in context.payload.body && context.payload.body["event_type"] === "PING") {
      return [];
    }
    return [context.payload.body];
  },
})
