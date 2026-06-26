import { createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveGetAbout = createAction({
  auth: googleDriveAuth,
  name: 'drive_get_about',
  displayName: 'Get Account & Storage Info',
  description: 'Get the authenticated Drive account, storage quota, and supported formats.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the authenticated user\'s Drive info: account identity, storage quota and usage, and supported import/export formats. Use to check available space before a large upload, confirm which account is connected, or look up valid export MIME types. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      // about.get requires a fields parameter or the API returns 400.
      const response = await drive.about.get({
        fields: 'user,storageQuota,maxImportSizes,exportFormats',
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Permission denied fetching Drive account info. The connection may lack the required Drive scope.'
        );
      }
      throw error;
    }
  },
});
