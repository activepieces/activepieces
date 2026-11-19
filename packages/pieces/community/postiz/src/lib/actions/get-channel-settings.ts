import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizPath, requireText } from '../common';

export const getChannelSettings = createAction({
  auth: postizAuth,
  name: 'get_channel_settings',
  classification: 'READ',
  displayName: 'Get Channel Settings',
  description: 'Gets the posting rules and settings format for a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the posting rules, maximum post length and the JSON schema of the settings object for one connected Postiz channel. Call it before creating a post on a platform that needs settings (for example X, LinkedIn page, YouTube, Reddit) so the settings you pass are valid. Needs a channel ID from List Channels. Idempotent: read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'channel_id', label: 'Channel ID' },
      { key: 'rules', label: 'Posting Rules' },
      { key: 'max_length', label: 'Max Length', format: 'number' },
      { key: 'settings_schema', label: 'Settings Schema' },
      {
        key: 'tools',
        label: 'Tools',
        labelKey: 'method_name',
        listItems: [
          { key: 'method_name', label: 'Method Name' },
          { key: 'description', label: 'Description' },
        ],
      },
    ],
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'ID of the connected channel, from List Channels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const channelId = requireText({ value: propsValue.channel_id, label: 'Channel ID' });
    const response = await postizApiCall<{
      output?: {
        rules?: string;
        maxLength?: number;
        settings?: unknown;
        tools?: { methodName?: string; description?: string }[];
      };
    }>({
      auth,
      method: HttpMethod.GET,
      path: postizPath({ segments: ['integration-settings', channelId] }),
    });
    const output = response.body?.output ?? {};
    return {
      channel_id: channelId,
      rules: output.rules ?? null,
      max_length: output.maxLength ?? null,
      settings_schema: output.settings ?? null,
      tools: (output.tools ?? []).map((tool) => ({
        method_name: tool.methodName ?? null,
        description: tool.description ?? null,
      })),
    };
  },
});
