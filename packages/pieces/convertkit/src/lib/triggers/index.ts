import { Property } from "@activepieces/framework";
import { convertkitRegisterTrigger } from "./register";

const triggerData = [
  {
    name: "subscriber_activated",
    displayName: "Subscriber Activated",
    description: "Triggered on `subscriber_activate`",
    event: "subscriber.subscriber_activate",
    sampleData: {
      id: 3580202,
      account_id: 1348380,
      event: { name: 'form_subscribe', form_id: 5016504 },
      target_url: 'https://b3ac-197-156-137-157.eu.ngrok.io/v1/webhooks/EJffn0ILoGFPzTVLLhkHr'
    }
  },
  {
    name: "subscriber_unsubscribed",
    displayName: "Subscriber Unsubscribed",
    description: "Triggered on `subscriber_unsubscribe`",
    event: "subscriber.subscriber_unsubscribe",
    sampleData: {
      id: 3580202,
      account_id: 1348380,
      event: { name: 'form_subscribe', form_id: 5016504 },
      target_url: 'https://b3ac-197-156-137-157.eu.ngrok.io/v1/webhooks/EJffn0ILoGFPzTVLLhkHr'
    }
  },
  {
    name: "form_subscribed",
    displayName: "Form Subscribed",
    description: "Triggered on `form_subscribe`",
    event: "subscriber.form_subscribe",
    sampleData: {
      rule: {
        id: 3580202,
        account_id: 1348380,
        event: { name: 'form_subscribe', form_id: 5016504 },
        target_url: 'https://b3ac-197-156-137-157.eu.ngrok.io/v1/webhooks/EJffn0ILoGFPzTVLLhkHr'
      }
    },
    props: {
      form_id: Property.ShortText({
        displayName: 'Form Id',
        description: 'The Id of the form',
        required: true
      })
    }
  },
  {
    name: "course_subscribed",
    displayName: "Course Subscribed",
    description: "Triggered on `course_subscribe`",
    event: "subscriber.course_subscribe",
    sampleData: {},
    props: {
      course_id: Property.ShortText({
        displayName: 'Course Id',
        description: 'The Id of the Course',
        required: true
      })
    }
  },
  {
    name: "course_completed",
    displayName: "Course Completed",
    description: "Triggered on `course_complete`",
    event: "subscriber.course_complete",
    sampleData: {},
    props: {
      course_id: Property.ShortText({
        displayName: 'Course Id',
        description: 'The Id of the Course',
        required: true
      })
    }
  },
  {
    name: "link_clicked",
    displayName: "Link Clicked",
    description: "Triggered on `link_click`",
    event: "subscriber.link_click",
    sampleData: {},
    props: {
      initiator_value: Property.ShortText({
        displayName: 'Initiator Value',
        description: 'A link URL',
        required: true
      })
    }
  },
  {
    name: "product_purchased",
    displayName: "Product Purchased",
    description: "Triggered on `product_purchase`",
    event: "subscriber.product_purchase",
    sampleData: {},
    props: {
      product_id: Property.ShortText({
        displayName: 'Product Id',
        description: 'The Id of the Product',
        required: true
      })
    }
  },
  {
    name: "purchase_created",
    displayName: "Purchase Created",
    description: "Triggered on `purchase_create`",
    event: "purchase.purchase_create",
    sampleData: {}
  },
]

export const convertKitTriggers = triggerData.map((trigger) => convertkitRegisterTrigger(trigger))