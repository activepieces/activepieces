import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from './auth';
import { pandadocRequest, PandaDocQuery } from './client';
import { pandadocNormalize } from './normalize';

async function fetchList({ apiKey, path, query }: { apiKey: string; path: string; query?: PandaDocQuery }): Promise<Record<string, unknown>[]> {
  const response = await pandadocRequest<unknown>({ apiKey, method: HttpMethod.GET, path, query });
  const body = response.body;
  const items = Array.isArray(body) ? body : pandadocNormalize.list(pandadocNormalize.rec(body)['results']);
  return items.map(pandadocNormalize.rec);
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.substring(0, 8)}...` : id;
}

function label({ name, fallback }: { name: unknown; fallback: string }): string {
  const text = pandadocNormalize.str(name);
  return text !== null && text.trim().length > 0 ? text : fallback;
}

async function documentOptions({ apiKey, searchValue }: { apiKey: string; searchValue: string | undefined }) {
  const docs = await fetchList({
    apiKey,
    path: '/documents',
    query: { count: 100, order_by: '-date_modified', q: searchValue && searchValue.trim().length > 0 ? searchValue.trim() : undefined },
  });
  return docs.flatMap((doc) => {
    const id = pandadocNormalize.str(doc['id']);
    if (id === null) {
      return [];
    }
    const status = pandadocNormalize.str(doc['status'])?.replace('document.', '') ?? 'unknown';
    return [{ label: `${label({ name: doc['name'], fallback: id })} (${status})`, value: id }];
  });
}

async function templateOptions({ apiKey, searchValue }: { apiKey: string; searchValue: string | undefined }) {
  const templates = await fetchList({
    apiKey,
    path: '/templates',
    query: { count: 100, q: searchValue && searchValue.trim().length > 0 ? searchValue.trim() : undefined },
  });
  return templates.flatMap((template) => {
    const id = pandadocNormalize.str(template['id']);
    return id === null ? [] : [{ label: `${label({ name: template['name'], fallback: id })} - ${shortId(id)}`, value: id }];
  });
}

async function folderOptions({ apiKey }: { apiKey: string }) {
  const folders = await fetchList({ apiKey, path: '/documents/folders', query: { count: 100 } });
  return folders.flatMap((folder) => {
    const id = pandadocNormalize.str(folder['uuid']);
    return id === null ? [] : [{ label: `${label({ name: folder['name'], fallback: id })} - ${shortId(id)}`, value: id }];
  });
}

async function contactOptions({ apiKey }: { apiKey: string }) {
  const contacts = await fetchList({ apiKey, path: '/contacts' });
  return contacts.flatMap((contact) => {
    const id = pandadocNormalize.str(contact['id']);
    if (id === null) {
      return [];
    }
    const name = [pandadocNormalize.str(contact['first_name']), pandadocNormalize.str(contact['last_name'])].filter((part) => part !== null && part.length > 0).join(' ') || 'Unnamed';
    const email = pandadocNormalize.str(contact['email']);
    return [{ label: `${name}${email ? ` <${email}>` : ''}`, value: id }];
  });
}

function unauthenticated() {
  return { disabled: true, placeholder: 'Please connect your PandaDoc account first', options: [] };
}

function failed(error: unknown) {
  return { disabled: true, placeholder: error instanceof Error ? error.message.slice(0, 200) : 'Failed to load options', options: [] };
}

export const documentDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Document',
  description: 'Select a document. The newest documents are listed first; type to search by name.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await documentOptions({ apiKey: auth.secret_text, searchValue }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const templateDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Template',
  description: 'Select a template from your PandaDoc workspace. Type to search by name.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await templateOptions({ apiKey: auth.secret_text, searchValue }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const templateFilterDropdown = Property.MultiSelectDropdown({
  auth: pandadocAuth,
  displayName: 'Filter by Templates',
  description: 'Only trigger for documents created from these templates (leave empty for all).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await templateOptions({ apiKey: auth.secret_text, searchValue: undefined }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const folderFilterDropdown = Property.MultiSelectDropdown({
  auth: pandadocAuth,
  displayName: 'Filter by Folders',
  description: 'Only trigger for documents stored in these folders (leave empty for all).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await folderOptions({ apiKey: auth.secret_text }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const templateFields = Property.DynamicProperties({
  displayName: 'Template Fields',
  description: 'Values for the template fields that have a merge field name. Leave a field empty to keep its default.',
  refreshers: ['template_uuid'],
  required: false,
  auth: pandadocAuth,
  props: async ({ auth, template_uuid }) => {
    const templateId = pandadocNormalize.str(template_uuid);
    if (!auth || templateId === null || templateId.length === 0) {
      return {};
    }
    const fields: DynamicPropsValue = {};
    try {
      const response = await pandadocRequest<unknown>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: `/templates/${encodeURIComponent(templateId)}/details`,
      });
      const details = pandadocNormalize.templateDetails(response.body);
      for (const field of details.fields) {
        if (field.merge_field === null || field.merge_field.length === 0 || field.merge_field in fields) {
          continue;
        }
        const displayName = field.name && field.name !== field.merge_field ? `${field.name} (${field.merge_field})` : field.merge_field;
        fields[field.merge_field] =
          field.type === 'checkbox'
            ? Property.StaticDropdown({
                displayName,
                description: 'Leave empty to keep the template default.',
                required: false,
                options: {
                  options: [
                    { label: 'Checked', value: true },
                    { label: 'Unchecked', value: false },
                  ],
                },
              })
            : Property.ShortText({
                displayName,
                description: field.type === 'date' ? 'Date in ISO 8601 format, for example 2026-12-31T00:00:00.000Z.' : undefined,
                required: false,
              });
      }
    } catch (error) {
      fields['template_fields_error'] = Property.MarkDown({
        value: `Could not load the template fields: ${error instanceof Error ? error.message : 'unknown error'}`,
      });
    }
    return fields;
  },
});

export const folderDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Folder',
  description: 'Select a folder from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await folderOptions({ apiKey: auth.secret_text }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const contactDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Contact',
  description: 'Select a contact from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await contactOptions({ apiKey: auth.secret_text }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const contactUpdateDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Contact ID (for Update)',
  description: 'Select a contact to update. Leave empty to create a new contact.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await contactOptions({ apiKey: auth.secret_text }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const templateFilterSingleDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Template',
  description: 'Filter by parent template (cannot be used with Form)',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      return { disabled: false, options: await templateOptions({ apiKey: auth.secret_text, searchValue }) };
    } catch (error) {
      return failed(error);
    }
  },
});

export const formDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Form',
  description: 'Select a form from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      const forms = await fetchList({ apiKey: auth.secret_text, path: '/forms', query: { count: 100 } });
      return {
        disabled: false,
        options: forms.flatMap((form) => {
          const id = pandadocNormalize.str(form['id']);
          return id === null ? [] : [{ label: `${label({ name: form['name'], fallback: id })} (${pandadocNormalize.str(form['status']) ?? 'unknown'})`, value: id }];
        }),
      };
    } catch (error) {
      return failed(error);
    }
  },
});

export const memberDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Member',
  description: 'Select a workspace member',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return unauthenticated();
    }
    try {
      const members = await fetchList({ apiKey: auth.secret_text, path: '/members' });
      return {
        disabled: false,
        options: members
          .filter((member) => member['is_active'] === true)
          .flatMap((member) => {
            const id = pandadocNormalize.str(member['membership_id']);
            if (id === null) {
              return [];
            }
            const name = [pandadocNormalize.str(member['first_name']), pandadocNormalize.str(member['last_name'])].filter((part) => part !== null && part.length > 0).join(' ') || 'Unnamed';
            return [{ label: `${name} (${pandadocNormalize.str(member['role']) ?? 'member'}) - ${pandadocNormalize.str(member['email']) ?? ''}`, value: id }];
          }),
      };
    } catch (error) {
      return failed(error);
    }
  },
});

export const documentAttachmentDropdown = Property.Dropdown({
  auth: pandadocAuth,
  displayName: 'Attachment',
  description: 'Select an attachment from the document',
  required: true,
  refreshers: ['document_id'],
  options: async ({ auth, document_id }) => {
    if (!auth) {
      return unauthenticated();
    }
    const documentId = pandadocNormalize.str(document_id);
    if (documentId === null || documentId.length === 0) {
      return { disabled: true, placeholder: 'Please select a document first', options: [] };
    }
    try {
      const attachments = await fetchList({ apiKey: auth.secret_text, path: `/documents/${encodeURIComponent(documentId)}/attachments` });
      return {
        disabled: false,
        options: attachments.flatMap((attachment) => {
          const id = pandadocNormalize.str(attachment['uuid']);
          return id === null ? [] : [{ label: label({ name: attachment['name'], fallback: 'Unnamed Attachment' }), value: id }];
        }),
      };
    } catch (error) {
      return failed(error);
    }
  },
});

export const countryDropdown = Property.StaticDropdown({
  displayName: 'Country',
  description: 'Select a country or choose "Other" to enter a custom country',
  required: false,
  options: {
    options: [
      { label: 'United States', value: 'United States' },
      { label: 'Canada', value: 'Canada' },
      { label: 'United Kingdom', value: 'United Kingdom' },
      { label: 'Australia', value: 'Australia' },
      { label: 'Germany', value: 'Germany' },
      { label: 'France', value: 'France' },
      { label: 'Spain', value: 'Spain' },
      { label: 'Italy', value: 'Italy' },
      { label: 'Netherlands', value: 'Netherlands' },
      { label: 'Sweden', value: 'Sweden' },
      { label: 'Norway', value: 'Norway' },
      { label: 'Denmark', value: 'Denmark' },
      { label: 'Finland', value: 'Finland' },
      { label: 'Brazil', value: 'Brazil' },
      { label: 'Mexico', value: 'Mexico' },
      { label: 'Japan', value: 'Japan' },
      { label: 'South Korea', value: 'South Korea' },
      { label: 'China', value: 'China' },
      { label: 'India', value: 'India' },
      { label: 'Singapore', value: 'Singapore' },
      { label: 'Switzerland', value: 'Switzerland' },
      { label: 'Austria', value: 'Austria' },
      { label: 'Belgium', value: 'Belgium' },
      { label: 'Poland', value: 'Poland' },
      { label: 'Ireland', value: 'Ireland' },
      { label: 'New Zealand', value: 'New Zealand' },
      { label: 'South Africa', value: 'South Africa' },
      { label: 'Argentina', value: 'Argentina' },
      { label: 'Chile', value: 'Chile' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

export const customCountryInput = Property.ShortText({
  displayName: 'Custom Country',
  description:
    'Enter your country name (only used if "Other" is selected above)',
  required: false,
});

export const stateDropdown = Property.StaticDropdown({
  displayName: 'State/Province',
  description:
    'Select a state/province or choose "Other" to enter a custom value',
  required: false,
  options: {
    options: [

      { label: 'Alabama (US)', value: 'Alabama' },
      { label: 'Alaska (US)', value: 'Alaska' },
      { label: 'Arizona (US)', value: 'Arizona' },
      { label: 'Arkansas (US)', value: 'Arkansas' },
      { label: 'California (US)', value: 'California' },
      { label: 'Colorado (US)', value: 'Colorado' },
      { label: 'Connecticut (US)', value: 'Connecticut' },
      { label: 'Delaware (US)', value: 'Delaware' },
      { label: 'Florida (US)', value: 'Florida' },
      { label: 'Georgia (US)', value: 'Georgia' },
      { label: 'Hawaii (US)', value: 'Hawaii' },
      { label: 'Idaho (US)', value: 'Idaho' },
      { label: 'Illinois (US)', value: 'Illinois' },
      { label: 'Indiana (US)', value: 'Indiana' },
      { label: 'Iowa (US)', value: 'Iowa' },
      { label: 'Kansas (US)', value: 'Kansas' },
      { label: 'Kentucky (US)', value: 'Kentucky' },
      { label: 'Louisiana (US)', value: 'Louisiana' },
      { label: 'Maine (US)', value: 'Maine' },
      { label: 'Maryland (US)', value: 'Maryland' },
      { label: 'Massachusetts (US)', value: 'Massachusetts' },
      { label: 'Michigan (US)', value: 'Michigan' },
      { label: 'Minnesota (US)', value: 'Minnesota' },
      { label: 'Mississippi (US)', value: 'Mississippi' },
      { label: 'Missouri (US)', value: 'Missouri' },
      { label: 'Montana (US)', value: 'Montana' },
      { label: 'Nebraska (US)', value: 'Nebraska' },
      { label: 'Nevada (US)', value: 'Nevada' },
      { label: 'New Hampshire (US)', value: 'New Hampshire' },
      { label: 'New Jersey (US)', value: 'New Jersey' },
      { label: 'New Mexico (US)', value: 'New Mexico' },
      { label: 'New York (US)', value: 'New York' },
      { label: 'North Carolina (US)', value: 'North Carolina' },
      { label: 'North Dakota (US)', value: 'North Dakota' },
      { label: 'Ohio (US)', value: 'Ohio' },
      { label: 'Oklahoma (US)', value: 'Oklahoma' },
      { label: 'Oregon (US)', value: 'Oregon' },
      { label: 'Pennsylvania (US)', value: 'Pennsylvania' },
      { label: 'Rhode Island (US)', value: 'Rhode Island' },
      { label: 'South Carolina (US)', value: 'South Carolina' },
      { label: 'South Dakota (US)', value: 'South Dakota' },
      { label: 'Tennessee (US)', value: 'Tennessee' },
      { label: 'Texas (US)', value: 'Texas' },
      { label: 'Utah (US)', value: 'Utah' },
      { label: 'Vermont (US)', value: 'Vermont' },
      { label: 'Virginia (US)', value: 'Virginia' },
      { label: 'Washington (US)', value: 'Washington' },
      { label: 'West Virginia (US)', value: 'West Virginia' },
      { label: 'Wisconsin (US)', value: 'Wisconsin' },
      { label: 'Wyoming (US)', value: 'Wyoming' },

      { label: 'Alberta (CA)', value: 'Alberta' },
      { label: 'British Columbia (CA)', value: 'British Columbia' },
      { label: 'Manitoba (CA)', value: 'Manitoba' },
      { label: 'New Brunswick (CA)', value: 'New Brunswick' },
      {
        label: 'Newfoundland and Labrador (CA)',
        value: 'Newfoundland and Labrador',
      },
      { label: 'Northwest Territories (CA)', value: 'Northwest Territories' },
      { label: 'Nova Scotia (CA)', value: 'Nova Scotia' },
      { label: 'Nunavut (CA)', value: 'Nunavut' },
      { label: 'Ontario (CA)', value: 'Ontario' },
      { label: 'Prince Edward Island (CA)', value: 'Prince Edward Island' },
      { label: 'Quebec (CA)', value: 'Quebec' },
      { label: 'Saskatchewan (CA)', value: 'Saskatchewan' },
      { label: 'Yukon (CA)', value: 'Yukon' },

      { label: 'England (UK)', value: 'England' },
      { label: 'Scotland (UK)', value: 'Scotland' },
      { label: 'Wales (UK)', value: 'Wales' },
      { label: 'Northern Ireland (UK)', value: 'Northern Ireland' },
      { label: 'New South Wales (AU)', value: 'New South Wales' },
      { label: 'Victoria (AU)', value: 'Victoria' },
      { label: 'Queensland (AU)', value: 'Queensland' },
      { label: 'Western Australia (AU)', value: 'Western Australia' },
      { label: 'South Australia (AU)', value: 'South Australia' },
      { label: 'Tasmania (AU)', value: 'Tasmania' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

export const customStateInput = Property.ShortText({
  displayName: 'Custom State/Province',
  description:
    'Enter your state/province name (only used if "Other" is selected above)',
  required: false,
});

export const jobTitleDropdown = Property.StaticDropdown({
  displayName: 'Job Title',
  description:
    'Select a common job title or choose "Other" to enter a custom title',
  required: false,
  options: {
    options: [

      { label: 'CEO / Chief Executive Officer', value: 'CEO' },
      { label: 'CTO / Chief Technology Officer', value: 'CTO' },
      { label: 'CFO / Chief Financial Officer', value: 'CFO' },
      { label: 'COO / Chief Operating Officer', value: 'COO' },
      { label: 'President', value: 'President' },
      { label: 'Vice President', value: 'Vice President' },
      { label: 'Director', value: 'Director' },
      { label: 'Manager', value: 'Manager' },

      { label: 'Sales Manager', value: 'Sales Manager' },
      { label: 'Sales Representative', value: 'Sales Representative' },
      { label: 'Account Manager', value: 'Account Manager' },
      {
        label: 'Business Development Manager',
        value: 'Business Development Manager',
      },
      { label: 'Marketing Manager', value: 'Marketing Manager' },
      { label: 'Marketing Coordinator', value: 'Marketing Coordinator' },

      { label: 'Software Engineer', value: 'Software Engineer' },
      { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
      { label: 'Lead Developer', value: 'Lead Developer' },
      { label: 'DevOps Engineer', value: 'DevOps Engineer' },
      { label: 'Data Scientist', value: 'Data Scientist' },
      { label: 'Product Manager', value: 'Product Manager' },
      { label: 'IT Manager', value: 'IT Manager' },

      { label: 'Operations Manager', value: 'Operations Manager' },
      { label: 'Project Manager', value: 'Project Manager' },
      { label: 'Program Manager', value: 'Program Manager' },
      { label: 'Business Analyst', value: 'Business Analyst' },
      { label: 'Consultant', value: 'Consultant' },

      { label: 'Accountant', value: 'Accountant' },
      { label: 'Financial Analyst', value: 'Financial Analyst' },
      { label: 'Legal Counsel', value: 'Legal Counsel' },
      { label: 'Compliance Officer', value: 'Compliance Officer' },

      { label: 'HR Manager', value: 'HR Manager' },
      { label: 'HR Coordinator', value: 'HR Coordinator' },
      { label: 'Office Manager', value: 'Office Manager' },
      { label: 'Administrative Assistant', value: 'Administrative Assistant' },
      { label: 'Executive Assistant', value: 'Executive Assistant' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

export const customJobTitleInput = Property.ShortText({
  displayName: 'Custom Job Title',
  description:
    'Enter a custom job title (only used if "Other" is selected above)',
  required: false,
});

export const industryDropdown = Property.StaticDropdown({
  displayName: 'Industry',
  description:
    'Select an industry or choose "Other" to enter a custom industry',
  required: false,
  options: {
    options: [
      { label: 'Technology', value: 'Technology' },
      { label: 'Software', value: 'Software' },
      { label: 'Financial Services', value: 'Financial Services' },
      { label: 'Healthcare', value: 'Healthcare' },
      { label: 'Manufacturing', value: 'Manufacturing' },
      { label: 'Retail', value: 'Retail' },
      { label: 'E-commerce', value: 'E-commerce' },
      { label: 'Education', value: 'Education' },
      { label: 'Consulting', value: 'Consulting' },
      { label: 'Real Estate', value: 'Real Estate' },
      { label: 'Construction', value: 'Construction' },
      { label: 'Legal Services', value: 'Legal Services' },
      { label: 'Marketing & Advertising', value: 'Marketing & Advertising' },
      { label: 'Media & Entertainment', value: 'Media & Entertainment' },
      { label: 'Telecommunications', value: 'Telecommunications' },
      {
        label: 'Transportation & Logistics',
        value: 'Transportation & Logistics',
      },
      { label: 'Energy & Utilities', value: 'Energy & Utilities' },
      { label: 'Automotive', value: 'Automotive' },
      { label: 'Aerospace & Defense', value: 'Aerospace & Defense' },
      { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
      { label: 'Biotechnology', value: 'Biotechnology' },
      { label: 'Insurance', value: 'Insurance' },
      { label: 'Banking', value: 'Banking' },
      { label: 'Investment', value: 'Investment' },
      { label: 'Non-Profit', value: 'Non-Profit' },
      { label: 'Government', value: 'Government' },
      { label: 'Agriculture', value: 'Agriculture' },
      { label: 'Food & Beverage', value: 'Food & Beverage' },
      { label: 'Hospitality & Tourism', value: 'Hospitality & Tourism' },
      { label: 'Sports & Recreation', value: 'Sports & Recreation' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

export const customIndustryInput = Property.ShortText({
  displayName: 'Custom Industry',
  description:
    'Enter a custom industry (only used if "Other" is selected above)',
  required: false,
});

export const recipientRoleDropdown = Property.StaticDropdown({
  displayName: 'Recipient Role',
  description:
    'Select a common recipient role or choose "Other" to enter a custom role',
  required: false,
  options: {
    options: [
      { label: 'Client', value: 'Client' },
      { label: 'Customer', value: 'Customer' },
      { label: 'Signer', value: 'Signer' },
      { label: 'Approver', value: 'Approver' },
      { label: 'Reviewer', value: 'Reviewer' },
      { label: 'Witness', value: 'Witness' },
      { label: 'Notary', value: 'Notary' },
      { label: 'Vendor', value: 'Vendor' },
      { label: 'Supplier', value: 'Supplier' },
      { label: 'Contractor', value: 'Contractor' },
      { label: 'Partner', value: 'Partner' },
      { label: 'Consultant', value: 'Consultant' },
      { label: 'Legal Counsel', value: 'Legal Counsel' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Employee', value: 'Employee' },
      { label: 'HR Representative', value: 'HR Representative' },
      { label: 'Finance Team', value: 'Finance Team' },
      { label: 'Executive', value: 'Executive' },
      { label: 'Board Member', value: 'Board Member' },
      { label: 'Stakeholder', value: 'Stakeholder' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

export const customRecipientRoleInput = Property.ShortText({
  displayName: 'Custom Recipient Role',
  description:
    'Enter a custom recipient role (only used if "Other" is selected above)',
  required: false,
});

export const watermarkTextDropdown = Property.StaticDropdown({
  displayName: 'Watermark Text',
  description:
    'Select common watermark text or choose "Custom" to enter your own',
  required: false,
  options: {
    options: [
      { label: 'CONFIDENTIAL', value: 'CONFIDENTIAL' },
      { label: 'DRAFT', value: 'DRAFT' },
      { label: 'COPY', value: 'COPY' },
      { label: 'SAMPLE', value: 'SAMPLE' },
      { label: 'FOR REVIEW ONLY', value: 'FOR REVIEW ONLY' },
      { label: 'INTERNAL USE ONLY', value: 'INTERNAL USE ONLY' },
      { label: 'PROPRIETARY', value: 'PROPRIETARY' },
      { label: 'PRELIMINARY', value: 'PRELIMINARY' },
      { label: 'FINAL', value: 'FINAL' },
      { label: 'APPROVED', value: 'APPROVED' },
      { label: 'VOID', value: 'VOID' },
      { label: 'DUPLICATE', value: 'DUPLICATE' },
      { label: 'NOT FOR DISTRIBUTION', value: 'NOT FOR DISTRIBUTION' },
      { label: 'TRADE SECRET', value: 'TRADE SECRET' },
      { label: 'Custom (Enter Your Own)', value: 'custom' },
    ],
  },
});

export const customWatermarkTextInput = Property.ShortText({
  displayName: 'Custom Watermark Text',
  description:
    'Enter custom watermark text (only used if "Custom" is selected above)',
  required: false,
});

export const tagDropdown = Property.StaticDropdown({
  displayName: 'Tag',
  description: 'Select a common tag or choose "Custom" to enter your own',
  required: false,
  options: {
    options: [
      { label: 'contract', value: 'contract' },
      { label: 'proposal', value: 'proposal' },
      { label: 'quote', value: 'quote' },
      { label: 'invoice', value: 'invoice' },
      { label: 'agreement', value: 'agreement' },
      { label: 'nda', value: 'nda' },
      { label: 'employment', value: 'employment' },
      { label: 'vendor', value: 'vendor' },
      { label: 'client', value: 'client' },
      { label: 'urgent', value: 'urgent' },
      { label: 'priority', value: 'priority' },
      { label: 'review', value: 'review' },
      { label: 'approval', value: 'approval' },
      { label: 'legal', value: 'legal' },
      { label: 'finance', value: 'finance' },
      { label: 'hr', value: 'hr' },
      { label: 'sales', value: 'sales' },
      { label: 'marketing', value: 'marketing' },
      { label: 'template', value: 'template' },
      { label: 'final', value: 'final' },
      { label: 'draft', value: 'draft' },
      { label: 'Custom (Enter Your Own)', value: 'custom' },
    ],
  },
});

export const customTagInput = Property.ShortText({
  displayName: 'Custom Tag',
  description: 'Enter a custom tag (only used if "Custom" is selected above)',
  required: false,
});

export const usStateDropdown = stateDropdown;
