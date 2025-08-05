import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { BiginClient } from './client';
import { BiginZohoAuthType } from './auth';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
};

export const userDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a user',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getUsers('ActiveUsers');
      
      if (!response.users || response.users.length === 0) {
        return {
          options: [],
          placeholder: 'No active users found',
        };
      }

      const options: DropdownOption<string>[] = response.users.map((user: any) => ({
        label: user.full_name || user.email,
        value: user.id,
      }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load users. Check your permissions.',
      });
    }
  },
});

export const contactDropdown = Property.Dropdown({
  displayName: 'Contact',
  description: 'Select a contact',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getRecords('Contacts', {
        fields: ['id', 'First_Name', 'Last_Name', 'Email'],
        perPage: 50,
      });
      
      if (!response.data || response.data.length === 0) {
        return {
          options: [],
          placeholder: 'No contacts found',
        };
      }

      const options: DropdownOption<string>[] = response.data.map((contact: any) => ({
        label: `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim() || contact.Email || `Contact ${contact.id}`,
        value: contact.id,
      }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load contacts. Check your permissions.',
      });
    }
  },
});

export const companyDropdown = Property.Dropdown({
  displayName: 'Company',
  description: 'Select a company',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getRecords('Accounts', {
        fields: ['id', 'Account_Name'],
        perPage: 50,
      });
      
      if (!response.data || response.data.length === 0) {
        return {
          options: [],
          placeholder: 'No companies found',
        };
      }

      const options: DropdownOption<string>[] = response.data.map((company: any) => ({
        label: company.Account_Name || `Company ${company.id}`,
        value: company.id,
      }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load companies. Check your permissions.',
      });
    }
  },
});

export const pipelineStageDropdown = Property.Dropdown({
  displayName: 'Stage',
  description: 'Select a pipeline stage',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getFieldsMetadata('Pipelines');
      
      const stageField = response.fields?.find((field: any) => field.api_name === 'Stage');
      
      if (!stageField?.pick_list_values || stageField.pick_list_values.length === 0) {
        return {
          options: [],
          placeholder: 'No pipeline stages found',
        };
      }

      const options: DropdownOption<string>[] = stageField.pick_list_values.map((stage: any) => ({
        label: stage.display_value,
        value: stage.actual_value,
      }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load pipeline stages. Check your permissions.',
      });
    }
  },
});

export const subPipelineDropdown = Property.Dropdown({
  displayName: 'Sub-Pipeline',
  description: 'Select a sub-pipeline',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getFieldsMetadata('Pipelines');
      
      const subPipelineField = response.fields?.find((field: any) => field.api_name === 'Sub_Pipeline');
      
      if (!subPipelineField?.pick_list_values || subPipelineField.pick_list_values.length === 0) {
        return {
          options: [],
          placeholder: 'No sub-pipelines found',
        };
      }

      const options: DropdownOption<string>[] = subPipelineField.pick_list_values
        .filter((item: any) => item.type === 'used')
        .map((subPipeline: any) => ({
          label: subPipeline.display_value,
          value: subPipeline.actual_value,
        }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load sub-pipelines. Check your permissions.',
      });
    }
  },
});

export const productDropdown = Property.Dropdown({
  displayName: 'Product',
  description: 'Select a product',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please connect your Bigin account first',
      });
    }

    try {
      const client = new BiginClient(auth as BiginZohoAuthType);
      const response = await client.getRecords('Products', {
        fields: ['id', 'Product_Name', 'Product_Code'],
        perPage: 50,
      });
      
      if (!response.data || response.data.length === 0) {
        return {
          options: [],
          placeholder: 'No products found',
        };
      }

      const options: DropdownOption<string>[] = response.data.map((product: any) => ({
        label: `${product.Product_Name}${product.Product_Code ? ` (${product.Product_Code})` : ''}`,
        value: product.id,
      }));

      return {
        options,
      };
    } catch (error) {
      return buildEmptyList({
        placeholder: 'Failed to load products. Check your permissions.',
      });
    }
  },
});

export const commonProps = {
  firstName: Property.ShortText({
    displayName: 'First Name',
    required: false,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    required: false,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    required: false,
  }),
  mobile: Property.ShortText({
    displayName: 'Mobile',
    required: false,
  }),
  website: Property.ShortText({
    displayName: 'Website',
    required: false,
  }),
  description: Property.LongText({
    displayName: 'Description',
    required: false,
  }),
  amount: Property.Number({
    displayName: 'Amount',
    required: false,
  }),
  closingDate: Property.DateTime({
    displayName: 'Closing Date',
    required: false,
  }),
  dealName: Property.ShortText({
    displayName: 'Deal Name',
    required: false,
  }),
  accountName: Property.ShortText({
    displayName: 'Company Name',
    required: false,
  }),
  subject: Property.ShortText({
    displayName: 'Subject',
    required: false,
  }),
  dueDate: Property.DateTime({
    displayName: 'Due Date',
    required: false,
  }),
  priority: Property.StaticDropdown({
    displayName: 'Priority',
    required: false,
    options: {
      options: [
        { label: 'High', value: 'High' },
        { label: 'Normal', value: 'Normal' },
        { label: 'Low', value: 'Low' },
      ],
    },
  }),
  status: Property.StaticDropdown({
    displayName: 'Status',
    required: false,
    options: {
      options: [
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Deferred', value: 'Deferred' },
      ],
    },
  }),
  eventTitle: Property.ShortText({
    displayName: 'Event Title',
    required: false,
  }),
  venue: Property.ShortText({
    displayName: 'Venue',
    required: false,
  }),
  startDateTime: Property.DateTime({
    displayName: 'Start Date & Time',
    required: false,
  }),
  endDateTime: Property.DateTime({
    displayName: 'End Date & Time',
    required: false,
  }),
  allDay: Property.Checkbox({
    displayName: 'All Day Event',
    required: false,
  }),
  callType: Property.StaticDropdown({
    displayName: 'Call Type',
    required: false,
    options: {
      options: [
        { label: 'Inbound', value: 'Inbound' },
        { label: 'Outbound', value: 'Outbound' },
      ],
    },
  }),
  callStartTime: Property.DateTime({
    displayName: 'Call Start Time',
    required: false,
  }),
  productName: Property.ShortText({
    displayName: 'Product Name',
    required: false,
  }),
  productCode: Property.ShortText({
    displayName: 'Product Code',
    required: false,
  }),
  unitPrice: Property.Number({
    displayName: 'Unit Price',
    required: false,
  }),
  productCategory: Property.ShortText({
    displayName: 'Product Category',
    required: false,
  }),
}; 