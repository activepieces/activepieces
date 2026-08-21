import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenAssistant } from '../common/client';

export const createAssistant = createAction({
  auth: famulorAuth,
  name: 'createAssistant',
  displayName: 'Create Assistant',
  description: 'Create a single-prompt AI phone assistant. Only the name is required.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a Famulor AI phone assistant. Only name is required; prompt, first message, language, and timezone are optional. Each call creates a new assistant.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name shown in the Famulor dashboard',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System prompt',
      description: 'Role, tone, and behavior instructions for the assistant',
      required: false,
    }),
    first_message: Property.LongText({
      displayName: 'First message',
      description: 'Opening line the assistant says when the call starts',
      required: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Active',
      description: 'Enable the assistant immediately',
      required: false,
      defaultValue: true,
    }),
    primary_language: Property.ShortText({
      displayName: 'Primary language',
      description: 'ISO-639-1 language code, for example de or en',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone used for time-based variables, for example Europe/Berlin',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (!name) {
      throw new Error('Assistant name is required.');
    }

    const response = await famulorRequest({
      auth,
      method: HttpMethod.POST,
      path: '/assistants',
      body: {
        name,
        system_prompt: propsValue.system_prompt?.trim() || undefined,
        first_message: propsValue.first_message?.trim() || undefined,
        is_active: propsValue.is_active,
        primary_language: propsValue.primary_language?.trim() || undefined,
        timezone: propsValue.timezone?.trim() || undefined,
      },
    });

    return flattenAssistant(response);
  },
});
