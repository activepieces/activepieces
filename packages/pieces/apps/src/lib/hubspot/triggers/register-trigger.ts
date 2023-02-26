import { createTrigger, TriggerStrategy } from "@activepieces/framework"

interface Props {
  name: string,
  eventType: string,
  displayName: string,
  description: string,
  sampleData: object
}

export const hubspotRegisterTrigger = 
  ({ name, eventType, displayName, description, sampleData}: Props) => createTrigger({
    name: name,
    displayName,
    description,
    props: {
      
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { repo, owner } = context.propsValue['repository']!;
      
      await context.store.put<WebhookInformation>(`github_${name}_trigger`, {
        webhookId: webhook.id,
        owner: owner,
        repo: repo,
      });
    },
    async onDisable(context) {
    },
    async run(context) {
      console.debug("payload received", context.payload.body)

      return [context.payload.body];
    }
  })