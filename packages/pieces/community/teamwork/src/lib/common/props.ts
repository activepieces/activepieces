import { Property } from '@activepieces/pieces-framework';

export const TeamworkProps = {
  project_id: Property.Dropdown({
    displayName: 'Project',
    description: 'The ID of the project.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
          options: [],
        };
      }
      return {
        options: [
          {
            label: 'Project A',
            value: '12345',
          },
          {
            label: 'Project B',
            value: '67890',
          },
        ],
      };
    },
  }),
  create_company_props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the new company. This field is required.',
      required: true,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: "The company's website URL.",
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The main email address for the company.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The primary phone number.',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip/Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed description of the company.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma-separated IDs)',
      description:
        'Comma-separated list of tag IDs to associate with the company.',
      required: false,
    }),
  },
  upload_file_props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to be uploaded.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the file to be displayed in Teamwork.',
      required: true,
    }),
    category_id: Property.Dropdown({
      displayName: 'File Category',
      description: 'The file category to organize the file.',
      required: false,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }
        return {
          options: [
            {
              label: 'General',
              value: '123',
            },
            {
              label: 'Design',
              value: '456',
            },
          ],
        };
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description or notes about the file.',
      required: false,
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of a parent folder if you want to upload the file into a specific folder.',
      required: false,
    }),
  },
  create_message_reply_props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message thread to reply to.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Reply Content',
      description: 'The body of the message reply.',
      required: true,
    }),
    notify_user_ids: Property.MultiSelectDropdown({
      displayName: 'Notify Users',
      description: 'Users to be notified about the new reply.',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        return {
          options: [
            { label: 'User A', value: 'user_a_id' },
            { label: 'User B', value: 'user_b_id' },
          ],
        };
      },
    }),
    is_private: Property.Checkbox({
      displayName: 'Private Reply',
      description: 'Set to true to make the reply private.',
      required: false,
      defaultValue: false,
    }),
  },
  create_milestone_props: {
    project_id: Property.Dropdown({
      displayName: 'Project',
      description: 'The project to create the milestone in.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        return {
          options: [
            {
              label: 'Project A',
              value: '12345',
            },
            {
              label: 'Project B',
              value: '67890',
            },
          ],
        };
      },
    }),
    content: Property.ShortText({
      displayName: 'Milestone Title',
      description: 'The name or title of the milestone.',
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date for the milestone.',
      required: true,
    }),
    responsible_party_id: Property.ShortText({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for the milestone.',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private Milestone',
      description: 'Set to true to make the milestone private.',
      required: false,
      defaultValue: false,
    }),
    notify: Property.Checkbox({
      displayName: 'Notify Responsible User',
      description: 'Set to true to notify the responsible user.',
      required: false,
      defaultValue: false,
    }),
    can_complete: Property.Checkbox({
      displayName: 'Can be Completed',
      description: 'Set to true to allow the milestone to be completed.',
      required: false,
      defaultValue: true,
    }),
  },
  create_notebook_comment_props: {
    notebook_id: Property.Dropdown({
      displayName: 'Notebook',
      description: 'The ID of the notebook to add a comment to.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        return {
          options: [
            { label: 'Project Notebook', value: '1234' },
            { label: 'Planning Document', value: '5678' },
          ],
        };
      },
    }),
    content: Property.LongText({
      displayName: 'Comment Content',
      description: 'The body of the notebook comment.',
      required: true,
    }),
    notify_user_ids: Property.MultiSelectDropdown({
      displayName: 'Notify Users',
      description: 'Users to be notified about the new reply.',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        return {
          options: [
            { label: 'User A', value: 'user_a_id' },
            { label: 'User B', value: 'user_b_id' },
          ],
        };
      },
    }),
    attachments: Property.Array({
      displayName: 'Attachment IDs',
      description: 'A list of previously uploaded file IDs to attach.',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Attachment ID',
          required: false,
        }),
      },
    }),
  },
  create_person_props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the person.',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the person.',
      required: true,
    }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the person.',
      required: true,
    }),
    company_id: Property.Dropdown({
      displayName: 'Company',
      description: 'The company this person should be associated with.',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        // In a real scenario, this would be a dynamic dropdown fetching companies from the Teamwork API.
        const client = new TeamworkClient(
          auth as TeamworkAuth,
          'your_site_name'
        ); // Placeholder site_name
        const companies = await client.findCompanies();
        return {
          options: companies.map((company) => ({
            label: company.name,
            value: company.id,
          })),
        };
      },
    }),
    user_type: Property.StaticDropdown({
      displayName: 'User Type',
      description: 'The type of user (e.g., "account", "client", "contact").',
      required: false,
      options: {
        options: [
          { label: 'Account', value: 'account' },
          { label: 'Client', value: 'client' },
          { label: 'Contact', value: 'contact' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: "The person's job title.",
      required: false,
    }),
    is_client_user: Property.Checkbox({
      displayName: 'Is Client User',
      description: 'Set to true if the person is a client user.',
      required: false,
      defaultValue: false,
    }),
    send_invite: Property.Checkbox({
      displayName: 'Send Invitation',
      description: 'Set to true to send an invitation email to the new user.',
      required: false,
      defaultValue: false,
    }),
  },
};
