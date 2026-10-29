import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { PandaDocQuery } from '../common/client';
import { metadataQuery, pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import { DOCUMENT_STATUS_OPTIONS } from '../common/statuses';
import {
  formDropdown,
  folderDropdown,
  contactDropdown,
  memberDropdown,
  tagDropdown,
  customTagInput,
  templateFilterSingleDropdown,
} from '../common/dynamic-dropdowns';

export const findDocument = createAction({
  auth: pandadocAuth,
  name: 'findDocument',
  classification: 'SEARCH',
  displayName: 'Find Document(s)',
  description: 'Finds documents using filters such as name, status, template, folder, contact and dates.',
  audience: 'human',
  aiMetadata: {
    description: 'Search PandaDoc documents with filters (text, status, template, folder, contact, tag, dates, metadata). Read-only.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({ displayName: 'Search Query', description: 'Search documents by name or reference number', required: false }),
    id: Property.ShortText({ displayName: 'Document ID', description: 'Search for document by its specific ID', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter documents by status',
      required: false,
      options: { options: DOCUMENT_STATUS_OPTIONS },
    }),
    status__ne: Property.StaticDropdown({
      displayName: 'Exclude Status',
      description: 'Exclude documents with this status',
      required: false,
      options: { options: DOCUMENT_STATUS_OPTIONS },
    }),
    template_id: templateFilterSingleDropdown,
    form_id: formDropdown,
    folder_uuid: folderDropdown,
    contact_id: contactDropdown,
    membership_id: memberDropdown,
    tag: tagDropdown,
    custom_tag: customTagInput,
    created_from: Property.DateTime({ displayName: 'Created From', description: 'Include only documents created on or after this date', required: false }),
    created_to: Property.DateTime({ displayName: 'Created To', description: 'Include only documents created before this date', required: false }),
    completed_from: Property.DateTime({ displayName: 'Completed From', description: 'Include only documents completed on or after this date', required: false }),
    completed_to: Property.DateTime({ displayName: 'Completed To', description: 'Include only documents completed before this date', required: false }),
    modified_from: Property.DateTime({ displayName: 'Modified From', description: 'Include only documents modified on or after this date', required: false }),
    modified_to: Property.DateTime({ displayName: 'Modified To', description: 'Include only documents modified before this date', required: false }),
    deleted: Property.Checkbox({
      displayName: 'Only Deleted Documents',
      description: 'When on, returns only deleted documents instead of active ones.',
      required: false,
    }),
    count: Property.Number({ displayName: 'Results Count', description: 'Number of documents to return (default: 50, max: 100)', required: false }),
    page: Property.Number({ displayName: 'Page Number', description: 'Page number for pagination (starts with 1)', required: false }),
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
  outputSchema: pandadocSchemas['rawFindDocuments'],
  async run({ auth, propsValue }) {
    const query: PandaDocQuery = {
      q: pandadocInputs.optionalString(propsValue.q),
      id: pandadocInputs.optionalString(propsValue.id),
      status: pandadocInputs.optionalNumber(propsValue.status),
      status__ne: pandadocInputs.optionalNumber(propsValue.status__ne),
      template_id: pandadocInputs.optionalString(propsValue.template_id),
      form_id: pandadocInputs.optionalString(propsValue.form_id),
      folder_uuid: pandadocInputs.optionalString(propsValue.folder_uuid),
      contact_id: pandadocInputs.optionalString(propsValue.contact_id),
      membership_id: pandadocInputs.optionalString(propsValue.membership_id),
      tag: pandadocInputs.pickCustom({ value: propsValue.tag, custom: propsValue.custom_tag }),
      created_from: pandadocInputs.optionalString(propsValue.created_from),
      created_to: pandadocInputs.optionalString(propsValue.created_to),
      completed_from: pandadocInputs.optionalString(propsValue.completed_from),
      completed_to: pandadocInputs.optionalString(propsValue.completed_to),
      modified_from: pandadocInputs.optionalString(propsValue.modified_from),
      modified_to: pandadocInputs.optionalString(propsValue.modified_to),
      deleted: propsValue.deleted === true ? true : undefined,
      count: pandadocInputs.boundedCount({ value: propsValue.count, label: 'Results Count' }),
      page: pandadocInputs.positivePage(propsValue.page),
      order_by: pandadocInputs.optionalString(propsValue.order_by),
      ...metadataQuery(propsValue.metadata),
    };
    return pandadocApi.listDocumentsRaw({ apiKey: auth.secret_text, query });
  },
});
