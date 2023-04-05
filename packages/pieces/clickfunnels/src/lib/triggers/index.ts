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
  },
  {
    name: 'purchase_created',
    displayName: "Purchase Created",
    description: 'Triggers on `purchase_created`',
    event: 'purchase_created',
    sampleData: {}
  },
  {
    name: 'purchase_updated',
    displayName: "Purchase Updated",
    description: 'Triggers on `purchase_updated`',
    event: 'purchase_updated',
    sampleData: {}
  }
]

export const clickFunnelTriggers = triggerData.map((trigger) => clickFunnelsRegisterTrigger(trigger))