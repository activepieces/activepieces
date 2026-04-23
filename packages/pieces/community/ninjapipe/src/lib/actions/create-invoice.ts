import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const createInvoice = createAction({
  auth: ninjapipeAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice.',
  props: {
    number: Property.ShortText({ displayName: 'Invoice Number', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    amount: Property.Number({ displayName: 'Amount', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', required: false }),
    issueDate: Property.ShortText({ displayName: 'Issue Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    companyId: ninjapipeCommon.companyDropdown,
    contactId: ninjapipeCommon.contactDropdown,
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.number) body.number = p.number;
    if (p.title) body.title = p.title;
    if (p.status) body.status = p.status;
    if (p.amount !== undefined) body.amount = p.amount;
    if (p.currency) body.currency = p.currency;
    if (p.issueDate) body.issue_date = p.issueDate;
    if (p.dueDate) body.due_date = p.dueDate;
    if (p.companyId) body.company_id = p.companyId;
    if (p.contactId) body.contact_id = p.contactId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.POST, path: '/invoices', body });
    return flattenCustomFields(response.body);
  },
});
