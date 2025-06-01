import { zagomailAuth } from '../../';
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { StoredWebhookId, Tag, WebhookResponse } from '../common/constants';
import { isNil } from '@activepieces/shared';

const CACHE_KEY = 'zagomail_tagged_subscriber_trigger';

export const taggedSubscriber = createTrigger({
  auth: zagomailAuth,
  name: 'taggedSubscriber',
  displayName: 'Tagged Subscriber',
  description: 'Trigers when subscriber is tagged with a tag.',
  props: {
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'An Arbitrary name you would like to call this tag.',
      required: true,
    }),
  },
  sampleData: {
    action: 'tag-added',
    subscriber_uid: 'dg307jyx044e1',
    list_uid: 'or449cjkqqfb2',
    tagID: '38185',
    email: 'gs03dev@gmail.com',
    status: 'confirmed',
    created_at: '2025-05-11 08:26:16',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const tagName = context.propsValue.tagName;

    const tags = (await zagoMailApiService.getTags(context.auth)) as Tag[];

    const tagExists = tags.find((t) => t.ztag_name === tagName);

    let tag;

    if (tagExists) {
      tag = tagExists;
    } else {
      tag = (await zagoMailApiService.createTag(context.auth, tagName)) as Tag;
    }

    try {
      const response = (await zagoMailApiService.createWebhook(
        context.auth,
        context.webhookUrl,
        'tag-added',
        {
          tagID: tag.ztag_id,
        }
      )) as WebhookResponse;

      await context.store.put<StoredWebhookId>(CACHE_KEY, {
        webhookId: response.id,
      });
    } catch (err: any) {
      throw new Error(err);
    }
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhookId>(CACHE_KEY);
    if (!isNil(webhook) && !isNil(webhook.webhookId)) {
      await zagoMailApiService.deleteWebhook(context.auth, webhook.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
