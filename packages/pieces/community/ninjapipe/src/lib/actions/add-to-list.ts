import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const addToList = createAction({
  auth: ninjapipeAuth,
  name: 'add_to_list',
  displayName: 'Add to List',
  description: 'Adds a contact OR a company to a CRM list. The list type must match (Contact lists accept contacts, Company lists accept companies). Idempotent — returns already_in_list:true if already present.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The list UUID (must belong to your workspace).',
      required: true,
    }),
    contactId: ninjapipeCommon.contactDropdown,
    companyId: ninjapipeCommon.companyDropdown,
  },
  async run(context) {
    const auth = getAuth(context);
    const { listId, contactId, companyId } = context.propsValue;
    if (!contactId && !companyId) {
      throw new Error('Provide either Contact or Company.');
    }
    if (contactId && companyId) {
      throw new Error('Provide only one: Contact or Company. Lists are typed.');
    }
    const body: Record<string, unknown> = {};
    if (contactId) body['contact_id'] = contactId;
    if (companyId) body['company_id'] = companyId;
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: `/lists/${encodeURIComponent(String(listId))}/members`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
