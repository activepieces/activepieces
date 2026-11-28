import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateFolderMetadataOutputSchema } from '../../../output-schemas';

export const updateFileMetadataAction = createAction({
  auth: boxAuth,
  name: 'box_update_file_metadata',
  outputSchema: boxCreateFolderMetadataOutputSchema,
  displayName: 'Update File Metadata',
  description: 'Changes the values of a metadata instance on a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes field values of a metadata template already on a file, with JSON-Patch operations applied atomically: if one fails, nothing changes. Use Create File Metadata when the template is not on the file yet. Scope and template key come from List File Metadata.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    scope: boxAiProps.metadataScope({ required: true }),
    templateKey: boxAiProps.metadataTemplateKey({
      required: true,
      description: 'The template\'s key, e.g. "properties" for free-form, or $template from List File Metadata.',
    }),
    operations: Property.Json({
      displayName: 'Operations',
      description:
        'JSON array of JSON-Patch operations. op is add, replace, remove, test, move or copy; path is "/<fieldKey>"; value is required for add, replace and test; from for move and copy. E.g. [{"op": "replace", "path": "/status", "value": "approved"}].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.operations) || propsValue.operations.length === 0) {
      throw new Error('Operations must be a non-empty JSON array of JSON-Patch operations.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/${encodeURIComponent(propsValue.scope)}/${encodeURIComponent(propsValue.templateKey)}`,
      headers: { 'Content-Type': 'application/json-patch+json' },
      body: propsValue.operations,
    });
  },
});
