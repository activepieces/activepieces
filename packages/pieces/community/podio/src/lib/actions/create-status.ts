import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioAuth } from '../auth';
import { createStatusOutputSchema } from '../output-schemas';

export const createStatusAction = createAction({
  auth: podioAuth,
  name: 'create_status',
  outputSchema: createStatusOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Status Update',
  description: 'Add a status to an item or workspace stream.',
  audience: 'human',
  aiMetadata: { description: 'Posts a status update to a Podio workspace (space) stream, optionally with file/embed attachments or an attached poll. Use to share an announcement or post to a space feed; requires the space id and a status message. Not idempotent — each call posts a new status update.', idempotent: false },
  props: {
    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),

    value: Property.LongText({
      displayName: 'Status Message',
      description: 'What would you like to share?',
      required: true,
    }),

    fileIds: Property.Array({
      displayName: 'Attach Files',
      description: 'File IDs to attach to this status update (enter file IDs from the space)',
      required: false,
    }),
    embedId: Property.Number({
      displayName: 'Embed ID',
      description: 'ID of a previously created embedded link',
      required: false,
    }),
    embedUrl: Property.ShortText({
      displayName: 'Embed URL',
      description: 'URL to embed in the status update',
      required: false,
    }),

    question: Property.Object({
      displayName: 'Add Poll',
      description: 'Create a poll with your status. Format: {"text": "Question?", "options": ["Option 1", "Option 2"]}',
      required: false,
    }),

    alertInvite: Property.Checkbox({
      displayName: 'Auto-Invite Mentioned Users',
      description: 'Automatically invite mentioned users to the workspace if they lack access',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { 
      spaceId, 
      value, 
      fileIds, 
      embedId, 
      embedUrl, 
      question, 
      alertInvite 
    } = context.propsValue;

    if (!spaceId) {
      throw new Error('Space selection is required. Please select a workspace to post your status to.');
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Status message is required and cannot be empty.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array.');
    }

    if (embedId && typeof embedId !== 'number') {
      throw new Error('Embed ID must be a number.');
    }

    if (question && typeof question === 'object' && Object.keys(question).length > 0) {
      if (!question['text'] || typeof question['text'] !== 'string') {
        throw new Error('Poll question must have a "text" property with the question text.');
      }
      if (!question['options'] || !Array.isArray(question['options']) || question['options'].length === 0) {
        throw new Error('Poll question must have an "options" array with at least one choice.');
      }
    }

    const body: CreateStatusBody = {
      value: value.trim(),
    };

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (embedId) {
      body.embed_id = embedId;
    }

    if (embedUrl && embedUrl.trim()) {
      body.embed_url = embedUrl.trim();
    }

    if (question && typeof question === 'object' && question['text'] && question['options']) {
      body.question = question;
    }

    const queryParams: QueryParams = {};
    if (typeof alertInvite === 'boolean') {
      queryParams['alert_invite'] = alertInvite.toString();
    }

    return await podioClient.request<{
      status_id: number;
    }>({
      method: HttpMethod.POST,
      auth: context.auth,
      path: `/status/space/${spaceId}/`,
      body,
      query: queryParams,
    });
  },
});

type CreateStatusBody = {
  value: string;
  file_ids?: unknown[];
  embed_id?: number;
  embed_url?: string;
  question?: Record<string, unknown>;
};
