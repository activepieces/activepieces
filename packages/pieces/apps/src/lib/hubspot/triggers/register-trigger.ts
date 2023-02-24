import { createTrigger, TriggerStrategy } from "@activepieces/framework"
import { Trigger } from "@activepieces/shared";

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
    },
    async onDisable(context) {
    },
    async run(context) {
      console.debug("payload received", context.payload.body)

      return [context.payload.body];
    }
  })