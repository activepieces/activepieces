import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const createPipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'create_pipeline_item',
  displayName: 'Create Pipeline Item',
  description: 'Creates a new item in a pipeline stage.',
  props: {
    pipelineId: ninjapipeCommon.pipelineDropdown,
    name: Property.ShortText({ displayName: 'Name', required: true }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    value: Property.Number({ displayName: 'Value', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    companyId: ninjapipeCommon.companyDropdown,
    contactId: ninjapipeCommon.contactDropdown,
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.pipelineId) body.pipeline_id = p.pipelineId;
    if (p.name) body.name = p.name;
    if (p.status) body.status = p.status;
    if (p.value !== undefined) body.value = p.value;
    if (p.currency) body.currency = p.currency;
    if (p.companyId) body.company_id = p.companyId;
    if (p.contactId) body.contact_id = p.contactId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: '/pipeline_items', body });
    return flattenCustomFields(response.body);
  },
});
