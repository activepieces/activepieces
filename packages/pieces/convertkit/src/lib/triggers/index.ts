import { Property } from "@activepieces/pieces-framework";
import { convertkitRegisterTrigger } from "./register";

const triggerData = [
  {
    name: "subscriber_activated",
    displayName: "New Subscriber",
    description: "Triggers when a new subscriber is confirmed within your account",
    event: "subscriber.subscriber_activate",
    sampleData: {
      id: 3580202,
      account_id: 1348380,
      event: { name: 'form_subscribe', form_id: 5016504 }
    }
  },
  {
    name: "subscriber_unsubscribed",
    displayName: "New Unsubscribe",
    description: "Triggers when a subscriber unsubscribes from your account",
    event: "subscriber.subscriber_unsubscribe",
    sampleData: {
      "subscriber": {
        "id": 2134104907,
        "first_name": "John Doe",
        "email_address": "hello@gmail.com",
        "state": "cancelled",
        "created_at": "2023-04-18T23:23:16.000Z",
        "fields": {}
      }
    }
  },
  {
    name: "form_subscribed",
    displayName: "New Form Subscribed",
    description: "Triggers when a subscription on a form",
    event: "subscriber.form_subscribe",
    sampleData: {
      rule: {
        id: 3580202,
        account_id: 1348380,
        event: { name: 'form_subscribe', form_id: 5016504 }
      }
    },
    props: {
      // TODO change to form dropdown
      form_id: Property.ShortText({
        displayName: 'Form Id',
        description: 'The Id of the form',
        required: true
      })
    }
  }
]

export const convertKitTriggers = triggerData.map((trigger) => convertkitRegisterTrigger(trigger))