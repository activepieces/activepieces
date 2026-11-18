import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { listEnginesOutputSchema } from '../common/output-schemas';

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export const listEngines = createAction({
  auth: stabilityAiAuth,
  name: 'list_engines',
  classification: 'SEARCH',
  displayName: 'List Engines',
  description: 'List the legacy v1 engines available to the connected account, for use as the Engine ID in Text to Image.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the legacy REST v1 engines (ID, name, description, type) the connected Stability AI API key can use, for example to check whether a legacy engine ID is still available. To create images use Generate Image, which picks its model directly. Free and safe to repeat.',
    idempotent: true,
  },
  props: {},
  outputSchema: listEnginesOutputSchema,
  async run(context) {
    const body = await stabilityClient.sendJson<unknown>({
      apiKey: context.auth.props.api_key,
      method: HttpMethod.GET,
      path: '/v1/engines/list',
    });
    if (!Array.isArray(body)) {
      throw new Error('Stability AI returned an unexpected engine list.');
    }
    return body.map((engine: EngineResponse) => ({
      id: readString(engine?.id),
      name: readString(engine?.name),
      description: readString(engine?.description),
      type: readString(engine?.type),
    }));
  },
});

type EngineResponse = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  type?: unknown;
} | null;
