import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const getFileNodesAction = createAction({
  auth: figmaAuth,
  name: 'get_file_nodes',
  classification: 'READ',
  displayName: 'Get File Nodes',
  description: 'Gets the JSON of specific layers (nodes) in a Figma file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the JSON of the given nodes of a Figma file (e.g. frames found with Get File Outline), as a list of {nodeId, found, document}. Node IDs look like 1:2; the 1-2 form from a Figma URL is accepted. Set depth to limit the subtree. Tier 1 call (about 20 per month on View/Collab seats). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.getFileNodes,
  props: {
    file_key: figmaProps.fileKey(),
    ids: figmaProps.nodeIds({ required: true, description: 'Node IDs like 1:2 (or 1-2 as in the node-id of a Figma URL).' }),
    depth: Property.Number({
      displayName: 'Depth',
      description: 'How many levels below each node to return. Leave empty for the full subtree.',
      required: false,
    }),
    version: Property.ShortText({
      displayName: 'Version ID',
      description: 'Read an older version of the file. Leave empty for the current version.',
      required: false,
    }),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const ids = figmaClient.nodeIds({ value: context.propsValue.ids, required: true });
    const depth = figmaClient.optionalInteger({ value: context.propsValue.depth, field: 'Depth', min: 1, max: 100 });
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/nodes`,
      query: { ids: ids.join(','), depth, version: figmaClient.optionalText(context.propsValue.version) },
      scope: 'file_content:read',
      tier: 1,
      operation: 'get the file nodes',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    const nodes = figmaClient.isRecord(body['nodes']) ? body['nodes'] : {};
    return {
      fileKey,
      name: body['name'] ?? null,
      lastModified: body['lastModified'] ?? null,
      version: body['version'] ?? null,
      nodes: ids.map((nodeId) => {
        const entry = nodes[nodeId];
        if (!figmaClient.isRecord(entry)) return { nodeId, found: false, document: null };
        return { nodeId, found: true, document: entry['document'] ?? null, components: entry['components'] ?? {}, styles: entry['styles'] ?? {} };
      }),
    };
  },
});
