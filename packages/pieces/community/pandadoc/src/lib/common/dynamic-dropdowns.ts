import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient } from './index';

// Documents dropdown
export const documentDropdown = Property.Dropdown({
  displayName: 'Document',
  description: 'Select a document from your PandaDoc workspace',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          id: string;
          name: string;
          status: string;
          date_created: string;
        }>;
      }>(
        auth as string,
        HttpMethod.GET,
        '/documents?count=100&order_by=date_created'
      );

      const options = response.results.map((doc) => ({
        label: doc.name,
        value: doc.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load documents',
        options: [],
      };
    }
  },
});

// Templates dropdown
export const templateDropdown = Property.Dropdown({
  displayName: 'Template',
  description: 'Select a template from your PandaDoc workspace',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          id: string;
          name: string;
          date_created: string;
        }>;
      }>(auth as string, HttpMethod.GET, '/templates?count=100');

      const options = response.results.map((template) => ({
        label: template.name,
        value: template.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load templates',
        options: [],
      };
    }
  },
});

export const templateFields = Property.DynamicProperties({
  displayName: 'Template Fields',
  refreshers: ['template_uuid'],
  required: false,
  props: async ({ auth, template_uuid }) => {
    if (!auth || !template_uuid) return {};

    const fields: DynamicPropsValue = {};

    const response = await pandadocClient.makeRequest<{
      fields: Array<{
        field_id: string;
        type: string;
        name: string;
      }>;
    }>(
      auth as unknown as string,
      HttpMethod.GET,
      `/templates/${template_uuid}/details`
    );

    for (const prop of response.fields) {
      fields[prop.field_id] = Property.ShortText({
        displayName: prop.name,
        required: false,
      });
    }

    return fields;
  },
});

// Folders dropdown
export const folderDropdown = Property.Dropdown({
  displayName: 'Folder',
  description: 'Select a folder from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          uuid: string;
          name: string;
          date_created: string;
        }>;
      }>(auth as string, HttpMethod.GET, '/documents/folders?count=100');

      const options = response.results.map((folder) => ({
        label: `${folder.name} - ${folder.uuid.substring(0, 8)}...`,
        value: folder.uuid,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load folders',
        options: [],
      };
    }
  },
});

// Contacts dropdown
export const contactDropdown = Property.Dropdown({
  displayName: 'Contact',
  description: 'Select a contact from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
        }>;
      }>(auth as string, HttpMethod.GET, '/contacts?count=100');

      const options = response.results.map((contact) => {
        const name =
          [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
          'Unnamed';
        const email = contact.email ? ` <${contact.email}>` : '';
        return {
          label: `${name}${email} - ${contact.id.substring(0, 8)}...`,
          value: contact.id,
        };
      });

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load contacts',
        options: [],
      };
    }
  },
});

// Forms dropdown
export const formDropdown = Property.Dropdown({
  displayName: 'Form',
  description: 'Select a form from your PandaDoc workspace',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          id: string;
          name: string;
          status: string;
        }>;
      }>(auth as string, HttpMethod.GET, '/forms?count=100');

      const options = response.results.map((form) => ({
        label: `${form.name} (${form.status}) - ${form.id.substring(0, 8)}...`,
        value: form.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load forms',
        options: [],
      };
    }
  },
});

// Members dropdown
export const memberDropdown = Property.Dropdown({
  displayName: 'Member',
  description: 'Select a workspace member',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<{
        results: Array<{
          membership_id: string;
          first_name: string;
          last_name: string;
          email: string;
          role: string;
          is_active: boolean;
        }>;
      }>(auth as string, HttpMethod.GET, '/members');

      const options = response.results
        .filter((member) => member.is_active)
        .map((member) => {
          const name =
            [member.first_name, member.last_name].filter(Boolean).join(' ') ||
            'Unnamed';
          return {
            label: `${name} (${member.role}) - ${member.email}`,
            value: member.membership_id,
          };
        });

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load members',
        options: [],
      };
    }
  },
});

