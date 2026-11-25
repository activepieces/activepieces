import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { createStatusOutputSchema } from '../../../output-schemas';

export const createStatusAction = createAction({
  auth: podioAuth,
  name: 'podio_create_status',
  outputSchema: createStatusOutputSchema,
  displayName: 'Create Status',
  description: 'Posts a status update to a workspace, optionally with files, a link or a poll.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a status message to one Podio workspace stream, with optional files, link and a poll question. Each call posts a new status; use Update Status to correct one. The space id comes from List Org Spaces; Question Text and Question Options go together.',
    idempotent: false,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace to post in.' }),
    value: podioAiProps.longText({ required: true, displayName: 'Message', description: 'The text of the status message.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach as a link.' }),
    questionText: podioAiProps.text({ required: false, displayName: 'Question Text', description: 'The question of a poll to attach. Requires Question Options.' }),
    questionOptions: podioAiProps.idList({ required: false, displayName: 'Question Options', description: 'The answer options of the poll, as text. Requires Question Text.' }),
    alertInvite: podioAiProps.bool({ required: false, displayName: 'Invite Mentioned Users', description: '"true" invites mentioned users who are not in the workspace. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    const { spaceId, value, fileIds, embedId, embedUrl, questionText, questionOptions, alertInvite } = propsValue;
    const hasOptions = Boolean(questionOptions?.length);
    if (Boolean(questionText) !== hasOptions) {
      throw new Error('Set Question Text and Question Options together, or neither.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/status/space/${spaceId}/`,
      query: podioUtils.query({ values: { alert_invite: podioUtils.toBool({ value: alertInvite }) } }),
      body: podioUtils.body({
        values: {
          value,
          file_ids: fileIds?.length ? fileIds.map(Number) : undefined,
          embed_id: embedId ? Number(embedId) : undefined,
          embed_url: embedUrl || undefined,
          question: questionText ? { text: questionText, options: questionOptions } : undefined,
        },
      }),
    });
  },
});
