import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const updateDeal = createAction({
  auth: ninjapipeAuth,
  name: 'update_deal',
  displayName: 'Update Deal',
  description: 'Updates a deal by ID.',
  props: {
    dealId: Property.ShortText({ displayName: 'Deal ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    value: Property.Number({ displayName: 'Value', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    pipelineId: ninjapipeCommon.pipelineDropdown,
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
    if (p.title) body.title = p.title;
    if (p.status) body.status = p.status;
    if (p.value !== undefined) body.value = p.value;
    if (p.currency) body.currency = p.currency;
    if (p.owner) body.owner = p.owner;
    if (p.pipelineId) body.pipeline_id = p.pipelineId;
    if (p.companyId) body.company_id = p.companyId;
    if (p.contactId) body.contact_id = p.contactId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.PUT, path: `/deals/${p.dealId}`, body });
    return flattenCustomFields(response.body);
  },
});
