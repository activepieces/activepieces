import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, flatten, withoutBlanks } from '../common/client';
import {
  contactDropdown,
  priorityDropdown,
  segmentDropdown,
  sourceDropdown,
  stageDropdown,
} from '../common/props';
import { contactFields, optionalFlag, splitLabels } from '../common/contact-fields';

export const updateContact = createAction({
  auth: callsyncAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates a CallSync CRM contact. Fields left blank keep their saved values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Change fields on an existing CallSync CRM contact, such as name, notes, labels, stage or priority; blank fields are left unchanged. Use Create Contact for someone not yet in the CRM. Sets fields to given values, so safe to retry.',
    idempotent: true,
  },
  props: {
    contact: contactDropdown({ required: true }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    ...contactFields,
    stage_id: stageDropdown(),
    priority_id: priorityDropdown(),
    segment_id: segmentDropdown(),
    source_id: sourceDropdown(),
    is_in_pipeline: optionalFlag('In Pipeline', 'Show this contact as an active lead in the pipeline.'),
    is_starred: optionalFlag('Starred', 'Star the contact in CallSync.'),
    is_archived: optionalFlag('Archived', 'Archive the contact in CallSync.'),
  },
  async run(context) {
    const { contact, labels, ...fields } = context.propsValue;
    const changes = withoutBlanks({ ...fields, labels: splitLabels(labels) });
    if (!Object.keys(changes).length) {
      throw new Error('Nothing to update: fill in at least one field to change.');
    }
    const response = await callsyncApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: 'crm/contacts',
      body: { ...changes, id: contact },
    });
    return flatten(response.data);
  },
});
