import { createAction, Property } from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../../..';
import { backblazeCommon } from '../../common';
import { backblazeDeleteFileOutputSchema } from '../../output-schemas';
import { backblazeAiCommon } from './ai-common';

export const backblazeDeleteFileAi = createAction({
  auth: backBlazeS3Auth,
  name: 'backblaze_delete_file',
  outputSchema: backblazeDeleteFileOutputSchema,
  displayName: 'Delete File',
  description: 'Deletes a file from the connected bucket. Each call adds a hide marker; earlier versions are kept.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes the file at the exact key in the connected Backblaze B2 bucket. B2 keeps file versions by default, so each call adds a hide marker (delete marker) and earlier versions are kept until the bucket lifecycle removes them; "versionId" is the delete marker id when one is returned. Deleting a key that does not exist also succeeds, but repeating the call adds another hide marker version each time, so do not retry a delete that already succeeded.',
    idempotent: false,
  },
  props: {
    key: Property.ShortText({
      displayName: 'File Key',
      description: 'The full key of the file to delete, as returned by List Files.',
      required: true,
    }),
  },
  async run(context) {
    const { bucket } = context.auth.props;
    const { key } = context.propsValue;
    const s3 = backblazeCommon.createBackBlazeS3(context.auth.props);
    const response = await backblazeAiCommon.call({
      operation: 'delete file',
      key,
      request: () => s3.deleteObject({ Bucket: bucket, Key: key }),
    });
    return { key, deleted: true, versionId: response.VersionId ?? null };
  },
});
