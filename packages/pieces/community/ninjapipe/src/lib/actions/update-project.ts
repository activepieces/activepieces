import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const updateProject = createAction({
  auth: ninjapipeAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Updates a project by ID.',
  props: {
    projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    endDate: Property.ShortText({ displayName: 'End Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    companyId: ninjapipeCommon.companyDropdown,
    contactId: ninjapipeCommon.contactDropdown,
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.description) body.description = p.description;
    if (p.status) body.status = p.status;
    if (p.owner) body.owner = p.owner;
    if (p.startDate) body.start_date = p.startDate;
    if (p.endDate) body.end_date = p.endDate;
    if (p.companyId) body.company_id = p.companyId;
    if (p.contactId) body.contact_id = p.contactId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.PUT, path: `/projects/${p.projectId}`, body });
    return flattenCustomFields(response.body);
  },
});
