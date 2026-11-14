import { OutputSchema } from '@activepieces/pieces-framework';

const auditFields: OutputSchema['fields'] = [
  { key: 'createdon', label: 'Created On', format: 'datetime' },
  { key: 'modifiedon', label: 'Modified On', format: 'datetime' },
  { key: '_ownerid_value', label: 'Owner ID' },
  { key: 'statecode', label: 'Status Code', format: 'number' },
  { key: 'statuscode', label: 'Status Reason Code', format: 'number' },
];

const addressFields: OutputSchema['fields'] = [
  { key: 'address1_line1', label: 'Street' },
  { key: 'address1_city', label: 'City' },
  { key: 'address1_stateorprovince', label: 'State / Province' },
  { key: 'address1_postalcode', label: 'ZIP / Postal Code' },
  { key: 'address1_country', label: 'Country / Region' },
];

const contactFields: OutputSchema['fields'] = [
  { key: 'contactid', label: 'Contact ID' },
  { key: 'fullname', label: 'Full Name' },
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'emailaddress1', label: 'Email', format: 'email' },
  { key: 'telephone1', label: 'Business Phone' },
  { key: 'mobilephone', label: 'Mobile Phone' },
  { key: 'jobtitle', label: 'Job Title' },
  { key: '_parentcustomerid_value', label: 'Company ID' },
  ...addressFields,
  { key: 'description', label: 'Description' },
  ...auditFields,
];

const accountFields: OutputSchema['fields'] = [
  { key: 'accountid', label: 'Account ID' },
  { key: 'name', label: 'Account Name' },
  { key: 'accountnumber', label: 'Account Number' },
  { key: 'emailaddress1', label: 'Email', format: 'email' },
  { key: 'telephone1', label: 'Main Phone' },
  { key: 'websiteurl', label: 'Website', format: 'url' },
  { key: '_parentaccountid_value', label: 'Parent Account ID' },
  { key: '_primarycontactid_value', label: 'Primary Contact ID' },
  ...addressFields,
  { key: 'description', label: 'Description' },
  ...auditFields,
];

const leadFields: OutputSchema['fields'] = [
  { key: 'leadid', label: 'Lead ID' },
  { key: 'subject', label: 'Topic' },
  { key: 'fullname', label: 'Full Name' },
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'companyname', label: 'Company Name' },
  { key: 'emailaddress1', label: 'Email', format: 'email' },
  { key: 'telephone1', label: 'Business Phone' },
  { key: 'mobilephone', label: 'Mobile Phone' },
  { key: 'jobtitle', label: 'Job Title' },
  { key: 'websiteurl', label: 'Website', format: 'url' },
  { key: '_parentaccountid_value', label: 'Existing Account ID' },
  ...addressFields,
  { key: 'description', label: 'Description' },
  ...auditFields,
];

const opportunityFields: OutputSchema['fields'] = [
  { key: 'opportunityid', label: 'Opportunity ID' },
  { key: 'name', label: 'Topic' },
  { key: 'estimatedvalue', label: 'Est. Revenue', format: 'number' },
  { key: 'estimatedclosedate', label: 'Est. Close Date', format: 'date' },
  { key: 'closeprobability', label: 'Probability (%)', format: 'number' },
  { key: 'actualvalue', label: 'Actual Revenue', format: 'number' },
  { key: '_customerid_value', label: 'Customer ID' },
  { key: '_transactioncurrencyid_value', label: 'Currency ID' },
  { key: 'description', label: 'Description' },
  ...auditFields,
];

const genericRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'entitySet', label: 'Entity Set' },
  { key: 'etag', label: 'ETag' },
  { key: 'createdon', label: 'Created On', format: 'datetime' },
  { key: 'modifiedon', label: 'Modified On', format: 'datetime' },
  { key: '_ownerid_value', label: 'Owner ID' },
  { key: 'statecode', label: 'Status Code', format: 'number' },
  { key: 'statecode_formatted', label: 'Status' },
  { key: 'statuscode', label: 'Status Reason Code', format: 'number' },
  { key: 'statuscode_formatted', label: 'Status Reason' },
];

function topKeys(fields: OutputSchema['fields']): string[] {
  return fields.map((field) => field.value ?? field.key).filter((key) => key !== '');
}

function findSchema(fields: OutputSchema['fields']): OutputSchema {
  return {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'record', label: 'First Match', children: fields },
      { key: 'records', label: 'Matches', listItems: fields },
      { key: 'hasMore', label: 'More Matches Exist', format: 'boolean' },
    ],
  };
}

const recordPageFields: OutputSchema['fields'] = [
  { key: 'records', label: 'Records' },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
  { key: 'nextLink', label: 'Next Page Link', format: 'url' },
];

const columnFields: OutputSchema['fields'] = [
  { key: 'logicalName', label: 'Logical Name' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'type', label: 'Type' },
  { key: 'requiredLevel', label: 'Required Level' },
  { key: 'validForCreate', label: 'Valid For Create', format: 'boolean' },
  { key: 'validForUpdate', label: 'Valid For Update', format: 'boolean' },
  { key: 'filterName', label: 'Name To Use In Filters' },
  { key: 'options', label: 'Option Values', labelKey: 'label', listItems: [
    { key: 'value', label: 'Value', format: 'number' },
    { key: 'label', label: 'Label' },
  ] },
];

