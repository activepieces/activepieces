import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateCommandOutputSchema } from '../../../output-schemas';

export const updateCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_command',
  outputSchema: mattermostCreateCommandOutputSchema,
  displayName: 'Update Slash Command',
  description: 'Changes a custom slash command\'s settings.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a custom slash command\'s trigger, URL, method, title, description, response username or autocomplete settings; fields not given keep their value. Takes the ID from List Slash Commands or Create Slash Command. Use Move Slash Command to change its team.',
    idempotent: true,
  },
  props: {
    commandId: Property.ShortText({
      displayName: 'Command ID',
      description: 'Custom slash command ID (26 characters). Use List Slash Commands or Create Slash Command to find it.',
      required: true,
    }),
    trigger: Property.ShortText({
      displayName: 'Trigger Word',
      description: 'Word that runs the command, without the leading "/", e.g. "deploy".',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Request URL',
      description: 'URL Mattermost calls when the command runs.',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Request Method',
      description: '"P" for POST, "G" for GET.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'POST', value: 'P' },
          { label: 'GET', value: 'G' },
        ],
      },
    }),
    displayName: Property.ShortText({
      displayName: 'Title',
      description: 'Command title shown in the integrations list.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the command does.',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Response Username',
      description: 'Username the command\'s responses are posted as.',
      required: false,
    }),
    autoComplete: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Autocomplete',
      description: '"true" to list the command in the slash-command autocomplete, "false" to hide it.',
    }),
    autoCompleteDesc: Property.ShortText({
      displayName: 'Autocomplete Description',
      description: 'Description shown in autocomplete.',
      required: false,
    }),
    autoCompleteHint: Property.ShortText({
      displayName: 'Autocomplete Hint',
      description: 'Argument hint shown in autocomplete, e.g. "[environment]".',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    if (p.method !== undefined && p.method !== 'P' && p.method !== 'G') {
      throw new Error(`Request Method must be "P" or "G", got "${p.method}".`);
    }
    const autoComplete = mattermostUtils.parseBoolean({ value: p.autoComplete });
    const path = `/commands/${encodeURIComponent(p.commandId)}`;
    const current = await mattermostClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path,
    });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path,
      body: {
        ...current,
        ...(p.trigger !== undefined ? { trigger: p.trigger } : {}),
        ...(p.url !== undefined ? { url: p.url } : {}),
        ...(p.method !== undefined ? { method: p.method } : {}),
        ...(p.displayName !== undefined ? { display_name: p.displayName } : {}),
        ...(p.description !== undefined ? { description: p.description } : {}),
        ...(p.username !== undefined ? { username: p.username } : {}),
        ...(autoComplete !== undefined ? { auto_complete: autoComplete } : {}),
        ...(p.autoCompleteDesc !== undefined ? { auto_complete_desc: p.autoCompleteDesc } : {}),
        ...(p.autoCompleteHint !== undefined ? { auto_complete_hint: p.autoCompleteHint } : {}),
      },
    });
  },
});
