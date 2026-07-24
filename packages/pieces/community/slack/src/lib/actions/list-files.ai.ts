import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackListFiles = createAction({
  auth: slackAuth,
  name: 'slack_list_files',
  displayName: 'List Files',
  description: 'List files in the workspace, optionally filtered by channel, user, or type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists files in the workspace, optionally filtered by channel, uploading user, file type, or a created-time window. Use this to discover file IDs to then pass to Get File, Make File Public, or Revoke File Public URL; use Get File when you already have a specific file ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Only return files shared in this channel (e.g. C0123ABCD). Pass a channel ID, or resolve a #name first with Find Channel. Leave empty for all channels.',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      description: 'Only return files uploaded by this user ID (e.g. U0123ABCD). Leave empty for all users.',
      required: false,
    }),
    types: Property.ShortText({
      displayName: 'File Types',
      description:
        "Comma-separated file types to filter by. One or more of: 'all', 'spaces', 'snippets', 'images', 'gdocs', 'zips', 'pdfs'. Defaults to 'all'.",
      required: false,
    }),
    ts_from: Property.ShortText({
      displayName: 'Created After (timestamp)',
      description: 'Only return files created at or after this Unix timestamp (e.g. 1710304378).',
      required: false,
    }),
    ts_to: Property.ShortText({
      displayName: 'Created Before (timestamp)',
      description: 'Only return files created at or before this Unix timestamp (e.g. 1710304378).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of files to return per page (1-1000). Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const { channel, user, types, ts_from, ts_to, limit } = context.propsValue;

    const response = await client.files.list({
      channel: channel || undefined,
      user: user || undefined,
      types: types || undefined,
      ts_from: ts_from || undefined,
      ts_to: ts_to || undefined,
      count: limit ?? 100,
    });

    return {
      files: response.files ?? [],
      count: response.files?.length ?? 0,
      paging: response.paging,
    };
  },
});