export const contactOutputSchema: OutputSchema = { fields: contactFields };
export const accountOutputSchema: OutputSchema = { fields: accountFields };
export const leadOutputSchema: OutputSchema = { fields: leadFields };
export const opportunityOutputSchema: OutputSchema = { fields: opportunityFields };
export const recordOutputSchema: OutputSchema = { fields: genericRecordFields };

export const findContactOutputSchema = findSchema(contactFields);
export const findAccountOutputSchema = findSchema(accountFields);
export const findLeadOutputSchema = findSchema(leadFields);
export const findOpportunityOutputSchema = findSchema(opportunityFields);

export const deleteRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Deleted', format: 'boolean' },
    { key: 'entitySet', label: 'Entity Set' },
    { key: 'recordId', label: 'Record ID' },
  ],
};

export const searchRecordsOutputSchema: OutputSchema = { fields: recordPageFields };

export const fetchXmlOutputSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records' },
    { key: 'moreRecords', label: 'More Records', format: 'boolean' },
    { key: 'nextPage', label: 'Next Page Number', format: 'number' },
    { key: 'pagingCookie', label: 'Paging Cookie' },
  ],
};

export const noteOutputSchema: OutputSchema = {
  fields: [
    { key: 'annotationid', label: 'Note ID' },
    { key: 'subject', label: 'Title' },
    { key: 'notetext', label: 'Text' },
    { key: 'isdocument', label: 'Has Attachment', format: 'boolean' },
    { key: 'filename', label: 'File Name' },
    { key: 'mimetype', label: 'MIME Type' },
    { key: 'filesize', label: 'File Size', format: 'filesize' },
    { key: '_objectid_value', label: 'Regarding Record ID' },
    { key: 'objecttypecode', label: 'Regarding Table' },
    { key: 'createdon', label: 'Created On', format: 'datetime' },
  ],
};

export const taskOutputSchema: OutputSchema = {
  fields: [
    { key: 'activityid', label: 'Task ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Description' },
    { key: 'scheduledend', label: 'Due Date', format: 'datetime' },
    { key: 'prioritycode', label: 'Priority Code', format: 'number' },
    { key: '_regardingobjectid_value', label: 'Regarding Record ID' },
    { key: '_ownerid_value', label: 'Owner ID' },
    { key: 'statecode', label: 'Status Code', format: 'number' },
    { key: 'createdon', label: 'Created On', format: 'datetime' },
  ],
};

export const associateOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'operation', label: 'Operation' },
    { key: 'entitySet', label: 'Entity Set' },
    { key: 'recordId', label: 'Record ID' },
    { key: 'navigationProperty', label: 'Relationship' },
    { key: 'relatedEntitySet', label: 'Related Entity Set' },
    { key: 'relatedRecordId', label: 'Related Record ID' },
  ],
};

export const qualifyLeadOutputSchema: OutputSchema = {
  fields: [
    { key: 'leadId', label: 'Lead ID' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'contactId', label: 'Created Contact ID' },
    { key: 'opportunityId', label: 'Created Opportunity ID' },
    { key: 'createdEntities', label: 'Created Records', labelKey: 'entityType', listItems: [
      { key: 'entityType', label: 'Table' },
      { key: 'id', label: 'Record ID' },
    ] },
  ],
};

export const closeOpportunityOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'opportunityId', label: 'Opportunity ID' },
    { key: 'outcome', label: 'Outcome' },
    { key: 'statusReason', label: 'Status Reason Code', format: 'number' },
  ],
};

export const listEntitiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'entities', label: 'Entities', labelKey: 'displayName', listItems: [
      { key: 'logicalName', label: 'Logical Name' },
      { key: 'entitySet', label: 'Entity Set' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'primaryIdAttribute', label: 'Primary ID Column' },
      { key: 'primaryNameAttribute', label: 'Primary Name Column' },
    ] },
  ],
};

export const describeEntityOutputSchema: OutputSchema = {
  fields: [
    { key: 'logicalName', label: 'Logical Name' },
    { key: 'entitySet', label: 'Entity Set' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'primaryIdAttribute', label: 'Primary ID Column' },
    { key: 'primaryNameAttribute', label: 'Primary Name Column' },
    { key: 'columns', label: 'Columns', labelKey: 'logicalName', listItems: columnFields },
    { key: 'lookups', label: 'Lookups', labelKey: 'navigationProperty', listItems: [
      { key: 'attribute', label: 'Lookup Column' },
      { key: 'navigationProperty', label: 'Navigation Property' },
      { key: 'targetEntity', label: 'Target Table' },
      { key: 'targetEntitySet', label: 'Target Entity Set' },
      { key: 'bindKey', label: 'Bind Key' },
    ] },
    { key: 'collectionRelationships', label: 'Collection Relationships', labelKey: 'navigationProperty', listItems: [
      { key: 'navigationProperty', label: 'Navigation Property' },
      { key: 'targetEntity', label: 'Target Table' },
      { key: 'targetEntitySet', label: 'Target Entity Set' },
      { key: 'kind', label: 'Kind' },
      { key: 'schemaName', label: 'Schema Name' },
    ] },
  ],
};

export const whoAmIOutputSchema: OutputSchema = {
  fields: [
    { key: 'userId', label: 'User ID' },
    { key: 'businessUnitId', label: 'Business Unit ID' },
    { key: 'organizationId', label: 'Organization ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email', format: 'email' },
  ],
};

export const outputKeys = {
  record: topKeys(genericRecordFields),
  contact: topKeys(contactFields),
  account: topKeys(accountFields),
  lead: topKeys(leadFields),
  opportunity: topKeys(opportunityFields),
};
