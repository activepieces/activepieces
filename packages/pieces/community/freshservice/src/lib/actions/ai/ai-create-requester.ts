import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { compactBody, freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

const REQUESTER_FIELDS = ['first_name', 'last_name', 'primary_email', 'job_title', 'work_phone_number', 'mobile_phone_number', 'custom_fields'];

export const aiCreateRequester = createAction({
  auth: freshserviceAuth,
  name: 'ai_create_requester',
  displayName: 'Create Requester (AI)',
  description: 'Creates a requester (end user) in Freshservice.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.requester,
  aiMetadata: {
    description:
      'Creates a Freshservice requester (end user who raises tickets). Call Find Requester first: an email that already exists fails with a validation error. Department ids come from List Departments. Not idempotent — do not retry after a success.',
    idempotent: false,
  },
  props: {
    first_name: Property.ShortText({ displayName: 'First Name', required: true }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    primary_email: Property.ShortText({ displayName: 'Primary Email', required: true }),
    job_title: Property.ShortText({ displayName: 'Job Title', required: false }),
    work_phone_number: Property.ShortText({ displayName: 'Work Phone', required: false }),
    mobile_phone_number: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
    department_ids: Property.Array({ displayName: 'Department IDs', description: 'Numeric department ids.', required: false }),
    custom_fields: Property.Json({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const { department_ids } = context.propsValue;
    const response = await freshserviceApiCall<{ requester: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'requesters',
      auth: context.auth,
      body: compactBody({
        ...pickFields({ source: context.propsValue, keys: REQUESTER_FIELDS }),
        department_ids: department_ids?.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
      }),
    });
    return response.body.requester;
  },
});
