import { Property } from "@activepieces/pieces-framework";
import { convertkitRegisterTrigger } from "./register";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

const triggerData = [
  {
    name: "subscriber_activated",
    displayName: "Account Subscription",
    description: "Triggers on a new subscriber in your account",
    event: "subscriber.subscriber_activate",
    sampleData: {
      id: 3580202,
      account_id: 1348380,
      event: { name: 'form_subscribe', form_id: 5016504 }
    }
  },
  {
    name: "subscriber_unsubscribed",
    displayName: "Account Unsubscription",
    description: "Triggers on user unsubscription from your account",
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
    displayName: "Form Subscription",
    description: "Triggers on a new form subscription",
    event: "subscriber.form_subscribe",
    sampleData: {
      rule: {
        id: 3580202,
        account_id: 1348380,
        event: { name: 'form_subscribe', form_id: 5016504 }
      }
    },
    props: {
      form_id: Property.Dropdown({
        displayName: 'Form Id',
        description: 'The Id of the form',
        refreshers: ['authentication'],
        required: true,
        options: async ({ authentication }) => {
          if (!authentication)
            return { disabled: true, options: [], placeholder: 'Please authenticate first' }

          const result = await httpClient.sendRequest<FormResponse>({
            method: HttpMethod.GET,
            url: 'https://api.convertkit.com/v3/forms',
            body: {
              api_secret: authentication
            }
          })

          if (result.status === 200) {
            return {
              disabled: false,
              options: result.body.forms.map(
                form => ({ label: form.name, value: form.id })
              )
            }
          }

          return {
            disabled: true,
            options: [],
            placeholder: "Error fetching form"
          }
        }
      })
    }
  }
]

interface FormResponse {
  forms: {
    id: number
    name: string
    created_at: string
    type: string
    url: string
    embed_js: string
    embed_url: string
    title: string
    description: string
    sign_up_button_text: string
    success_message: string
  }[]
}

export const convertKitTriggers = triggerData.map((trigger) => convertkitRegisterTrigger(trigger))