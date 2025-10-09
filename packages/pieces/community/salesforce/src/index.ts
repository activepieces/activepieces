import {
  PieceAuth,
  Property,
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// Existing Actions
import { createNewObject } from './lib/action/create-new-object';
import { runQuery } from './lib/action/run-sf-query';
import { UpdateObjectById } from './lib/action/update-object-by-id';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { upsertByExternalIdBulk } from './lib/action/upsert-by-external-id-bulk';

// New Create Actions
import { createContact } from './lib/action/create-contact';
import { createLead } from './lib/action/create-lead';
import { createCase } from './lib/action/create-case';
import { createOpportunity } from './lib/action/create-opportunity';
import { createTask } from './lib/action/create-task';
import { createAttachment } from './lib/action/create-attachment';
import { createNote } from './lib/action/create-note';

// New Update Actions
import { updateContact } from './lib/action/update-contact';
import { updateLead } from './lib/action/update-lead';

// New Delete Actions
import { deleteOpportunity } from './lib/action/delete-opportunity';
import { deleteRecord } from './lib/action/delete-record';

// Campaign Actions
import { addContactToCampaign } from './lib/action/add-contact-to-campaign';
import { addLeadToCampaign } from './lib/action/add-lead-to-campaign';

// File Actions
import { addFileToRecord } from './lib/action/add-file-to-record';
import { getRecordAttachments } from './lib/action/get-record-attachments';

// Search Actions
import { findRecord } from './lib/action/find-record';
import { findChildRecords } from './lib/action/find-child-records';
import { findRecordsByQuery } from './lib/action/find-records-by-query';

// Advanced Actions
import { runReport } from './lib/action/run-report';
import { sendEmail } from './lib/action/send-email';

// Existing Triggers
import { newRecord } from './lib/trigger/new-record';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';

// New Triggers
import { newLead } from './lib/trigger/new-lead';
import { newContact } from './lib/trigger/new-contact';
import { newCaseAttachment } from './lib/trigger/new-case-attachment';
import { newFieldHistory } from './lib/trigger/new-field-history';
import { newOutboundMessage } from './lib/trigger/new-outbound-message';
import { newOrUpdatedFile } from './lib/trigger/new-updated-file';

export const salesforceAuth = PieceAuth.OAuth2({
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose environment',
      required: true,
      options: {
        options: [
          {
            label: 'Production',
            value: 'login',
          },
          {
            label: 'Development',
            value: 'test',
          },
        ],
      },
      defaultValue: 'login',
    }),
  },

  required: true,
  description: 'Authenticate with Salesforce Production',
  authUrl: 'https://{environment}.salesforce.com/services/oauth2/authorize',
  tokenUrl: 'https://{environment}.salesforce.com/services/oauth2/token',
  scope: ['refresh_token', 'full'],
});

export const salesforce = createPiece({
  displayName: 'Salesforce',
  description: 'CRM software solutions and enterprise cloud computing',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
  authors: [
    'HKudria',
    'tanoggy',
    'landonmoir',
    'kishanprmr',
    'khaledmashaly',
    'abuaboud',
  ],
  categories: [PieceCategory.SALES_AND_CRM],
  auth: salesforceAuth,
  actions: [
    // Advanced Query Actions
    runQuery,
    createNewObject,
    UpdateObjectById,
    upsertByExternalId,
    upsertByExternalIdBulk,
    
    // Create Actions
    createContact,
    createLead,
    createCase,
    createOpportunity,
    createTask,
    createAttachment,
    createNote,
    
    // Update Actions
    updateContact,
    updateLead,
    
    // Delete Actions
    deleteOpportunity,
    deleteRecord,
    
    // Campaign Actions
    addContactToCampaign,
    addLeadToCampaign,
    
    // File Actions
    addFileToRecord,
    getRecordAttachments,
    
    // Search Actions
    findRecord,
    findChildRecords,
    findRecordsByQuery,
    
    // Advanced Actions
    runReport,
    sendEmail,
    
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as OAuth2PropertyValue).data['instance_url'],
      auth: salesforceAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    // Generic Triggers
    newRecord,
    newOrUpdatedRecord,
    
    // Specific Object Triggers
    newLead,
    newContact,
    newCaseAttachment,
    newFieldHistory,
    
    // File & Message Triggers
    newOrUpdatedFile,
    newOutboundMessage,
  ],
});
