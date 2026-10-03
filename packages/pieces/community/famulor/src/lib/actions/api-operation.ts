import { createAction, Property, type DynamicPropsValue, type FilesService } from '@activepieces/pieces-framework';
import { famulorAuth } from '../auth';
import { famulorApi } from '../common/client';
import { famulorProperties } from '../common/properties';
import { operations } from '../generated/catalog';
import type { ApiOperation } from '../common/types';

function operationById(id: unknown): ApiOperation {
  const operation = operations.find((operation) => operation.id === id);
  if (!operation) throw new Error('Select a supported Famulor API operation.');
  return operation;
}

async function result({ value, files, operation }: { value: unknown; files: FilesService; operation: ApiOperation }): Promise<unknown> {
  if (Buffer.isBuffer(value)) return { file: await files.write({ fileName: `${operation.id}.wav`, data: value }) };
  return value;
}

function nativeAction({ id, name }: { id: string; name?: string }) {
  const operation = operationById(id);
  const read = operation.method === 'GET';
  return createAction({
    auth: famulorAuth,
    name: name ?? operation.id,
    displayName: operation.summary.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    description: operation.description,
    audience: 'both',
    classification: operation.method === 'DELETE' || id === 'cancelBooking' ? 'DESTRUCTIVE' : read ? (id.startsWith('list') || id.startsWith('search') ? 'SEARCH' : 'READ') : 'WRITE',
    aiMetadata: { description: operation.description, idempotent: read },
    props: famulorProperties.operationProps(operation),
    outputSchema: { fields: [{ key: 'data', label: 'Data' }, { key: 'meta', label: 'Metadata' }] },
    async run(context) {
      return result({ value: await famulorApi.execute({ token: context.auth.secret_text, operation, values: context.propsValue }), files: context.files, operation });
    },
  });
}

export const nativeActions = [
  nativeAction({ id: 'getMe', name: 'getCurrentUser' }),
  nativeAction({ id: 'createCall', name: 'makePhoneCall' }),
  ...['listCalls', 'getCall', 'listAssistants', 'getAssistant', 'createAssistant', 'updateAssistant',
    'listAudienceContacts', 'createAudienceContact', 'listCampaigns', 'getCampaign', 'createCampaign',
    'startCampaign', 'stopCampaign', 'getCampaignStats', 'listLeads', 'getLead', 'addLeads', 'updateLead', 'deleteLead',
    'listPhoneNumbers', 'getPhoneNumber', 'searchAvailablePhoneNumbers', 'buyPhoneNumber', 'sendSms',
    'listHistory', 'getMessagingHistoryItem', 'listKnowledgeBases', 'createKnowledgeBase', 'getKnowledgeBase',
    'listBookings', 'getBooking', 'lookupBookings', 'createBooking', 'cancelBooking', 'listBookingSlots',
    'listTools', 'createTool', 'listWhatsAppTemplates', 'listVoices',
  ].map((id) => nativeAction({ id })),
];

export const apiOperation = createAction({
  auth: famulorAuth,
  name: 'run_api_operation',
  displayName: 'Run Workspace API Operation',
  description: 'Choose any operation from the complete Famulor workspace API catalog. Required scopes and workspace permissions still apply. Calls, messaging, purchases and campaign execution can consume credits.',
  audience: 'human',
  classification: 'DESTRUCTIVE',
  aiMetadata: { description: 'Run a selected workspace API operation, including destructive or billable operations. Use a dedicated action when available.', idempotent: false },
  props: {
    operation: Property.Dropdown({ auth: famulorAuth, displayName: 'Operation', required: true, refreshers: [], options: async () => ({ options: operations.map((operation) => ({ label: `${operation.tag} — ${operation.summary}`, value: operation.id })) }) }),
    input: Property.DynamicProperties({
      auth: famulorAuth, displayName: 'Inputs', required: true, refreshers: ['operation'],
      props: async ({ operation }): Promise<DynamicPropsValue> => {
        if (!operation) return {};
        const selected = operationById(operation);
        return { operation_info: Property.MarkDown({ value: selected.description }), ...famulorProperties.operationProps(selected) };
      },
    }),
  },
  async run(context) {
    const operation = operationById(context.propsValue.operation);
    return result({ value: await famulorApi.execute({ token: context.auth.secret_text, operation, values: context.propsValue.input }), files: context.files, operation });
  },
});
