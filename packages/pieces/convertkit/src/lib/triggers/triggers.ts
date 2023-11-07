import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { tag } from '../common/tags';
import { formId } from '../common/forms';
import { sequenceIdChoice } from '../common/sequences';
import {
  prepareWebhookURL,
  removeWebhook,
  createWebhook,
  webhookBaseOverride,
  initiatorValue,
} from '../common/webhooks';
import { log } from '../common';

interface WebhookInformation {
  ruleId: number;
}

const API_ENDPOINT = 'automations/hooks';

// Tested
export const addTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_add',
  displayName: 'Tag added to subscriber',
  description: 'Trigger when a tag is added to a subscriber',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
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
      target_url: 'https://example.com',
    },
  },
  async onEnable(context) {
    const { tagId, webhookBaseOverride } = context.propsValue;

    // Returns the webhook URL with the base override, if in dev environment. Otherwise, returns the webhook URL.
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.tag_add',
        tag_id: tagId,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    // const body = context.payload.body as { response: unknown };
    // return [body.response];
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const removeTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_remove',
  displayName: 'Tag removed from subscriber',
  description: 'Trigger when a tag is removed from a subscriber',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
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
      target_url: 'https://example.com',
    },
  },
  async onEnable(context) {
    const { tagId, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.tag_remove',
        tag_id: tagId,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const subscriberActivated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_activated',
  displayName: 'Subscriber activated',
  description:
    'Trigger when a subscriber is activated. This happens when a subscriber confirms their subscription.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_activate',
        initiator_value: null,
      },
      target_url: 'https://example.com',
    },
  },
  async onEnable(context) {
    const { webhookBaseOverride } = context.propsValue;
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.subscriber_activate',
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const subscriberUnsubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_unsubscribed',
  displayName: 'Subscriber unsubscribed',
  description: 'Trigger when a subscriber is unsubscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_unsubscribe',
        initiator_value: null,
      },
      target_url: 'https://example.com',
    },
  },
  async onEnable(context) {
    const { webhookBaseOverride } = context.propsValue;
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.subscriber_unsubscribe',
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const subscriberBounced = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_bounced',
  displayName: 'Subscriber bounced',
  description:
    'Trigger when a subscriber bounced. This happens when an email is sent to a subscriber and the email bounces.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
  },
  sampleData: {
    rule: {
      id: 1,
      account_id: 2,
      event: {
        name: 'subscriber_bounce',
        initiator_value: null,
      },
      target_url: 'https://example.com',
    },
  },
  async onEnable(context) {
    const { webhookBaseOverride } = context.propsValue;
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.subscriber_bounce',
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// UNTESTED
// TODO: Test this
// Cannot get the state to set to "Complained" in order to test this. Have tried marking as spam in Thunderbird and Outlook Online
// https://help.convertkit.com/en/articles/2502638-why-is-my-subscriber-showing-as-complained
export const subscriberComplained = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_complained',
  displayName: 'Subscriber complained',
  description:
    'Trigger when a subscriber complained. This happens when a subscriber marks an email as spam.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
  },
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
    const { webhookBaseOverride } = context.propsValue;
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.subscriber_complain',
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

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
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const formSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_form_subscribed',
  displayName: 'Form subscribed',
  description: 'Trigger when a form is subscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
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
    const { formId, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.form_subscribe',
        form_id: formId,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

    await context.store?.put<WebhookInformation>(`_webhook_form_subscribed`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_form_subscribed'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const sequenceSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_sequence_subscribed',
  displayName: 'Sequence subscribed',
  description: 'Trigger when a sequence is subscribed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
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
    const { sequenceIdChoice, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.course_subscribe',
        sequence_id: sequenceIdChoice,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    log({ message: 'webhook', webhook });
    const ruleId = webhook.id;

    await context.store?.put<WebhookInformation>(
      `_webhook_sequence_subscribed`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_sequence_subscribed'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const sequenceCompleted = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_sequence_completed',
  displayName: 'Sequence completed',
  description: 'Trigger when a sequence is completed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
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
    const { sequenceIdChoice, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.course_complete',
        sequence_id: sequenceIdChoice,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

    await context.store?.put<WebhookInformation>(
      `_webhook_sequence_completed`,
      {
        ruleId,
      }
    );
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_sequence_completed'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// Tested
export const linkClicked = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_link_clicked',
  displayName: 'Link clicked',
  description: 'Trigger when a link is clicked',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
    initiatorValue,
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
    const { initiatorValue, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.link_click',
        initiator_value: initiatorValue,
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

    await context.store?.put<WebhookInformation>(`_webhook_link_clicked`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_link_clicked'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});

// UNTESTED
// Broken UI at convertkit, reported to support
export const productPurchased = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_product_purchased',
  displayName: 'Product purchased',
  description: 'Trigger when a product is purchased',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
    productId: Property.Number({
      displayName: 'Product Id',
      description: 'The product id',
      required: true,
    }),
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
    const { productId, webhookBaseOverride } = context.propsValue;

    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'subscriber.product_purchase',
        product_id: productId,
      },
      target_url: targetUrl,
    };
    const response = await createWebhook(context.auth, payload);
    log({ response, payload, context });
    const ruleId = response.id;

    await context.store?.put<WebhookInformation>(`_webhook_product_purchased`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_product_purchased'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    return [context.payload.body.subscriber];
  },
});

// Untested. Webhook is created, but I have not tested if the trigger is firing.
export const purchaseCreated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_purchase_created',
  displayName: 'Purchase created',
  description: 'Trigger when a purchase is created',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookBaseOverride: webhookBaseOverride(),
  },
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
    const { webhookBaseOverride } = context.propsValue;
    const targetUrl = prepareWebhookURL(
      context.webhookUrl,
      webhookBaseOverride
    );

    const payload = {
      event: {
        name: 'purchase.purchase_create',
      },
      target_url: targetUrl,
    };

    const webhook = await createWebhook(context.auth, payload);
    const ruleId = webhook.id;

    await context.store?.put<WebhookInformation>(`_webhook_purchase_created`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_purchase_created'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth, response.ruleId);
    }
  },
  async run(context) {
    if (context.payload.body.subscriber) {
      return [context.payload.body.subscriber];
    }
    return context.payload.body;
  },
});
