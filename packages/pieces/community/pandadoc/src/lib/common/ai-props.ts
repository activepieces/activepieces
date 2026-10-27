import { Property } from '@activepieces/pieces-framework';

function documentId() {
  return Property.ShortText({
    displayName: 'Document ID',
    description: 'The PandaDoc document ID, for example from Search Documents or a create step.',
    required: true,
  });
}

function recipients({ required }: { required: boolean }) {
  return Property.Array({
    displayName: 'Recipients',
    description: 'People who will receive the document. Each needs an email (or phone). Role must match a role name in the template or file.',
    required,
    properties: {
      email: Property.ShortText({ displayName: 'Email', required: false }),
      phone: Property.ShortText({ displayName: 'Phone', required: false }),
      first_name: Property.ShortText({ displayName: 'First Name', required: false }),
      last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
      role: Property.ShortText({ displayName: 'Role', required: false }),
      signing_order: Property.Number({ displayName: 'Signing Order', required: false }),
    },
  });
}

function fieldValues() {
  return Property.Object({
    displayName: 'Field Values',
    description: 'Values for fields, keyed by merge field name, for example {"client_name": "Jane Doe", "agree": true}. Get merge field names from Get Template Details.',
    required: false,
  });
}

function waitUntilReady() {
  return Property.Checkbox({
    displayName: 'Wait Until Ready to Send',
    description: 'Wait (up to 90 seconds) until PandaDoc finishes preparing the document, so it can be sent right away.',
    required: false,
    defaultValue: true,
  });
}

export const pandadocAiProps = { documentId, recipients, fieldValues, waitUntilReady };
