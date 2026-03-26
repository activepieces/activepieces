import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import {
  statusDropdown,
  lifecycleDropdown,
  userDropdown,
} from '../../common/props';

export const createLeadAction = createAction({
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in your GetOpplify CRM.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Lead email address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Lead first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Lead last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Lead phone number',
      required: false,
    }),
    status: statusDropdown,
    lifecycleStage: lifecycleDropdown,
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Lead source',
      required: false,
      defaultValue: 'workflow',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the lead',
      required: false,
    }),
    assignedTo: userDropdown,
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom field key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/create', {
      email: context.propsValue.email,
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      phone: context.propsValue.phone,
      status: context.propsValue.status,
      lifecycleStage: context.propsValue.lifecycleStage,
      source: context.propsValue.source,
      tags: context.propsValue.tags,
      assignedTo: context.propsValue.assignedTo,
      customFields: context.propsValue.customFields,
    });
  },
});
