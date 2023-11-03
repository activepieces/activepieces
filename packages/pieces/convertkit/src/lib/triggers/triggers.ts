import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { tag } from '../common/tags';
import { formId } from '../common/forms';
import { sequenceIdChoice } from '../common/sequences';
import { prepareWebhooURL, onDisable, onEnable } from '../common/webhooks';

interface WebhookInformation {
  ruleId: number;
}

const API_ENDPOINT = 'automations/hooks';

// const log = async (message: object) => {
//   const fs = require('fs');
//   const path = require('path');
//   const filePath = path.join(__dirname, 'log.txt');
//   fs.appendFile(
//     filePath,
//     JSON.stringify(message, null, 2),
//     function (err: any) {
//       if (err) throw err;
//       console.log('Logging to: ', filePath);
//     }
//   );
// };

export const addTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_add',
  displayName: 'Tag added to subscriber',
  description: 'Trigger when a tag is added to a subscriber',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tag,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'tag_add',
        tag_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { tagId } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.tag_add',
        tag_id: tagId,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_tag_add`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_tag_add'
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

export const removeTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_remove',
  displayName: 'Tag removed from subscriber',
  description: 'Trigger when a tag is removed from a subscriber',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tag,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'tag_remove',
        tag_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { tagId } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.tag_remove',
        tag_id: tagId,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_tag_remove`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_tag_remove'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const subscriberActivated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_activated',
  displayName: 'Subscriber activated',
  description: 'Trigger when a subscriber is activated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_activate',
      },
    },
  },
  async onEnable(context) {
    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.subscriber_activate',
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_activated`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_activated'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const subscriberUnsubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_unsubscribed',
  displayName: 'Subscriber unsubscribed',
  description: 'Trigger when a subscriber is unsubscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_unsubscribe',
      },
    },
  },
  async onEnable(context) {
    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.subscriber_unsubscribe',
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_unsubscribed`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_unsubscribed'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const subscriberBounced = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_bounced',
  displayName: 'Subscriber bounced',
  description: 'Trigger when a subscriber bounced',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_bounce',
      },
    },
  },
  async onEnable(context) {
    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.subscriber_bounce',
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_bounced`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_bounced'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const subscriberComplained = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_complained',
  displayName: 'Subscriber complained',
  description: 'Trigger when a subscriber complained',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_complain',
      },
    },
  },
  async onEnable(context) {
    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.subscriber_complain',
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(
      `_webhook_subscriber_complained`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_subscriber_complained'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const formSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_form_subscribed',
  displayName: 'Form subscribed',
  description: 'Trigger when a form is subscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    formId,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'form_subscribe',
        form_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { formId } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.form_subscribe',
        form_id: formId,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_form_subscribed`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_form_subscribed'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const courseSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_course_subscribed',
  displayName: 'Course subscribed',
  description: 'Trigger when a course is subscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    sequenceIdChoice,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'course_subscribe',
        sequence_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { sequenceIdChoice } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.course_subscribe',
        course_id: sequenceIdChoice,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_course_subscribed`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_course_subscribed'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const courseCompleted = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_course_completed',
  displayName: 'Course completed',
  description: 'Trigger when a course is completed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    sequenceIdChoice,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'course_complete',
        sequence_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { sequenceIdChoice } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.course_complete',
        course_id: sequenceIdChoice,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_course_completed`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_course_completed'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const linkClicked = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_link_clicked',
  displayName: 'Link clicked',
  description: 'Trigger when a link is clicked',
  type: TriggerStrategy.WEBHOOK,
  props: {
    initiatorValue: Property.ShortText({
      displayName: 'Initiator Value URL',
      description: 'The initiator value URL that will trigger the webhook',
      required: true,
    }),
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'link_click',
        initiator_value: 'https://www.example.com',
      },
    },
  },
  async onEnable(context) {
    const { initiatorValue } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.link_click',
        initiator_value: initiatorValue,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_link_clicked`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_link_clicked'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const productPurchased = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_product_purchased',
  displayName: 'Product purchased',
  description: 'Trigger when a product is purchased',
  type: TriggerStrategy.WEBHOOK,
  props: {
    sequenceIdChoice,
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'product_purchase',
        product_id: 3,
      },
    },
  },
  async onEnable(context) {
    const { sequenceIdChoice } = context.propsValue;

    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'subscriber.product_purchase',
        product_id: sequenceIdChoice,
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_product_purchased`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_product_purchased'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

export const purchaseCreated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_purchase_created',
  displayName: 'Purchase created',
  description: 'Trigger when a purchase is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'purchase_create',
      },
    },
  },
  async onEnable(context) {
    const targetUrl = prepareWebhooURL(context.webhookUrl);

    const payload = {
      event: {
        name: 'purchase.purchase_create',
      },
      target_url: targetUrl,
    };

    const ruleId = await onEnable(context.auth, payload);

    await context.store?.put<WebhookInformation>(`_webhook_purchase_created`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_purchase_created'
    );
    if (response !== null && response !== undefined) {
      await onDisable(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});
