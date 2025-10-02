import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import * as schemas from './schemas';

export const insightlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Insightly API key. You can find this in your Insightly account under User Settings > API Keys.',
  required: true,
});

export const INSIGHTLY_OBJECTS = [
  'Contacts',
  'Leads', 
  'Opportunities',
  'Organisations',
  'Projects',
  'Tasks',
  'Events',
  'Notes',
  'Products',
  'Quotations'
];

// Export schemas for validation (following ActivePieces pattern)
export const insightlyCommon = {
  // Schemas
  findRecordsSchema: schemas.findRecords,
  createRecordSchema: schemas.createRecord,
  updateRecordSchema: schemas.updateRecord,
  getRecordSchema: schemas.getRecord,
  deleteRecordSchema: schemas.deleteRecord,
  newRecordTriggerSchema: schemas.newRecordTrigger,
  updatedRecordTriggerSchema: schemas.updatedRecordTrigger,
  deletedRecordTriggerSchema: schemas.deletedRecordTrigger,
};

export async function makeInsightlyRequest(
  apiKey: string, 
  endpoint: string, 
  pod: string = 'na1',
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
  const url = `${baseUrl}${endpoint}`;

  const requestConfig: any = {
    method,
    url,
    authentication: {
      type: AuthenticationType.BASIC,
      username: apiKey,
      password: '',
    },
  };

  if (body && (method === HttpMethod.POST || method === HttpMethod.PUT)) {
    requestConfig.headers = {
      'Content-Type': 'application/json',
    };
    requestConfig.body = body;
  }

  return await httpClient.sendRequest(requestConfig);
}