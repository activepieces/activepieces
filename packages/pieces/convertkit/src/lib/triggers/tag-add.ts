import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { convertkitAuth, ENVIRONMENT } from '../..';
import { CONVERTKIT_API_URL } from '../common';

interface WebhookInformation {
  ruleId: number;
}

const API_ENDPOINT = 'automations/hooks/';

const log = async (message: object) => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'log.txt');
    fs.appendFile(filePath, JSON.stringify(message, null, 2), function (err: any) {
      if (err) throw err;
      console.log('Logging to: ', filePath);
    });
}

const onEnable = async (auth: string, event: object) => {

  const body = JSON.stringify({ ...event, api_secret: auth }, null, 2)
  console.log('body', body)
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}`;
    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Throw if unsuccessful
    if (!response.ok) {
      throw new Error('Failed to create webhook');
    }

    // Get response body
    const data = await response.json();
    const ruleId = data.rule.id

    return ruleId
};

const onDisable = async (auth: string, ruleId: number) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${ruleId}`;
  // Fetch URL using fetch api
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({ api_secret: auth }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Throw if unsuccessful
  if (!response.ok) {
    throw new Error('Failed to remove webhook');
  }
};

export const addTag = createTrigger({
  auth: convertkitAuth,
  name: 'subscriber.tag_add', // Unique name across the piece.
  displayName: 'Tag added to subscriber', // Display name on the interface.
  description: 'Trigger when a tag is added to a subscriber',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tag_id: Property.Number({
      displayName: 'Tag Id',
      description: 'The tag id',
      required: true,
    }),
  },
  sampleData: {
    rule: {
      id: 43,
      account_id: 2,
      event: {
        name: 'tag_add',
        tag_id: 18,
      },
      target_url: 'http://example.com/',
    },
  },
  async onEnable(context) {

    // let target_url = context.webhookUrl
    // if (ENVIRONMENT === 'dev') {
      // target_url = context.webhookUrl.replace('http://localhost:3000', 'https://activepieces.ngrok.dev')
    // }
    const target_url = context.webhookUrl.replace('http://localhost:3000', 'https://activepieces.ngrok.dev')

    const event = {
      event: {
        name: 'subscriber.tag_add',
        tag_id: context.propsValue.tag_id,
      },
      target_url,
    };

    const ruleId = await onEnable(context.auth, event);

    await context.store?.put<WebhookInformation>(`_new_tag_add_trigger`, {
      ruleId,
    });

  },
  async onDisable(context) {

    const response = await context.store?.get<WebhookInformation>(
      '_new_tag_add_trigger'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    // const body = context.payload.body as { response: unknown };
    // return [body.response];
    return [context.payload.body.subscriber];
  },
});
