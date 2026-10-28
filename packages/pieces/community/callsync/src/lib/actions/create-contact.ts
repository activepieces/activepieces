import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, flatten, withoutBlanks } from '../common/client';
import { priorityDropdown, segmentDropdown, sourceDropdown, stageDropdown } from '../common/props';
import { contactFields, splitLabels } from '../common/contact-fields';

export const createContact = createAction({
  auth: callsyncAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Adds a contact to the CallSync CRM, linked to their calls by phone number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a CRM contact in CallSync from a phone number, with optional name, email, company, notes, labels and pipeline fields. Use Update Contact to change an existing contact. Each call creates a contact, so retries may duplicate.',
    idempotent: false,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number with country code, e.g. +919876543210. An existing caller with this number is linked instead of duplicated.',
      required: true,
    }),
    ...contactFields,
    stage_id: stageDropdown(),
    priority_id: priorityDropdown(),
    segment_id: segmentDropdown(),
    source_id: sourceDropdown(),
    is_in_pipeline: Property.Checkbox({
      displayName: 'Add to Pipeline',
      description: 'Show this contact as an active lead in the pipeline.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { labels, ...fields } = context.propsValue;
    const response = await callsyncApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'crm/contacts',
      body: withoutBlanks({ ...fields, labels: splitLabels(labels) }),
    });
    return flatten(response.data);
  },
});
