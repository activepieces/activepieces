import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const updatePathway = createAction({
  auth: blandAiAuth,
  name: 'update_pathway',
  displayName: 'Update Pathway',
  description:
    'Update a conversational pathway\'s fields — name, description, nodes, and edges.',
  props: {
    pathwayId: Property.ShortText({
      displayName: 'Pathway ID',
      description:
        'The unique identifier of the conversational pathway to update.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the conversational pathway.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the pathway.',
      required: false,
    }),
    nodes: Property.Json({
      displayName: 'Nodes',
      description:
        'JSON array of node objects representing conversation flow points. Each node has id, type (Default, End Call, Transfer Call, Webhook, etc.), and a data object.',
      required: false,
    }),
    edges: Property.Json({
      displayName: 'Edges',
      description:
        'JSON array of edge objects connecting nodes. Each edge has id, source, target, and a label.',
      required: false,
    }),
  },
  async run(context) {
    const { pathwayId, name, description, nodes, edges } = context.propsValue;

    const body: Record<string, unknown> = {};

    if (name) body['name'] = name;
    if (description) body['description'] = description;
    if (nodes) body['nodes'] = nodes;
    if (edges) body['edges'] = edges;

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/pathway/${encodeURIComponent(pathwayId)}`,
      body,
    });
  },
});
