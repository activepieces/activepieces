import { Trigger } from "@activepieces/framework"
import { HubspotEventType } from "../common/models"
import { hubspotRegisterTrigger } from "./register-trigger"

export const hubspotTriggers: Trigger[] = [
  {
    name: 'hubspot_contact_creation',
    eventType: HubspotEventType.CONTACT_CREATION,
    displayName: "Contact Created",
    description: "Get notified if any contact is created in a customer's account.",
    sampleData: {},
  }
].map((def) => hubspotRegisterTrigger(def))