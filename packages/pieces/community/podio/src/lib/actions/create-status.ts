import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const createStatusAction = createAction({
  auth: podioAuth,
  name: 'create_status',
  displayName: 'Create Status Update',
  description: 'Add a status to an item or workspace stream.',
  props: {
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,

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
    const accessToken = getAccessToken(context.auth);
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

    if (question && typeof question === 'object') {
      if (!question['text'] || typeof question['text'] !== 'string') {
        throw new Error('Poll question must have a "text" property with the question text.');
      }
      if (!question['options'] || !Array.isArray(question['options']) || question['options'].length === 0) {
        throw new Error('Poll question must have an "options" array with at least one choice.');
      }
    }

    const body: any = {
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

    const queryParams: any = {};
    if (typeof alertInvite === 'boolean') {
      queryParams.alert_invite = alertInvite.toString();
    }

    const response = await podioApiCall<{
      status_id: number;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: `/status/space/${spaceId}/`,
      body,
      queryParams,
    });

    return response;
  },
}); 