import { clickFunnelsRegisterTrigger } from "./register"


const triggerData = [
  {
    name: 'contact_created',
    displayName: "Contact Created",
    description: 'Triggers on `contact_created`',
    event: 'contact_created',
    sampleData: {}
  },
  {
    name: 'contact_updated',
    displayName: "Contact Updated",
    description: 'Triggers on `contact_updated`',
    event: 'contact_updated',
    sampleData: {}
  }
]

export const clickFunnelTriggers = triggerData.map((trigger) => clickFunnelsRegisterTrigger(trigger))