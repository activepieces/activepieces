import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import type { PodioAuthValue } from '../../../common/types';
import { podioUtils } from '../../../common/utils';
import { podioUpdateAppOutputSchema } from '../../../output-schemas';

export const updateAppAction = createAction({
  auth: podioAuth,
  name: 'podio_update_app',
  outputSchema: podioUpdateAppOutputSchema,
  displayName: 'Update App',
  description: 'Updates an app: its configuration, new or changed fields, and fields to delete.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Updates a Podio app in one call: config keys you set are merged into the current configuration, Fields adds new fields or changes existing ones, and Fields to Delete removes fields (with their values when delete_values is true). Fields not listed are kept. For one field use Create App Field, Update App Field or Delete App Field. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to update.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The new name of the app.' }),
    itemName: podioAiProps.text({ required: false, displayName: 'Item Name', description: 'The new name of one item in the app.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The new description of the app.' }),
    usage: podioAiProps.longText({ required: false, displayName: 'Usage', description: 'The new usage instructions of the app.' }),
    icon: podioAiProps.text({ required: false, displayName: 'Icon', description: 'The new icon, such as "141.png", from Get Icon Suggestions.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'An id from an external system to store on the app.' }),
    config: podioAiProps.json({
      required: false,
      displayName: 'Additional Config',
      description: 'Other app config keys to change as a JSON object, such as {"allow_edit": false, "fivestar": true, "fivestar_label": "Rating"}. The fields above override the same keys here.',
    }),
    fields: podioAiProps.json({
      required: false,
      displayName: 'Fields',
      description: 'Fields to add or change as a JSON array. A new field is {"type": "text", "config": {"label": "Title"}}; an existing one is {"field_id": 123, "config": {"label": "New label"}} with the field id from Get App.',
    }),
    fieldsToDelete: podioAiProps.json({
      required: false,
      displayName: 'Fields to Delete',
      description: 'Fields to delete as a JSON array, such as [{"field_id": 123, "delete_values": false}]. delete_values true also deletes the stored values for good.',
    }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const changes = {
      ...propsValue.config,
      ...podioUtils.body({
        values: {
          name: propsValue.name,
          item_name: propsValue.itemName,
          description: propsValue.description,
          usage: propsValue.usage,
          icon: propsValue.icon,
          external_id: propsValue.externalId,
        },
      }),
    };
    const hasConfig = Object.keys(changes).length > 0;
    if (!hasConfig && propsValue.fields === undefined && propsValue.fieldsToDelete === undefined) {
      throw new Error('Set at least one of the config props, Fields or Fields to Delete.');
    }
    const config = hasConfig ? await mergeConfig({ auth, appId: propsValue.appId, changes }) : undefined;
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/app/${propsValue.appId}/v2`,
      query: podioUtils.query({ values: { silent: podioUtils.toBool({ value: propsValue.silent }) } }),
      body: podioUtils.body({ values: { config, fields: propsValue.fields, fields_to_delete: propsValue.fieldsToDelete } }),
    });
  },
});

async function mergeConfig({ auth, appId, changes }: { auth: PodioAuthValue; appId: string; changes: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const current = await podioApi.getApp({ auth, appId });
  const kept = Object.fromEntries(Object.entries(current.config ?? {}).filter(([key]) => APP_CONFIG_KEYS.includes(key)));
  return { ...kept, ...changes };
}

const APP_CONFIG_KEYS = [
  'type',
  'name',
  'item_name',
  'description',
  'usage',
  'external_id',
  'icon',
  'allow_edit',
  'default_view',
  'allow_attachments',
  'allow_comments',
  'silent_creates',
  'silent_edits',
  'fivestar',
  'fivestar_label',
  'approved',
  'thumbs',
  'thumbs_label',
  'rsvp',
  'rsvp_label',
  'yesno',
  'yesno_label',
];
