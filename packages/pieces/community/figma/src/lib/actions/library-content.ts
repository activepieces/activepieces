import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const listFileComponentsAction = createAction({
  auth: figmaAuth,
  name: 'list_file_components',
  classification: 'SEARCH',
  displayName: 'List File Components',
  description: 'Lists the published components of a Figma library file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the published components of a Figma library file as {fileKey, items, count}; each has key, name, description, node_id, thumbnail_url and containing_frame. Unpublished components are not returned. Branch URLs use the main file. Needs the library_content:read scope. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.listComponents,
  props: {
    file_key: figmaProps.fileKey('The Figma library file URL or file key (main file, not a branch).'),
  },
  async run(context) {
    return listLibrary({ auth: context.auth, fileKeyInput: context.propsValue.file_key, kind: 'components' });
  },
});

export const listFileStylesAction = createAction({
  auth: figmaAuth,
  name: 'list_file_styles',
  classification: 'SEARCH',
  displayName: 'List File Styles',
  description: 'Lists the published styles (colors, text, effects, grids) of a Figma library file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the published styles of a Figma library file as {fileKey, items, count}; each has key, name, style_type (FILL, TEXT, EFFECT, GRID), description and node_id. Branch URLs use the main file. Needs the library_content:read scope. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.listStyles,
  props: {
    file_key: figmaProps.fileKey('The Figma library file URL or file key (main file, not a branch).'),
  },
  async run(context) {
    return listLibrary({ auth: context.auth, fileKeyInput: context.propsValue.file_key, kind: 'styles' });
  },
});

async function listLibrary({ auth, fileKeyInput, kind }: { auth: unknown; fileKeyInput: unknown; kind: 'components' | 'styles' }) {
  const { mainFileKey } = figmaClient.parseFileKey(fileKeyInput);
  const response = await figmaClient.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.GET,
    path: `/v1/files/${figmaClient.segment({ value: mainFileKey, label: 'File Key' })}/${kind}`,
    scope: 'library_content:read',
    tier: 3,
    operation: `list the file ${kind}`,
  });
  const body = figmaClient.isRecord(response.body) ? response.body : {};
  const meta = figmaClient.isRecord(body['meta']) ? body['meta'] : {};
  const items = Array.isArray(meta[kind]) ? meta[kind] : [];
  return { fileKey: mainFileKey, items, count: items.length };
}
