import { Trigger } from "@activepieces/framework"
import { hubspotRegisterTrigger } from "./register-trigger"

export enum HubspotEventType {
  CONTACT_CREATION = 'contact.creation'
}

export const hubspotTriggers: Trigger[] = [
  {
    name: 'hubspot_contact_creation',
    eventType: HubspotEventType.CONTACT_CREATION,
    displayName: "Contact Created",
    description: "Get notified if any contact is created in a customer's account.",
    sampleData: {},
  }
].map((def) => hubspotRegisterTrigger(def))