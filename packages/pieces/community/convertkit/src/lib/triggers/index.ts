import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { tag } from '../common/tags';
import { formId } from '../common/forms';
import { sequenceIdDropdown } from '../common/sequences';
import { productId } from '../common/purchases';
import { initiatorValue } from '../common/webhooks';
import { createWebhook, removeWebhook } from '../common/service';

interface WebhookInformation {
  ruleId: number;
}

const sampleData = {
  rule: {
    id: 1,
    account_id: 2,
    event: {
      name: 'course_complete',
      sequence_id: 3,
    },
  },
};

// Tested
export const addTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_add',
  displayName: 'Tag added to subscriber',
  description: 'Trigger when a tag is added to a subscriber',
  aiMetadata: {
    description:
      'Fires when the selected tag is added to a subscriber in ConvertKit (Kit), via webhook. Returns the tagged subscriber record; use it to react to segmentation changes such as enrolling the subscriber elsewhere or syncing the tag to another system.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tag,
  },
  sampleData,
  async onEnable(context) {
    const { tagId } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.tag_add',
        tag_id: tagId,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const removeTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_remove',
  displayName: 'Tag removed from subscriber',
  description: 'Trigger when a tag is removed from a subscriber',
  aiMetadata: {
    description:
      'Fires when the selected tag is removed from a subscriber in ConvertKit (Kit), via webhook. Returns the affected subscriber record; useful for reversing automations or updating external systems when a subscriber leaves a segment.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tag,
  },
  sampleData,
  async onEnable(context) {
    const { tagId } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.tag_remove',
        tag_id: tagId,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const subscriberActivated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_activated',
  displayName: 'Subscriber activated',
  description:
    'Trigger when a subscriber is activated. This happens when a subscriber confirms their subscription.',
  aiMetadata: {
    description:
      'Fires when a subscriber becomes active in ConvertKit (Kit), i.e. they confirm their subscription (double opt-in), via webhook. Returns the activated subscriber record; use it to welcome new confirmed subscribers or add them to downstream systems.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData,
  async onEnable(context) {
    const payload = {
      event: {
        name: 'subscriber.subscriber_activate',
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const subscriberUnsubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_unsubscribed',
  displayName: 'Subscriber unsubscribed',
  description: 'Trigger when a subscriber is unsubscribed',
  aiMetadata: {
    description:
      'Fires when a subscriber unsubscribes from the ConvertKit (Kit) account, via webhook. Returns the unsubscribed subscriber record; use it to suppress the contact in other tools or record the opt-out.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData,
  async onEnable(context) {
    const payload = {
      event: {
        name: 'subscriber.subscriber_unsubscribe',
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const subscriberBounced = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_bounced',
  displayName: 'Subscriber bounced',
  description:
    'Trigger when a subscriber bounced. This happens when an email is sent to a subscriber and the email bounces.',
  aiMetadata: {
    description:
      "Fires when an email sent to a subscriber bounces in ConvertKit (Kit), marking the subscriber as bounced, via webhook. Returns the bounced subscriber record; use it to clean lists or flag invalid email addresses.",
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData,
  async onEnable(context) {
    const payload = {
      event: {
        name: 'subscriber.subscriber_bounce',
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
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
  aiMetadata: {
    description:
      'Fires when a subscriber marks an email as spam, putting them in the complained state in ConvertKit (Kit), via webhook. Returns the complaining subscriber record; use it to suppress the contact and protect sender reputation.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData,
  async onEnable(context) {
    const payload = {
      event: {
        name: 'subscriber.subscriber_complain',
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const formSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_form_subscribed',
  displayName: 'Form subscribed',
  description: 'Trigger when a form is subscribed',
  aiMetadata: {
    description:
      'Fires when someone subscribes through the selected ConvertKit (Kit) form, via webhook. Returns the new subscriber record; use it to start onboarding sequences or sync new sign-ups to a CRM.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    formId,
  },
  sampleData,
  async onEnable(context) {
    const { formId } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.form_subscribe',
        form_id: formId,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

    await context.store?.put<WebhookInformation>(`_webhook_form_subscribed`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_form_subscribed'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const sequenceSubscribed = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_sequence_subscribed',
  displayName: 'Sequence subscribed',
  description: 'Trigger when a sequence is subscribed',
  aiMetadata: {
    description:
      'Fires when a subscriber is added to the selected email sequence (course) in ConvertKit (Kit), via webhook. Returns the enrolled subscriber record; use it to track enrollments or mirror them in other systems.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    sequenceIdChoice: sequenceIdDropdown,
  },
  sampleData,
  async onEnable(context) {
    const { sequenceIdChoice } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.course_subscribe',
        sequence_id: sequenceIdChoice,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const sequenceCompleted = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_sequence_completed',
  displayName: 'Sequence completed',
  description: 'Trigger when a sequence is completed',
  aiMetadata: {
    description:
      'Fires when a subscriber finishes the last email of the selected sequence (course) in ConvertKit (Kit), via webhook. Returns the subscriber record; use it to follow up after a course ends, e.g. with an offer or a next sequence.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    sequenceIdChoice: sequenceIdDropdown,
  },
  sampleData,
  async onEnable(context) {
    const { sequenceIdChoice } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.course_complete',
        sequence_id: sequenceIdChoice,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Tested
export const linkClicked = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_link_clicked',
  displayName: 'Link clicked',
  description: 'Trigger when a link is clicked',
  aiMetadata: {
    description:
      'Fires when a subscriber clicks the specified link URL in a ConvertKit (Kit) email, via webhook. Returns the clicking subscriber record plus the watched link URL; use it to score engagement or trigger interest-based follow-ups.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    initiatorValue,
  },
  sampleData,
  async onEnable(context) {
    const { initiatorValue } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.link_click',
        initiator_value: initiatorValue,
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

    await context.store?.put<WebhookInformation>(`_webhook_link_clicked`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_link_clicked'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const { initiatorValue } = context.propsValue;
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber, initiatorValue];
  },
});

// UNTESTED
// Broken UI at convertkit, reported to support. The Rukes page is not loading. It will load again, when the webhook is canceled.
export const productPurchased = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_product_purchased',
  displayName: 'Product purchased',
  description: 'Trigger when a product is purchased',
  aiMetadata: {
    description:
      'Fires when a subscriber purchases the selected ConvertKit (Kit) Commerce product, via webhook. Returns the purchasing subscriber record plus the product ID; use it to deliver the product, tag buyers, or record the sale elsewhere.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    productId,
  },
  sampleData,
  async onEnable(context) {
    const { productId } = context.propsValue;

    const payload = {
      event: {
        name: 'subscriber.product_purchase',
        product_id: productId,
      },
      target_url: context.webhookUrl,
    };
    const response = await createWebhook(context.auth.secret_text, payload);
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
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const { productId } = context.propsValue;
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber, productId];
  },
});

// Untested. Webhook is created, but I have not tested if the trigger is firing.
export const purchaseCreated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_purchase_created',
  displayName: 'Purchase created',
  description: 'Trigger when a purchase is created',
  aiMetadata: {
    description:
      'Fires when any new purchase record is created in the ConvertKit (Kit) account (across all products), via webhook. Returns the subscriber associated with the purchase; use it for account-wide sales notifications or bookkeeping.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData,
  async onEnable(context) {
    const payload = {
      event: {
        name: 'purchase.purchase_create',
      },
      target_url: context.webhookUrl,
    };

    const response = await createWebhook(context.auth.secret_text, payload);
    const ruleId = response.id;

    await context.store?.put<WebhookInformation>(`_webhook_purchase_created`, {
      ruleId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_webhook_purchase_created'
    );
    if (response !== null && response !== undefined) {
      await removeWebhook(context.auth.secret_text, response.ruleId);
    }
  },
  async run(context) {
    const body = context.payload.body as {
      purchase: { subscriber: unknown };
    };
    return [body.purchase.subscriber];
  },
});
