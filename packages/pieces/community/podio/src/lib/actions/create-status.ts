import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const createStatusAction = createAction({
  auth: podioAuth,
  name: 'create_status',
  displayName: 'Create Status Update',
  description: 'Creates a new status message for a user on a specific space. This is a rate-limited operation.',
  props: {
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    value: Property.LongText({
      displayName: 'Status Message',
      description: 'The actual status message',
      required: true,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Temporary files that have been uploaded and should be attached to this status',
      required: false,
    }),
    embedId: Property.Number({
      displayName: 'Embed ID',
      description: 'The id of an embedded link that has been created with the Add an embed operation',
      required: false,
    }),
    embedUrl: Property.ShortText({
      displayName: 'Embed URL',
      description: 'The url to be attached',
      required: false,
    }),
    question: Property.Object({
      displayName: 'Question',
      description: 'Any question to be attached. Format: {"text": "Question text", "options": ["Option 1", "Option 2"]}',
      required: false,
    }),
    alertInvite: Property.Checkbox({
      displayName: 'Alert Invite',
      description: 'True if any mentioned user should be automatically invited to the workspace if the user does not have access to the object',
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
      throw new Error('Space selection is required. Please select a Podio workspace from the dropdown.');
    }

    if (!value || value.trim().length === 0) {
      throw new Error('Status message is required. Please provide a message to post.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (question) {
      if (!question['text'] || typeof question['text'] !== 'string') {
        throw new Error('Question must have a "text" property with the question text.');
      }
      if (!question['options'] || !Array.isArray(question['options']) || question['options'].length === 0) {
        throw new Error('Question must have an "options" property with an array of answer choices.');
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

    if (embedUrl) {
      body.embed_url = embedUrl;
    }

    if (question && typeof question === 'object' && Object.keys(question).length > 0) {
      if (question['text'] && question['options']) {
        body.question = question;
      }
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