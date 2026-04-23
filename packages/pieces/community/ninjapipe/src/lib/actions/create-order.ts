import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const createOrder = createAction({
  auth: ninjapipeAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Creates a new order.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    number: Property.ShortText({ displayName: 'Order Number', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
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
    if (p.name) body.name = p.name;
    if (p.number) body.number = p.number;
    if (p.status) body.status = p.status;
    if (p.amount !== undefined) body.amount = p.amount;
    if (p.currency) body.currency = p.currency;
    if (p.companyId) body.company_id = p.companyId;
    if (p.contactId) body.contact_id = p.contactId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: '/orders', body });
    return flattenCustomFields(response.body);
  },
});
