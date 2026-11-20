import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, normalizeEmail, parseMailingListId, sendpulseApiCall, SendPulseAuthProps } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

function stringifyValue(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value);
}

async function runStep({ call, label }: { call: () => Promise<unknown>; label: string }): Promise<string | null> {
  try {
    const result = await call();
    if (isRecord(result) && result['result'] === true) {
      return null;
    }
    return `${label}: unexpected response ${JSON.stringify(result)}`;
  } catch (error) {
    return `${label}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function updatePhone({ auth, listId, email, phone }: { auth: SendPulseAuthProps; listId: string; email: string; phone: string }): Promise<string | null> {
  return runStep({
    label: 'phone update',
    call: () => sendpulseApiCall<unknown>({
      method: HttpMethod.PUT,
      auth,
      resourceUri: `/addressbooks/${listId}/phone`,
      operation: 'update subscriber phone',
      body: { email, phone },
    }),
  });
}

async function updateVariables({ auth, listId, email, variables }: { auth: SendPulseAuthProps; listId: string; email: string; variables: { name: string; value: string }[] }): Promise<string | null> {
  return runStep({
    label: 'variables update',
    call: () => sendpulseApiCall<unknown>({
      method: HttpMethod.POST,
      auth,
      resourceUri: `/addressbooks/${listId}/emails/variable`,
      operation: 'update subscriber variables',
      body: { email, variables },
    }),
  });
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'phoneUpdated', label: 'Phone Updated', format: 'boolean' },
    { key: 'variablesUpdated', label: 'Variables Updated' },
  ],
};

export const updateSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'update-subscriber',
  classification: 'WRITE',
  displayName: 'Update Subscriber',
  description: 'Update subscriber details and variables',
  audience: 'both',
  aiMetadata: { description: "Updates an existing subscriber, identified by email, within a specific SendPulse mailing list by setting their phone number and/or one or more variables (custom fields) to new values. Use to overwrite a contact's details; at least one of phone or variables must be supplied. Fails if any requested update fails, and the error names which part was already applied. Idempotent — repeating with the same values leaves the contact unchanged.", idempotent: true },
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to update',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'New phone number (optional)',
      required: false,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Subscriber variables to update (e.g., name, custom fields)',
      required: false,
    }),
  },
  outputSchema,
  async run(context) {
    const { mailingListId, variables } = context.propsValue;
    const phone = typeof context.propsValue.phone === 'string' ? context.propsValue.phone.trim() : '';
    const variableUpdates = isRecord(variables)
      ? Object.entries(variables).map(([name, value]) => ({ name, value: stringifyValue(value) }))
      : [];

    if (phone.length === 0 && variableUpdates.length === 0) {
      throw new Error('No updates provided. Please specify phone number or variables to update.');
    }

    const listId = parseMailingListId(mailingListId);
    const email = normalizeEmail(context.propsValue.email);
    const auth = context.auth.props;

    const phoneError = phone.length > 0 ? await updatePhone({ auth, listId, email, phone }) : null;
    const variablesError = variableUpdates.length > 0 ? await updateVariables({ auth, listId, email, variables: variableUpdates }) : null;
    const failures = [phoneError, variablesError].filter((item): item is string => item !== null);

    if (failures.length > 0) {
      const applied = [
        phone.length > 0 && phoneError === null ? 'phone' : null,
        variableUpdates.length > 0 && variablesError === null ? 'variables' : null,
      ].filter((item): item is string => item !== null);
      const appliedText = applied.length > 0 ? ` Already applied: ${applied.join(', ')}.` : ' Nothing was applied.';
      throw new Error(`SendPulse update subscriber failed for ${email}. ${failures.join(' | ')}.${appliedText}`);
    }

    return {
      success: true,
      message: `Subscriber ${email} updated successfully`,
      email,
      mailingListId,
      phoneUpdated: phone.length > 0,
      variablesUpdated: variableUpdates.map((item) => item.name),
      updates: [
        ...(phone.length > 0 ? [{ type: 'phone', success: true, value: phone }] : []),
        ...(variableUpdates.length > 0 ? [{ type: 'variables', success: true, count: variableUpdates.length }] : []),
      ],
      hasFailures: false,
    };
  },
});
