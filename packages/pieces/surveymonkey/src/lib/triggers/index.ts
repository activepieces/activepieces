import { surveryMonkeyProps } from "../common"
import { surveyMonkeyRegisterTrigger } from "./register"

const triggerData = [
  {
    name: 'survey_created',
    displayName: 'Survey Created',
    event: 'survey_created',
    props: { 
      authentication: surveryMonkeyProps['authentication']
    },
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
    props: surveryMonkeyProps,
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
  },
  {
    name: 'response_created',
    displayName: 'Response Created',
    event: 'response_created',
    props: surveryMonkeyProps,
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
    name: 'response_completed',
    displayName: 'Response Completed',
    event: 'response_completed',
    description: 'A survey response is completed',
    props: surveryMonkeyProps,
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
    props: surveryMonkeyProps,
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
    name: 'response_overquota',
    displayName: 'Response Overquota',
    event: 'response_overquota',
    props: surveryMonkeyProps,
    description: 'A response is over a survey\'s quota',
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