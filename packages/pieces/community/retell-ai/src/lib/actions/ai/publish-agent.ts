import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const publishAgentAction = createAction({
  auth: retellAiAuth,
  name: 'publish_agent',
  classification: 'WRITE',
  displayName: 'Publish Agent',
  description: 'Publishes a draft version of a voice agent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes one draft version of a voice agent in place, so phone numbers and calls bound to the published agent start using it. Use List Agent Versions to find the draft version number. Publishing the same version again changes nothing.',
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice agent ID.' }),
    version: Property.Number({ displayName: 'Version', description: 'The draft version number to publish.', required: true }),
    version_title: Property.ShortText({ displayName: 'Version Title', description: 'Optional title for this version.', required: false }),
    version_description: Property.ShortText({
      displayName: 'Version Description',
      description: 'Optional note about what changed.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.agentPublished,
  async run({ auth, propsValue }) {
    const version = retellInput.optionalInteger({ value: propsValue.version, label: 'Version', min: 0 });
    if (version === undefined) {
      throw new Error('Version is required.');
    }
    const body: Record<string, unknown> = { version };
    const title = retellInput.optionalText(propsValue.version_title);
    if (title !== undefined) {
      body['version_title'] = title;
    }
    const description = retellInput.optionalText(propsValue.version_description);
    if (description !== undefined) {
      body['version_description'] = description;
    }
    const agentId = retellInput.seg({ value: propsValue.agent_id, label: 'Agent ID' });
    await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: `/publish-agent-version/${agentId}`,
      body,
    });
    return { agent_id: retellMap.str(decodeURIComponent(agentId)), version, published: true };
  },
});
