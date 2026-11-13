import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const patchChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_patch_channel',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Update Channel',
  description: 'Updates a channel\'s name, display name, purpose or header.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a channel\'s name, display name, purpose or header; fields left empty stay as they are, and Clear Fields empties purpose or header. Direct and group messages only accept a header. Set at least one field. To switch public/private use Update Channel Privacy.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New unique handle used in the channel URL: lowercase letters, numbers, "-" and "_". The default channel cannot be renamed.',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'New channel name shown to users.',
      required: false,
    }),
    purpose: Property.ShortText({
      displayName: 'Purpose',
      description: 'New short description of what the channel is for.',
      required: false,
    }),
    header: Property.ShortText({
      displayName: 'Header',
      description: 'New Markdown text shown in the channel header.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: "purpose" and/or "header". Do not also set a value for a cleared field.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Purpose', value: 'purpose' },
          { label: 'Header', value: 'header' },
        ],
      },
    }),
  },
  async run(context) {
    const { channelId, name, displayName, purpose, header, clearFields } = context.propsValue;
    const cleared = clearFields ?? [];
    for (const field of cleared) {
      if (field !== 'purpose' && field !== 'header') {
        throw new Error(`Clear Fields accepts "purpose" or "header", got "${field}".`);
      }
    }
    if (cleared.includes('purpose') && purpose !== undefined) {
      throw new Error('Purpose is both set and listed in Clear Fields; pick one.');
    }
    if (cleared.includes('header') && header !== undefined) {
      throw new Error('Header is both set and listed in Clear Fields; pick one.');
    }
    const body = {
      ...(name !== undefined ? { name } : {}),
      ...(displayName !== undefined ? { display_name: displayName } : {}),
      ...(purpose !== undefined ? { purpose } : {}),
      ...(header !== undefined ? { header } : {}),
      ...(cleared.includes('purpose') ? { purpose: '' } : {}),
      ...(cleared.includes('header') ? { header: '' } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Name, Display Name, Purpose, Header or Clear Fields.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/channels/${encodeURIComponent(channelId)}/patch`,
      body,
    });
  },
});
