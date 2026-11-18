import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const getFileOutlineAction = createAction({
  auth: figmaAuth,
  name: 'get_file_outline',
  classification: 'READ',
  displayName: 'Get File Outline',
  description: 'Gets the pages and top-level layers of a Figma file (ID, name and type only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns a trimmed outline of a Figma file: its pages and, per page, the layers down to the requested depth, each as {id, name, type}. Accepts a file URL or key. Use it to find node IDs before Get File Nodes or Export Node Images. Costs one Tier 1 call (View/Collab seats get about 20 per month), so call it once per file. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.getFileOutline,
  props: {
    file_key: figmaProps.fileKey(),
    depth: Property.Number({
      displayName: 'Depth',
      description: '1 = pages only, 2 = pages and their top-level layers (default), 3 = one more level.',
      required: false,
      defaultValue: 2,
    }),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const depth = figmaClient.optionalInteger({ value: context.propsValue.depth, field: 'Depth', min: 1, max: 3 }) ?? 2;
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}`,
      query: { depth },
      scope: 'file_content:read',
      tier: 1,
      operation: 'get the file outline',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    const document = figmaClient.isRecord(body['document']) ? body['document'] : {};
    return {
      fileKey,
      name: body['name'] ?? null,
      lastModified: body['lastModified'] ?? null,
      version: body['version'] ?? null,
      editorType: body['editorType'] ?? null,
      thumbnailUrl: body['thumbnailUrl'] ?? null,
      pages: outline({ nodes: document['children'], levels: depth }),
    };
  },
});

type OutlineNode = { id: unknown; name: unknown; type: unknown; children?: OutlineNode[] };

function outline({ nodes, levels }: { nodes: unknown; levels: number }): OutlineNode[] {
  if (!Array.isArray(nodes) || levels < 1) return [];
  return nodes.filter(figmaClient.isRecord).map((node) => {
    const entry: OutlineNode = { id: node['id'] ?? null, name: node['name'] ?? null, type: node['type'] ?? null };
    if (levels > 1) entry.children = outline({ nodes: node['children'], levels: levels - 1 });
    return entry;
  });
}
