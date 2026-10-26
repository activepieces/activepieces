import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { agentIdDropdown } from '../common/props';
import { retellSchemas } from '../common/schemas';

export const getAgent = createAction({
  auth: retellAiAuth,
  name: 'get_agent',
  classification: 'READ',
  displayName: 'Get Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Returns the configuration of one Retell voice agent, optionally a specific version. Read-only.',
    idempotent: true,
  },
  props: {
    agentId: agentIdDropdown({ displayName: 'Agent ID', required: true }),
    version: Property.Number({
      displayName: 'Version',
      description: 'Agent version to return. Leave empty for the latest version.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.rawAgent,
  async run({ propsValue, auth }) {
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-agent/${retellInput.seg({ value: propsValue.agentId, label: 'Agent ID' })}`,
      query: { version: retellInput.optionalInteger({ value: propsValue.version, label: 'Version', min: 0 }) },
      retryRateLimit: true,
    });
  },
});
