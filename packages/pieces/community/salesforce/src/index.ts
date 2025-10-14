import {
    PieceAuth,
    Property,
    createPiece,
    OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';


import { addContactToCampaign } from './lib/action/add-contact-to-campaign';
import { addFileToRecord } from './lib/action/add-file-to-record';
import { addLeadToCampaign } from './lib/action/add-lead-to-campaign';
import { createAttachment } from './lib/action/create-attachment';
import { createCase } from './lib/action/create-case';
import { createContact } from './lib/action/create-contact';
import { createLead } from './lib/action/create-lead';
import { createNote } from './lib/action/create-note';
import { createOpportunity } from './lib/action/create-opportunity';
import { createRecord } from './lib/action/create-record';
import { createTask } from './lib/action/create-task';
import { deleteOpportunity } from './lib/action/delete-opportunity';
import { deleteRecord } from './lib/action/delete-record';
import { findChildRecords } from './lib/action/find-child-records';
import { findRecord } from './lib/action/find-record';
import { findRecordsByQuery } from './lib/action/find-records-by-query';
import { getRecordAttachments } from './lib/action/get-record-attachments';
import { runQuery } from './lib/action/run-sf-query';
import { runReport } from './lib/action/run-report';
import { sendEmail } from './lib/action/send-email';
import { updateContact } from './lib/action/update-contact';
import { updateLead } from './lib/action/update-lead';
import { updateRecord } from './lib/action/update-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { upsertByExternalIdBulk } from './lib/action/upsert-by-external-id-bulk';


import { newCaseAttachment } from './lib/trigger/new-case-attachment';
import { newContact } from './lib/trigger/new-contact';
import { newFieldHistoryEvent } from './lib/trigger/new-field-history-event';
import { newLead } from './lib/trigger/new-lead';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { newOutboundMessage } from './lib/trigger/new-outbound-message';
import { newRecord } from './lib/trigger/new-record';
import { newUpdatedFile } from './lib/trigger/new-updated-file';

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
    scope: ['refresh_token', 'full' ,'api'],
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
        'Pranith124',
    ],
    categories: [PieceCategory.SALES_AND_CRM],
    auth: salesforceAuth,
    actions: [
        addContactToCampaign,
        addFileToRecord,
        addLeadToCampaign,
        createAttachment,
        createCase,
        createContact,
        createLead,
        createNote,
        createOpportunity,
        createRecord,
        createTask,
        deleteOpportunity,
        deleteRecord,
        findChildRecords,
        findRecord,
        findRecordsByQuery,
        getRecordAttachments,
        runQuery,
        runReport,
        sendEmail,
        updateContact,
        updateLead,
        updateRecord,
        upsertByExternalId,
        upsertByExternalIdBulk,
        createCustomApiCallAction({
            baseUrl: (auth) => (auth as OAuth2PropertyValue).data['instance_url'],
            auth: salesforceAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [
        newCaseAttachment,
        newContact,
        newFieldHistoryEvent,
        newLead,
        newOrUpdatedRecord,
        newOutboundMessage,
        newRecord,
        newUpdatedFile,
    ],
});