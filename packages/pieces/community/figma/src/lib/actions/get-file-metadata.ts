import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const getFileMetadataAction = createAction({
  auth: figmaAuth,
  name: 'get_file_metadata',
  classification: 'READ',
  displayName: 'Get File Metadata',
  description: 'Gets the name, project, last edit, creator and link of a Figma file without loading its content.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns metadata of a Figma file (name, project name, last edited time and user, creator, editor type, version, URL) without the document tree. Accepts a file URL or key. Cheap Tier 3 call: prefer it over Get File Outline when only metadata is needed. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.getFileMetadata,
  props: {
    file_key: figmaProps.fileKey(),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/meta`,
      scope: 'file_metadata:read',
      tier: 3,
      operation: 'get the file metadata',
    });
    const file = figmaClient.isRecord(response.body) && figmaClient.isRecord(response.body['file']) ? response.body['file'] : {};
    return { fileKey, ...file };
  },
});
