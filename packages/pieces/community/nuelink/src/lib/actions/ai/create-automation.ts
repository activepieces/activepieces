import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { NUELINK_LIMITS, nuelinkClient } from '../../common/client';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkInputs } from '../../common/inputs';
import { FEED_TYPES, IMPORT_TYPES, REFRESH_RATES } from '../../common/operations';

export const aiCreateAutomation = createAction({
  name: 'nuelink_create_automation',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Create Feed Automation',
  description: 'Creates an RSS or feed automation that turns new feed items into posts in a collection.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a feed importer (RSS, YouTube, WordPress, Shopify, …) that adds each new feed item as a post in a collection; those posts go to that collection\'s channels. By default posts are added as drafts and old items are not back-filled; addPostsAsDraft false makes new items publish through the queue, and loadOldPosts true with addPostsAsDraft false is refused. Automations cannot be deleted through the API: to stop one use nuelink_update_automation_status PAUSED. Nuelink fetches the feed first (400 if it cannot). Each call creates a new automation: after a timeout check nuelink_list_automations before retrying.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID (nuelink_list_collections) that receives the posts.' }),
    name: Property.ShortText({ displayName: 'Name', description: 'Automation name, up to 255 characters.', required: true }),
    type: Property.StaticDropdown({
      displayName: 'Feed Type',
      required: true,
      options: { options: FEED_TYPES.map((value) => ({ label: value, value })) },
    }),
    feedUrl: Property.ShortText({ displayName: 'Feed URL', description: 'Public http(s) URL of the feed.', required: true }),
    importAsType: Property.StaticDropdown({
      displayName: 'Import As',
      required: true,
      options: { options: IMPORT_TYPES.map((value) => ({ label: value, value })) },
    }),
    title: Property.ShortText({ displayName: 'Title Template', description: 'Up to 255 characters; placeholders {{title}}, {{description}}, {{link}}. Default {{title}}.', required: false }),
    caption: Property.ShortText({ displayName: 'Caption Template', description: 'Up to 255 characters; placeholders {{title}}, {{description}}, {{link}}.', required: false }),
    addPostsAsDraft: Property.Checkbox({ displayName: 'Add Posts as Drafts', description: 'Defaults to true. False lets imported posts publish through the queue.', required: false }),
    loadOldPosts: Property.Checkbox({ displayName: 'Import Existing Feed Items', description: 'Defaults to false. True back-fills the whole feed; only allowed with drafts.', required: false }),
    refreshRate: Property.StaticDropdown({
      displayName: 'Refresh Every (hours)',
      required: false,
      options: { options: REFRESH_RATES.map((value) => ({ label: `${value} h`, value })) },
    }),
  },
  outputSchema: nuelinkOutputSchemas.automation,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const props = context.propsValue;
    const brandId = nuelinkClient.numericId({ value: props.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.bodyId({ value: props.collectionId, label: 'Collection ID' });
    const name = nuelinkInputs.requiredText({ value: props.name, label: 'Name', max: 255 }).trim();
    const type = nuelinkInputs.oneOf({ value: props.type, label: 'Feed Type', allowed: FEED_TYPES });
    const importAsType = nuelinkInputs.oneOf({ value: props.importAsType, label: 'Import As', allowed: IMPORT_TYPES });
    if (type === undefined || importAsType === undefined) {
      throw new Error('Feed Type and Import As are required.');
    }
    const feedUrl = nuelinkInputs.httpUrl({ value: nuelinkInputs.requiredText({ value: props.feedUrl, label: 'Feed URL', max: 1000 }), label: 'Feed URL' });
    const title = nuelinkInputs.optionalText({ value: props.title, label: 'Title Template', max: 255 });
    const caption = nuelinkInputs.optionalText({ value: props.caption, label: 'Caption Template', max: 255 });
    const refreshRate = nuelinkInputs.optionalInteger({ value: props.refreshRate, label: 'Refresh Every (hours)', min: 1, max: 24 });
    if (refreshRate !== undefined && !REFRESH_RATES.includes(refreshRate)) {
      throw new Error('Refresh Every (hours) must be 1, 6, 12 or 24.');
    }
    const addPostsAsDraft = props.addPostsAsDraft === undefined || props.addPostsAsDraft === null ? true : nuelinkInputs.isChecked({ value: props.addPostsAsDraft });
    const loadOldPosts = props.loadOldPosts === undefined || props.loadOldPosts === null ? false : nuelinkInputs.isChecked({ value: props.loadOldPosts });
    if (loadOldPosts && !addPostsAsDraft) {
      throw new Error('Importing existing feed items is only allowed with Add Posts as Drafts on, so the whole feed is not pushed into the publishing queue.');
    }
    return nuelinkClient.request({
      apiKey,
      method: HttpMethod.POST,
      path: ['brands', brandId, 'automations'],
      body: {
        name,
        collectionId,
        type,
        feedUrl,
        importAsType,
        ...(title === undefined ? {} : { title }),
        ...(caption === undefined ? {} : { caption }),
        addPostsAsDraft,
        loadOldPosts,
        ...(refreshRate === undefined ? {} : { refreshRate }),
      },
      timeoutMs: NUELINK_LIMITS.createTimeoutMs,
      timeoutHint: 'The automation may still have been created. Check nuelink_list_automations before trying again.',
    });
  },
});
