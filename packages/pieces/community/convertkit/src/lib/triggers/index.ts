import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../auth';
import { tag } from '../common/tags';
import { formId } from '../common/forms';
import { sequenceIdDropdown } from '../common/sequences';
import { productId } from '../common/purchases';
import { initiatorValue } from '../common/webhooks';
import { kitWebhookLifecycle } from '../common/service';

const sampleData = {
  id: 1234567,
  first_name: 'Jane',
  email_address: 'jane@example.com',
  state: 'active',
  created_at: '2026-01-31T14:30:00.000Z',
  fields: {},
};

// Tested
export const addTag = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_subscriber_tag_add',
  classification: 'READ',
  displayName: 'Tag Added To Subscriber',
  description: 'Fires when a tag is added to a subscriber.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_tag_add',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_tag_add',
    });
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
  classification: 'READ',
  displayName: 'Tag Removed From Subscriber',
  description: 'Fires when a tag is removed from a subscriber.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_tag_remove',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_tag_remove',
    });
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
  classification: 'READ',
  displayName: 'Subscriber Activated',
  description: 'Fires when a subscriber confirms their subscription.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_activated',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_activated',
    });
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
  classification: 'READ',
  displayName: 'Subscriber Unsubscribed',
  description: 'Fires when a subscriber unsubscribes.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_unsubscribed',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_unsubscribed',
    });
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
  classification: 'READ',
  displayName: 'Subscriber Bounced',
  description: 'Fires when an email to a subscriber bounces.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_bounced',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_bounced',
    });
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
  classification: 'READ',
  displayName: 'Subscriber Complained',
  description: 'Fires when a subscriber marks an email as spam.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_complained',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_subscriber_complained',
    });
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
  classification: 'READ',
  displayName: 'New Form Subscriber',
  description: 'Fires when someone subscribes through a form.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_form_subscribed',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_form_subscribed',
    });
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
  classification: 'READ',
  displayName: 'New Sequence Subscriber',
  description: 'Fires when someone is added to a sequence.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_sequence_subscribed',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_sequence_subscribed',
    });
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
  classification: 'READ',
  displayName: 'Sequence Completed',
  description: 'Fires when a subscriber finishes a sequence.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_sequence_completed',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_sequence_completed',
    });
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
  classification: 'READ',
  displayName: 'Link Clicked',
  description: 'Fires when a subscriber clicks a link in an email.',
  aiMetadata: {
    description:
      'Fires when a subscriber clicks the specified link URL in a ConvertKit (Kit) email, via webhook. Returns the clicking subscriber record; use it to score engagement or trigger interest-based follow-ups.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_link_clicked',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_link_clicked',
    });
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// UNTESTED
// Broken UI at convertkit, reported to support. The Rukes page is not loading. It will load again, when the webhook is canceled.
export const productPurchased = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_product_purchased',
  classification: 'READ',
  displayName: 'Product Purchased',
  description: 'Fires when a subscriber buys a specific product.',
  aiMetadata: {
    description:
      'Fires when a subscriber purchases the selected ConvertKit (Kit) Commerce product, via webhook. Returns the purchasing subscriber record; use it to deliver the product, tag buyers, or record the sale elsewhere.',
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
    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_product_purchased',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_product_purchased',
    });
  },
  async run(context) {
    const body = context.payload.body as { subscriber: unknown };
    return [body.subscriber];
  },
});

// Untested. Webhook is created, but I have not tested if the trigger is firing.
export const purchaseCreated = createTrigger({
  auth: convertkitAuth,
  name: 'webhook_purchase_created',
  classification: 'READ',
  displayName: 'New Purchase',
  description: 'Fires on any new purchase.',
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

    await kitWebhookLifecycle.enable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_purchase_created',
      payload,
    });
  },
  async onDisable(context) {
    await kitWebhookLifecycle.disable({
      apiSecret: context.auth.secret_text,
      store: context.store,
      storeKey: '_webhook_purchase_created',
    });
  },
  async run(context) {
    const body = context.payload.body as {
      purchase: { subscriber: unknown };
    };
    return [body.purchase.subscriber];
  },
});
