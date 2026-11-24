import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const createLeadAi = createAction({
  auth: closeAuth,
  name: 'create_lead_ai',
  classification: 'WRITE',
  displayName: 'Create Lead',
  description: 'Create a lead (company), optionally with a first contact.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Close lead (a company or account) and returns it with its lead_ id. Optionally adds one contact person with email and phone in the same call. Status uses a lead status id from List Lead Statuses; omit it for the default status. Custom fields take cf_ ids from List Custom Fields. Calling it twice creates two leads, so search first with Search Leads.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.lead,
  props: {
    name: Property.ShortText({ displayName: 'Lead Name', description: 'Company or lead name.', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    url: Property.ShortText({ displayName: 'Website', required: false }),
    statusId: Property.ShortText({ displayName: 'Lead Status ID', description: 'stat_... from List Lead Statuses.', required: false }),
    contactName: Property.ShortText({ displayName: 'Contact Name', required: false }),
    contactTitle: Property.ShortText({ displayName: 'Contact Title', required: false }),
    contactEmail: Property.ShortText({ displayName: 'Contact Email', required: false }),
    contactPhone: Property.ShortText({ displayName: 'Contact Phone', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object of cf_... id to value.', required: false }),
  },
  async run({ auth, propsValue }) {
    const statusId = closeClient.optionalCloseId({ value: propsValue.statusId, label: 'Lead Status ID', prefix: 'stat' });
    const contactName = closeClient.optionalText(propsValue.contactName);
    const contactTitle = closeClient.optionalText(propsValue.contactTitle);
    const contactEmail = closeClient.optionalText(propsValue.contactEmail);
    const contactPhone = closeClient.optionalText(propsValue.contactPhone);
    const hasContact = [contactName, contactTitle, contactEmail, contactPhone].some((v) => v !== undefined);
    const body = {
      name: closeClient.requiredText({ value: propsValue.name, label: 'Lead Name' }),
      ...optional({ key: 'description', value: closeClient.optionalText(propsValue.description) }),
      ...optional({ key: 'url', value: closeClient.optionalText(propsValue.url) }),
      ...optional({ key: 'status_id', value: statusId }),
      ...(hasContact
        ? {
            contacts: [
              {
                ...optional({ key: 'name', value: contactName }),
                ...optional({ key: 'title', value: contactTitle }),
                ...(contactEmail ? { emails: [{ email: contactEmail, type: 'office' }] } : {}),
                ...(contactPhone ? { phones: [{ phone: contactPhone, type: 'office' }] } : {}),
              },
            ],
          }
        : {}),
      ...closeClient.customFieldsBody({ value: propsValue.customFields }),
    };
    const created = await closeClient.request({ auth, method: HttpMethod.POST, path: '/lead/', body });
    return closeMappers.lead(created);
  },
});

function optional({ key, value }: { key: string; value: string | undefined }): Record<string, string> {
  return value === undefined ? {} : { [key]: value };
}

export { createLeadAi };
