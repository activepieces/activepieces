import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import {
  formDropdown,
  folderDropdown,
  contactDropdown,
  memberDropdown,
  tagDropdown,
  customTagInput
} from '../common/dynamic-dropdowns';

export const findDocument = createAction({
  name: 'findDocument',
  displayName: 'Find Document(s)',
  description: 'Finds documents based various filter.',
  auth: pandadocAuth,
  props: {
    q: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search documents by name or reference number',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Document ID',
      description: 'Search for document by its specific ID',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter documents by status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 0 },
          { label: 'Sent', value: 1 },
          { label: 'Completed', value: 2 },
          { label: 'Uploaded', value: 3 },
          { label: 'Error', value: 4 },
          { label: 'Viewed', value: 5 },
          { label: 'Waiting Approval', value: 6 },
          { label: 'Approved', value: 7 },
          { label: 'Rejected', value: 8 },
          { label: 'Waiting Pay', value: 9 },
          { label: 'Paid', value: 10 },
          { label: 'Voided', value: 11 },
          { label: 'Declined', value: 12 },
          { label: 'External Review', value: 13 },
        ],
      },
    }),
    status__ne: Property.StaticDropdown({
      displayName: 'Exclude Status',
      description: 'Exclude documents with this status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 0 },
          { label: 'Sent', value: 1 },
          { label: 'Completed', value: 2 },
          { label: 'Uploaded', value: 3 },
          { label: 'Error', value: 4 },
          { label: 'Viewed', value: 5 },
          { label: 'Waiting Approval', value: 6 },
          { label: 'Approved', value: 7 },
          { label: 'Rejected', value: 8 },
          { label: 'Waiting Pay', value: 9 },
          { label: 'Paid', value: 10 },
          { label: 'Voided', value: 11 },
          { label: 'Declined', value: 12 },
          { label: 'External Review', value: 13 },
        ],
      },
    }),
    template_id: Property.Dropdown({
      displayName: 'Template',
      description: 'Filter by parent template (cannot be used with Form)',
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
              date_created: string;
            }>;
          }>(auth as string, HttpMethod.GET, '/templates?count=100');

          const options = response.results.map((template) => ({
            label: `${template.name} - ${template.id.substring(0, 8)}...`,
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
    }),
    form_id: formDropdown,
    folder_uuid: folderDropdown,
    contact_id: contactDropdown,
    membership_id: memberDropdown,
    tag: tagDropdown,
    custom_tag: customTagInput,
    created_from: Property.DateTime({
      displayName: 'Created From',
      description: 'Include only documents created on or after this date',
      required: false,
    }),
    created_to: Property.DateTime({
      displayName: 'Created To',
      description: 'Include only documents created before this date',
      required: false,
    }),
    completed_from: Property.DateTime({
      displayName: 'Completed From',
      description: 'Include only documents completed on or after this date',
      required: false,
    }),
    completed_to: Property.DateTime({
      displayName: 'Completed To',
      description: 'Include only documents completed before this date',
      required: false,
    }),
    modified_from: Property.DateTime({
      displayName: 'Modified From',
      description: 'Include only documents modified on or after this date',
      required: false,
    }),
    modified_to: Property.DateTime({
      displayName: 'Modified To',
      description: 'Include only documents modified before this date',
      required: false,
    }),
    deleted: Property.Checkbox({
      displayName: 'Show Deleted Documents',
      description: 'Return only deleted documents',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Results Count',
      description: 'Number of documents to return (default: 50, max: 100)',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination (starts with 1)',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort results by field',
      required: false,
      options: {
        options: [
          { label: 'Date Status Changed (default)', value: 'date_status_changed' },
          { label: 'Date Created (ascending)', value: 'date_created' },
          { label: 'Date Created (descending)', value: '-date_created' },
          { label: 'Date Modified (ascending)', value: 'date_modified' },
          { label: 'Date Modified (descending)', value: '-date_modified' },
          { label: 'Name (ascending)', value: 'name' },
          { label: 'Name (descending)', value: '-name' },
        ],
      },
    }),
    metadata: Property.Object({
      displayName: 'Metadata Filters',
      description: 'Filter by metadata key-value pairs. Use format: {"key": "value"}',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: any = {};

    // Build query parameters with only provided values
    if (propsValue.q) queryParams.q = propsValue.q;
    if (propsValue.id) queryParams.id = propsValue.id;
    if (propsValue.status !== undefined) queryParams.status = propsValue.status;
    if (propsValue.status__ne !== undefined) queryParams.status__ne = propsValue.status__ne;
    if (propsValue.template_id) queryParams.template_id = propsValue.template_id;
    if (propsValue.form_id) queryParams.form_id = propsValue.form_id;
    if (propsValue.folder_uuid) queryParams.folder_uuid = propsValue.folder_uuid;
    if (propsValue.contact_id) queryParams.contact_id = propsValue.contact_id;
    if (propsValue.membership_id) queryParams.membership_id = propsValue.membership_id;

    // Handle tag with custom support
    if (propsValue.tag) {
      let tagValue;
      if (propsValue.tag === 'custom' && propsValue.custom_tag) {
        tagValue = propsValue.custom_tag;
      } else if (propsValue.tag !== 'custom') {
        tagValue = propsValue.tag;
      }
      if (tagValue) {
        queryParams.tag = tagValue;
      }
    }

    if (propsValue.created_from) queryParams.created_from = propsValue.created_from;
    if (propsValue.created_to) queryParams.created_to = propsValue.created_to;
    if (propsValue.completed_from) queryParams.completed_from = propsValue.completed_from;
    if (propsValue.completed_to) queryParams.completed_to = propsValue.completed_to;
    if (propsValue.modified_from) queryParams.modified_from = propsValue.modified_from;
    if (propsValue.modified_to) queryParams.modified_to = propsValue.modified_to;
    if (propsValue.deleted) queryParams.deleted = propsValue.deleted;
    if (propsValue.count) queryParams.count = propsValue.count;
    if (propsValue.page) queryParams.page = propsValue.page;
    if (propsValue.order_by) queryParams.order_by = propsValue.order_by;

    if (propsValue.metadata) {
      for (const [key, value] of Object.entries(propsValue.metadata)) {
        queryParams[`metadata_${key}`] = value;
      }
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = queryString ? `/documents?${queryString}` : '/documents';

    return await pandadocClient.makeRequest(
      auth as string,
      HttpMethod.GET,
      endpoint
    );
  },
});
