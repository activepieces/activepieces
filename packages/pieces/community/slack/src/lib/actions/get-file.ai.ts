import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getFileAction } from './get-file';

export const slackGetFile = createAction({
  auth: slackAuth,
  name: 'slack_get_file',
  displayName: 'Get File',
  description: 'Look up a Slack file by its ID and download its contents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up metadata for a single Slack file by its file ID and downloads its contents. Pick this when you have a file ID (e.g. from a message trigger or List Files) and need the file details or bytes. Use List Files to discover file IDs. Read-only and idempotent; fails if the file has no accessible download URL.',
    idempotent: true,
  },
  props: getFileAction.props,
  run: getFileAction.run,
});
