import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { fieldsJsonProp } from '../../ai-common';
import { recordFromJson } from '../../common';
import { convertLeadSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';
import { assertRecordId } from '../../vtql';

export function convertLeadElement({
  leadId,
  assignedTo,
  contactFields,
  createAccount,
  accountFields,
  createPotential,
  potentialFields,
}: {
  leadId: unknown;
  assignedTo: string;
  contactFields: unknown;
  createAccount: unknown;
  accountFields: unknown;
  createPotential: unknown;
  potentialFields: unknown;
}): string {
  const potential = recordFromJson({ value: potentialFields, label: 'Deal Fields' });
  if (createPotential === true) {
    const missing = ['potentialname', 'closingdate', 'sales_stage'].filter(
      (field) => potential[field] === undefined || potential[field] === ''
    );
    if (missing.length > 0) {
      throw new Error(`Deal Fields must include ${missing.join(', ')} when Create Deal is on`);
    }
  }
  const entities: Record<string, Record<string, unknown>> = {
    Contacts: { ...recordFromJson({ value: contactFields, label: 'Contact Fields' }), create: true, name: 'Contacts' },
  };
  if (createAccount === true) {
    entities['Accounts'] = {
      ...recordFromJson({ value: accountFields, label: 'Organization Fields' }),
      create: true,
      name: 'Accounts',
    };
  }
  if (createPotential === true) {
    entities['Potentials'] = { ...potential, create: true, name: 'Potentials' };
  }
  return JSON.stringify({
    leadId: assertRecordId({ value: leadId, label: 'Lead ID' }),
    assignedTo: assertRecordId({ value: assignedTo, label: 'Assigned To' }),
    entities,
  });
}

export const convertLeadAction = createAction({
  auth: vtigerAuth,
  name: 'convert_lead',
  displayName: 'Convert Lead',
  description: 'Converts a Lead into a Contact, and optionally an Organization and a Deal.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Converts one Lead into a new Contact, optionally also creating an Organization and a Deal. Cannot be undone: the Lead is marked converted and leaves lead lists, and a second call fails or creates duplicates. A Deal needs potentialname, closingdate and sales_stage.',
    idempotent: false,
  },
  outputSchema: convertLeadSchema,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'Webservice ID of the Leads record, for example 10x123.',
      required: true,
    }),
    assignedTo: Property.ShortText({
      displayName: 'Assigned To',
      description: 'Webservice ID of the user who will own the new records. Defaults to the connected user.',
      required: false,
    }),
    contactFields: fieldsJsonProp({
      displayName: 'Contact Fields',
      description: 'Optional JSON of extra Contacts fields. Lead values are mapped automatically.',
      required: false,
    }),
    createAccount: Property.Checkbox({
      displayName: 'Create Organization',
      required: false,
      defaultValue: false,
    }),
    accountFields: fieldsJsonProp({
      displayName: 'Organization Fields',
      description: 'Optional JSON of Accounts fields, for example {"accountname": "Acme"}.',
      required: false,
    }),
    createPotential: Property.Checkbox({
      displayName: 'Create Deal',
      required: false,
      defaultValue: false,
    }),
    potentialFields: fieldsJsonProp({
      displayName: 'Deal Fields',
      description:
        'JSON of Potentials fields; required when Create Deal is on, for example {"potentialname": "Acme deal", "closingdate": "2026-12-31", "sales_stage": "Prospecting"}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const assignedTo =
      typeof propsValue.assignedTo === 'string' && propsValue.assignedTo.trim() !== ''
        ? propsValue.assignedTo.trim()
        : await currentUserId(auth.props);
    const element = convertLeadElement({ ...propsValue, assignedTo });
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.POST,
      path: 'convertlead',
      form: { element },
    });
    const created = isRecord(result) ? result : {};
    return {
      leadId: propsValue.leadId.trim(),
      contactId: typeof created['Contacts'] === 'string' ? created['Contacts'] : '',
      accountId: typeof created['Accounts'] === 'string' ? created['Accounts'] : '',
      potentialId: typeof created['Potentials'] === 'string' ? created['Potentials'] : '',
      result,
    };
  },
});

async function currentUserId(creds: { instance_url: string; username: string; password: string }): Promise<string> {
  const me = await vtigerRest<unknown>({ creds, method: HttpMethod.GET, path: 'me' });
  const id = isRecord(me) ? me['id'] : undefined;
  if (typeof id !== 'string') {
    throw new Error('Could not read the connected user ID; set Assigned To');
  }
  return id;
}
