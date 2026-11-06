import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const getFileAction = createAction({
  auth: figmaAuth,
  name: 'get_file',
  classification: 'READ',
  displayName: 'Get File',
  description: 'Gets a Figma file as JSON: pages, layers, components and styles. Set a depth or node IDs to keep the result small.',
  audience: 'human',
  aiMetadata: {
    description: 'Fetches the raw JSON document tree of a Figma file. Read-only and idempotent. Agents should use Get File Outline instead.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.getFile,
  props: {
    file_key: figmaProps.fileKey(),
    depth: Property.Number({
      displayName: 'Depth',
      description: 'How deep to read the tree: 1 = pages only, 2 = pages and their top-level layers. Leave empty for the whole file (can be very large).',
      required: false,
    }),
    ids: figmaProps.nodeIds({ required: false, description: 'Only return these nodes and their parents (e.g. 1:2). Leave empty for the whole file.' }),
    version: Property.ShortText({
      displayName: 'Version ID',
      description: 'Read an older version of the file. Leave empty for the current version.',
      required: false,
    }),
    branch_data: Property.Checkbox({
      displayName: 'Include Branches',
      description: 'Also return the list of branches of the file.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const depth = figmaClient.optionalInteger({ value: context.propsValue.depth, field: 'Depth', min: 1, max: 100 });
    const ids = figmaClient.nodeIds({ value: context.propsValue.ids, required: false });
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}`,
      query: {
        depth,
        ids: ids.length > 0 ? ids.join(',') : undefined,
        version: figmaClient.optionalText(context.propsValue.version),
        branch_data: context.propsValue.branch_data === true ? true : undefined,
      },
      scope: 'file_content:read',
      tier: 1,
      operation: 'get the file',
    });
    return { success: true, request_body: undefined, response_body: response.body };
  },
});
