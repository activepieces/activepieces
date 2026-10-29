import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsSetAgentAvatarOutputSchema } from '../../output-schemas';

export const setAgentAvatar = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_set_agent_avatar',
  outputSchema: elevenlabsSetAgentAvatarOutputSchema,
  displayName: 'Set Agent Avatar',
  description: 'Upload an avatar image for an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Uploads an image as the agent avatar and returns the avatar URL. Uploading the same image again gives the same result.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
    avatarFile: Property.File({ displayName: 'Avatar File', description: 'Image file for the avatar', required: true }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('avatar_file', propsValue.avatarFile.data, propsValue.avatarFile.filename);
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/avatar`,
      formData,
    });
    return response ?? { success: true };
  },
});
