import axios from 'axios';
import { createPiece, PieceAuth, PieceTrigger, PieceAction } from '@activepieces/pieces-framework';

// Authentication (API Key)
const knackAuth = PieceAuth.SecretText({
  displayName: 'Knack API Key',
  required: true,
});

// Helper: Knack API base URL
const KNACK_API_BASE = 'https://api.knack.com/v1';

// Helper: API request
async function knackRequest({ method, url, apiKey, data = {}, params = {} }) {
  return axios({
    method,
    url: `${KNACK_API_BASE}${url}`,
    headers: {
      'X-Knack-Application-Id': apiKey,
      'Content-Type': 'application/json',
    },
    data,
    params,
  });
}

// Triggers
export const newFormSubmission = PieceTrigger({
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  auth: knackAuth,
  async run(context) {
    // Example: Poll for new submissions (replace with actual logic)
    // TODO: Implement webhook or polling for form submissions
    return [];
  },
});

export const newRecord = PieceTrigger({
  name: 'new_record',
  displayName: 'New Record',
  auth: knackAuth,
  async run(context) {
    // TODO: Implement polling or webhook for new records
    return [];
  },
});

export const updatedRecord = PieceTrigger({
  name: 'updated_record',
  displayName: 'Updated Record',
  auth: knackAuth,
  async run(context) {
    // TODO: Implement polling or webhook for updated records
    return [];
  },
});

export const deletedRecord = PieceTrigger({
  name: 'deleted_record',
  displayName: 'Deleted Record',
  auth: knackAuth,
  async run(context) {
    // TODO: Implement polling or webhook for deleted records
    return [];
  },
});

// Actions
export const createRecord = PieceAction({
  name: 'create_record',
  displayName: 'Create Record',
  auth: knackAuth,
  async run(context) {
    const { apiKey, objectKey, recordData } = context;
    const response = await knackRequest({
      method: 'POST',
      url: `/objects/${objectKey}/records`,
      apiKey,
      data: recordData,
    });
    return response.data;
  },
});

export const updateRecord = PieceAction({
  name: 'update_record',
  displayName: 'Update Record',
  auth: knackAuth,
  async run(context) {
    const { apiKey, objectKey, recordId, updateData } = context;
    const response = await knackRequest({
      method: 'PUT',
      url: `/objects/${objectKey}/records/${recordId}`,
      apiKey,
      data: updateData,
    });
    return response.data;
  },
});

export const deleteRecord = PieceAction({
  name: 'delete_record',
  displayName: 'Delete Record',
  auth: knackAuth,
  async run(context) {
    const { apiKey, objectKey, recordId } = context;
    const response = await knackRequest({
      method: 'DELETE',
      url: `/objects/${objectKey}/records/${recordId}`,
      apiKey,
    });
    return response.data;
  },
});

export const findRecord = PieceAction({
  name: 'find_record',
  displayName: 'Find Record',
  auth: knackAuth,
  async run(context) {
    const { apiKey, objectKey, filters } = context;
    const response = await knackRequest({
      method: 'GET',
      url: `/objects/${objectKey}/records`,
      apiKey,
      params: filters,
    });
    return response.data;
  },
});

// Piece definition
export const knack = createPiece({
  displayName: 'Knack',
  logoUrl: 'https://www.knack.com/favicon.ico',
  authors: ['your-github-handle'],
  auth: knackAuth,
  triggers: [newFormSubmission, newRecord, updatedRecord, deletedRecord],
  actions: [createRecord, updateRecord, deleteRecord, findRecord],
});
