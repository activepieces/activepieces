

import { createTrigger, HttpMethod } from '@activepieces/framework'
import { TriggerStrategy } from '@activepieces/shared'
import { mondayMakeRequest, mondayProps } from '../common';

interface Props {
  name: string,
  event: string,
  displayName: string,
  description: string,
  sampleData: object,
  props?: object
}

export const mondayRegisterTrigger = ({ name, event, displayName, description, sampleData }: Props) => createTrigger({
  name: `monday_trigger_${name}`,
  displayName: displayName,
  description: description,
  props: {
    authentication: mondayProps.authentication,
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true)
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const query = `
      mutation {
        create_webhook (
          board_id: ${context.propsValue.board_id}, 
          url: "${context.webhookUrl}", 
          event: ${event}
        ) 
        { id event board_id config }
      }
    `

    const { body: webhook } = await mondayMakeRequest(
      context.propsValue.authentication.access_token, 
      query,
      HttpMethod.POST
    )

    await context.store.put<WebhookInformation>(`monday_${name}_trigger`, webhook as WebhookInformation);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`monday_${name}_trigger`);

    if (webhook) {
      await mondayMakeRequest(
        context.propsValue.authentication.access_token, 
        `mutation { delete_webhook (id: ${webhook.id}) { id board_id } }`,
        HttpMethod.POST
      )
    }
  },
  async run({ payload }) {
    console.debug("payload received", payload.body)

    if ("challenge" in payload.body && Object.keys(payload).length === 1) 
      return payload.body

    return [payload.body]
  },
});

interface WebhookInformation {
  id: string
  board_id: string
}