// Document attachments dropdown (dependent on document selection)
export const documentAttachmentDropdown = Property.Dropdown({
  displayName: 'Attachment',
  description: 'Select an attachment from the document',
  required: true,
  refreshers: ['document_id'],
  options: async ({ auth, document_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    if (!document_id) {
      return {
        disabled: true,
        placeholder: 'Please select a document first',
        options: [],
      };
    }

    try {
      const response = await pandadocClient.makeRequest<
        Array<{
          uuid: string;
          name: string | null;
          date_created: string;
        }>
      >(
        auth as string,
        HttpMethod.GET,
        `/documents/${document_id}/attachments`
      );

      const options = response.map((attachment) => ({
        label: `${attachment.name || 'Unnamed Attachment'}`,
        value: attachment.uuid,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load attachments',
        options: [],
      };
    }
  },
});

// Country dropdown with custom input support
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

// Custom country input field
export const customCountryInput = Property.ShortText({
  displayName: 'Custom Country',
  description:
    'Enter your country name (only used if "Other" is selected above)',
  required: false,
});

// US/Canada States dropdown with custom input support
export const stateDropdown = Property.StaticDropdown({
  displayName: 'State/Province',
  description:
    'Select a state/province or choose "Other" to enter a custom value',
  required: false,
  options: {
    options: [
      // US States
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
      // Canadian Provinces
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
      // Other common ones
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

// Custom state input field
export const customStateInput = Property.ShortText({
  displayName: 'Custom State/Province',
  description:
    'Enter your state/province name (only used if "Other" is selected above)',
  required: false,
});

// Job title dropdown with custom input support
export const jobTitleDropdown = Property.StaticDropdown({
  displayName: 'Job Title',
  description:
    'Select a common job title or choose "Other" to enter a custom title',
  required: false,
  options: {
    options: [
      // Executive Level
      { label: 'CEO / Chief Executive Officer', value: 'CEO' },
      { label: 'CTO / Chief Technology Officer', value: 'CTO' },
      { label: 'CFO / Chief Financial Officer', value: 'CFO' },
      { label: 'COO / Chief Operating Officer', value: 'COO' },
      { label: 'President', value: 'President' },
      { label: 'Vice President', value: 'Vice President' },
      { label: 'Director', value: 'Director' },
      { label: 'Manager', value: 'Manager' },
      // Sales & Marketing
      { label: 'Sales Manager', value: 'Sales Manager' },
      { label: 'Sales Representative', value: 'Sales Representative' },
      { label: 'Account Manager', value: 'Account Manager' },
      {
        label: 'Business Development Manager',
        value: 'Business Development Manager',
      },
      { label: 'Marketing Manager', value: 'Marketing Manager' },
      { label: 'Marketing Coordinator', value: 'Marketing Coordinator' },
      // Technical
      { label: 'Software Engineer', value: 'Software Engineer' },
      { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
      { label: 'Lead Developer', value: 'Lead Developer' },
      { label: 'DevOps Engineer', value: 'DevOps Engineer' },
      { label: 'Data Scientist', value: 'Data Scientist' },
      { label: 'Product Manager', value: 'Product Manager' },
      { label: 'IT Manager', value: 'IT Manager' },
      // Operations
      { label: 'Operations Manager', value: 'Operations Manager' },
      { label: 'Project Manager', value: 'Project Manager' },
      { label: 'Program Manager', value: 'Program Manager' },
      { label: 'Business Analyst', value: 'Business Analyst' },
      { label: 'Consultant', value: 'Consultant' },
      // Finance & Legal
      { label: 'Accountant', value: 'Accountant' },
      { label: 'Financial Analyst', value: 'Financial Analyst' },
      { label: 'Legal Counsel', value: 'Legal Counsel' },
      { label: 'Compliance Officer', value: 'Compliance Officer' },
      // HR & Admin
      { label: 'HR Manager', value: 'HR Manager' },
      { label: 'HR Coordinator', value: 'HR Coordinator' },
      { label: 'Office Manager', value: 'Office Manager' },
      { label: 'Administrative Assistant', value: 'Administrative Assistant' },
      { label: 'Executive Assistant', value: 'Executive Assistant' },
      { label: 'Other (Enter Custom)', value: 'custom' },
    ],
  },
});

// Custom job title input field
export const customJobTitleInput = Property.ShortText({
  displayName: 'Custom Job Title',
  description:
    'Enter a custom job title (only used if "Other" is selected above)',
  required: false,
});

// Industry dropdown with custom input support
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

// Custom industry input field
export const customIndustryInput = Property.ShortText({
  displayName: 'Custom Industry',
  description:
    'Enter a custom industry (only used if "Other" is selected above)',
  required: false,
});

// Recipient role dropdown with custom input support
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

// Custom recipient role input field
export const customRecipientRoleInput = Property.ShortText({
  displayName: 'Custom Recipient Role',
  description:
    'Enter a custom recipient role (only used if "Other" is selected above)',
  required: false,
});

// Watermark text dropdown with custom input support
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

// Custom watermark text input field
export const customWatermarkTextInput = Property.ShortText({
  displayName: 'Custom Watermark Text',
  description:
    'Enter custom watermark text (only used if "Custom" is selected above)',
  required: false,
});

// Tag suggestions dropdown with custom input support
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

// Custom tag input field
export const customTagInput = Property.ShortText({
  displayName: 'Custom Tag',
  description: 'Enter a custom tag (only used if "Custom" is selected above)',
  required: false,
});

export const usStateDropdown = stateDropdown;
