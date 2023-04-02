import { Property } from '@activepieces/framework'
import { surveyMonkeyRegisterTrigger } from "./register"

const props = {
  object_type: Property.StaticDropdown({
    displayName: 'Object Type',
    description: 'Object type to filter events by: survey or collector. NOTE: Setting object_type to collector and event_type to collector_created will result in a 400 error.',
    required: true,
    options: {
      options: [
        { label: 'Survey', value: 'survey' },
        { label: 'Collector', value: 'collector' }
      ]
    }
  }),
  object_ids: Property.Array({
    displayName: 'Object Type',
    description: 'Object type to filter events by: survey or collector. NOTE: Setting object_type to collector and event_type to collector_created will result in a 400 error.',
    required: true,
    defaultValue: []
  }),
}

const triggerData = [
  {
    name: 'response_completed',
    displayName: 'Response Completed',
    event: 'response_completed',
    description: 'A survey response is completed',
    props,
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'response_updated',
    displayName: 'Response Updated',
    event: 'response_updated',
    props,
    description: 'A survey response is updated; one webhook event is fired for each page of the survey',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'response_created',
    displayName: 'Response Created',
    event: 'response_created',
    props,
    description: 'A respondent begins a survey',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'response_overquota',
    displayName: 'Response Overquota',
    event: 'response_overquota',
    props,
    description: 'A response is over a survey’s quota',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'collector_created',
    displayName: 'Collector Created',
    event: 'collector_created',
    props,
    description: 'A collector is created',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'collector_updated',
    displayName: 'Collector Updated',
    event: 'collector_updated',
    props,
    description: 'A collector is updated',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'survey_created',
    displayName: 'Survey Created',
    event: 'survey_created',
    description: 'A survey is created',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  },
  {
    name: 'survey_updated',
    displayName: 'Survey Updated',
    event: 'survey_updated',
    props,
    description: 'A survey is updated',
    sampleData: {
      "id": "1234",
      "name": "My Webhook",
      "event_type": "response_completed",
      "object_type": "survey",
      "object_ids": [
        "1234",
        "5678"
      ],
      "subscription_url": "https://surveymonkey.com/webhook_reciever",
      "href": "https://api.surveymonkey.com/v3/webhooks/123"
    }
  }
]

export const surveyMonkeyTriggers = triggerData.map((trigger) => surveyMonkeyRegisterTrigger(trigger))