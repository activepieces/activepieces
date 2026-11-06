import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const importedContact: OutputSchema = {
  fields: [
    { key: 'contactId', label: 'Contact ID', format: 'number', description: 'ChargeKeep contact ID of the created or updated contact.' },
    { key: 'leadId', label: 'Lead ID', format: 'number', description: 'Lead ID when the contact was imported as a lead.' },
    { key: 'userId', label: 'User ID', format: 'number', description: 'Portal user ID, when ChargeKeep returns one.' },
  ],
};

const emailFields: OutputSchemaField[] = [
  { key: 'id', label: 'Email ID', format: 'number' },
  { key: 'emailAddress', label: 'Email', format: 'email' },
  { key: 'usageTypeId', label: 'Usage Type' },
  { key: 'isActive', label: 'Active', format: 'boolean' },
  { key: 'isConfirmed', label: 'Confirmed', format: 'boolean' },
];

const phoneFields: OutputSchemaField[] = [
  { key: 'id', label: 'Phone ID', format: 'number' },
  { key: 'phoneNumber', label: 'Phone' },
  { key: 'phoneExtension', label: 'Extension' },
  { key: 'usageTypeId', label: 'Usage Type' },
  { key: 'isActive', label: 'Active', format: 'boolean' },
  { key: 'isConfirmed', label: 'Confirmed', format: 'boolean' },
];

const addressFields: OutputSchemaField[] = [
  { key: 'id', label: 'Address ID', format: 'number' },
  { key: 'usageTypeId', label: 'Usage Type' },
  { key: 'streetAddress', label: 'Street' },
  { key: 'neighborhood', label: 'Neighborhood' },
  { key: 'city', label: 'City' },
  { key: 'stateId', label: 'State Code' },
  { key: 'stateName', label: 'State' },
  { key: 'zip', label: 'Zip' },
  { key: 'countryId', label: 'Country Code' },
  { key: 'countryName', label: 'Country' },
  { key: 'isActive', label: 'Active', format: 'boolean' },
];

const contact: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact ID', format: 'number' },
    { key: 'typeId', label: 'Type Code', description: 'Contact type code as returned by ChargeKeep.' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'namePrefix', label: 'Prefix' },
    { key: 'firstName', label: 'First Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'nameSuffix', label: 'Suffix' },
    { key: 'nickName', label: 'Nick Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of Birth', format: 'date' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'userId', label: 'User ID', format: 'number' },
    { key: 'contactDate', label: 'Created', format: 'datetime' },
    { key: 'primaryEmail', label: 'Primary Email', format: 'email' },
    { key: 'primaryPhone', label: 'Primary Phone' },
    { key: 'emails', label: 'Emails', labelKey: 'emailAddress', listItems: emailFields },
    { key: 'phones', label: 'Phones', labelKey: 'phoneNumber', listItems: phoneFields },
    { key: 'addresses', label: 'Addresses', labelKey: 'city', listItems: addressFields },
    { key: 'tags', label: 'Tags' },
    { key: 'lists', label: 'Lists' },
    { key: 'contactXrefs', label: 'XREFs' },
    { key: 'contactAffiliateCodes', label: 'Affiliate Codes' },
    { key: 'affiliateContactId', label: 'Affiliate Contact ID', format: 'number' },
    { key: 'affiliateContactFullName', label: 'Affiliate Contact' },
    { key: 'organization', label: 'Organization' },
    { key: 'customField1', label: 'Custom Field 1' },
    { key: 'customField2', label: 'Custom Field 2' },
    { key: 'customField3', label: 'Custom Field 3' },
    { key: 'customField4', label: 'Custom Field 4' },
    { key: 'customField5', label: 'Custom Field 5' },
  ],
};


const priceOptionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Price Option ID', format: 'number' },
  { key: 'type', label: 'Type', description: 'OneTime or Subscription.' },
  { key: 'frequency', label: 'Payment Cycle' },
  { key: 'unit', label: 'Unit' },
  { key: 'fee', label: 'Price', format: 'number' },
  { key: 'signupFee', label: 'Signup Fee', format: 'number' },
  { key: 'cycles', label: 'Cycles', format: 'number' },
  { key: 'trialDayCount', label: 'Trial Days', format: 'number' },
  { key: 'customPeriodCount', label: 'Custom Period Count', format: 'number' },
  { key: 'customPeriodType', label: 'Custom Period Type' },
  { key: 'gracePeriodDayCount', label: 'Grace Period Days', format: 'number' },
];

const product: OutputSchema = {
  fields: [
    { key: 'productId', label: 'Product ID', format: 'number' },
    { key: 'code', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'currencyId', label: 'Currency' },
    { key: 'isArchived', label: 'Archived', format: 'boolean' },
    { key: 'priceOptions', label: 'Price Options', labelKey: 'type', listItems: priceOptionFields },
    { key: 'detailsError', label: 'Details Error', description: 'Set when the product was saved but reading it back failed.' },
  ],
};

const invoiceLineFields: OutputSchemaField[] = [
  { key: 'id', label: 'Line ID', format: 'number' },
  { key: 'productId', label: 'Product ID', format: 'number' },
  { key: 'productCode', label: 'Product Code' },
  { key: 'productName', label: 'Product' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'rate', label: 'Rate', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'unitId', label: 'Unit' },
];

const invoice: OutputSchema = {
  fields: [
    { key: 'invoiceId', label: 'Invoice ID', format: 'number' },
    { key: 'number', label: 'Invoice No.' },
    { key: 'status', label: 'Status' },
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'contactName', label: 'Contact' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'currencyId', label: 'Currency' },
    { key: 'grandTotal', label: 'Grand Total', format: 'number' },
    { key: 'discountTotal', label: 'Discount Total', format: 'number' },
    { key: 'shippingTotal', label: 'Shipping Total', format: 'number' },
    { key: 'taxTotal', label: 'Tax Total', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'note', label: 'Note' },
    { key: 'lines', label: 'Lines', labelKey: 'productName', listItems: invoiceLineFields },
    { key: 'detailsError', label: 'Details Error', description: 'Set when the invoice was saved but reading it back failed.' },
  ],
};

const subscriptionFields: OutputSchemaField[] = [
  { key: 'subscriptionId', label: 'Subscription ID', format: 'number' },
  { key: 'productId', label: 'Product ID', format: 'number' },
  { key: 'productCode', label: 'Product Code' },
  { key: 'productName', label: 'Product' },
  { key: 'paymentPeriodType', label: 'Payment Period' },
  { key: 'status', label: 'Status' },
  { key: 'statusCode', label: 'Status Code' },
  { key: 'startDate', label: 'Start Date', format: 'datetime' },
  { key: 'endDate', label: 'End Date', format: 'datetime' },
  { key: 'trialEndDate', label: 'Trial End Date', format: 'datetime' },
  { key: 'fee', label: 'Fee', format: 'number' },
  { key: 'currencyId', label: 'Currency' },
  { key: 'cancellationDate', label: 'Cancellation Date', format: 'datetime' },
];

const subscriptionUpdate: OutputSchema = {
  fields: [
    { key: 'contactId', label: 'Contact ID', format: 'number' },
    { key: 'productCode', label: 'Product Code' },
    { key: 'paymentPeriodType', label: 'Payment Period' },
    { key: 'subscription', label: 'Subscription', children: subscriptionFields },
    { key: 'detailsError', label: 'Details Error', description: 'Set when the subscription was saved but reading it back failed.' },
  ],
};

const productList: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Products',
      labelKey: 'name',
      listItems: [
        { key: 'productId', label: 'Product ID', format: 'number' },
        { key: 'code', label: 'SKU' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'description', label: 'Description' },
        {
          key: 'paymentOptions',
          label: 'Payment Options',
          labelKey: 'unitName',
          listItems: [
            { key: 'priceOptionId', label: 'Price Option ID', format: 'number' },
            { key: 'type', label: 'Type' },
            { key: 'unitId', label: 'Unit ID' },
            { key: 'unitName', label: 'Unit' },
            { key: 'price', label: 'Price', format: 'number' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'mayHaveMore', label: 'May Have More', format: 'boolean', description: 'True when the result hit the limit; narrow the search phrase.' },
  ],
};

const contactSearch: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Contacts',
      labelKey: 'name',
      listItems: [
        { key: 'contactId', label: 'Contact ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'userId', label: 'User ID', format: 'number' },
        { key: 'city', label: 'City' },
        { key: 'stateName', label: 'State' },
        { key: 'country', label: 'Country' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'mayHaveMore', label: 'May Have More', format: 'boolean', description: 'True when the result hit the limit; narrow the search phrase.' },
  ],
};

const contactGroups: OutputSchema = {
  fields: [
    { key: 'items', label: 'Contact Groups', labelKey: 'name', listItems: [{ key: 'id', label: 'Group Code' }, { key: 'name', label: 'Name' }] },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const leadTrigger: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact ID', format: 'number' },
    { key: 'eventType', label: 'Event Type' },
    { key: 'group', label: 'Contact Group' },
    {
      key: 'personalInfo',
      label: 'Personal Info',
      children: [
        { key: 'fullName', label: 'Name', children: [{ key: 'namePrefix', label: 'Prefix' }, { key: 'firstName', label: 'First Name' }, { key: 'middleName', label: 'Middle Name' }, { key: 'lastName', label: 'Last Name' }, { key: 'nameSuffix', label: 'Suffix' }, { key: 'nickName', label: 'Nick Name' }] },
        { key: 'email1', label: 'Email', format: 'email' },
        { key: 'email2', label: 'Email 2', format: 'email' },
        { key: 'mobilePhone', label: 'Mobile Phone' },
        { key: 'homePhone', label: 'Home Phone' },
        { key: 'gender', label: 'Gender' },
        { key: 'doB', label: 'Date of Birth', format: 'datetime' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'webSiteUrl', label: 'Website', format: 'url' },
        { key: 'linkedInUrl', label: 'LinkedIn', format: 'url' },
        { key: 'affiliateCode', label: 'Affiliate Code' },
        { key: 'fullAddress', label: 'Address', children: [{ key: 'street', label: 'Street' }, { key: 'city', label: 'City' }, { key: 'stateId', label: 'State Code' }, { key: 'zip', label: 'Zip' }, { key: 'countryId', label: 'Country Code' }] },
        { key: 'customFields', label: 'Custom Fields', children: [{ key: 'customField1', label: 'Custom Field 1' }, { key: 'customField2', label: 'Custom Field 2' }, { key: 'customField3', label: 'Custom Field 3' }, { key: 'customField4', label: 'Custom Field 4' }, { key: 'customField5', label: 'Custom Field 5' }] },
      ],
    },
    { key: 'businessInfo', label: 'Business Info', children: [{ key: 'companyName', label: 'Company' }, { key: 'jobTitle', label: 'Job Title' }, { key: 'workEmail1', label: 'Work Email', format: 'email' }, { key: 'workPhone1', label: 'Work Phone' }] },
    { key: 'trackingInfo', label: 'Tracking Info', children: [{ key: 'sourceCode', label: 'Source Code' }, { key: 'channelCode', label: 'Channel Code' }, { key: 'campaignCode', label: 'Campaign Code' }, { key: 'affiliateCode', label: 'Affiliate Code' }, { key: 'refererUrl', label: 'Referer URL', format: 'url' }, { key: 'entryUrl', label: 'Entry URL', format: 'url' }, { key: 'siteUrl', label: 'Site URL', format: 'url' }] },
    { key: 'dateCreated', label: 'Created', format: 'datetime' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'eventTime', label: 'Event Time' },
  ],
};

const subscriptionTrigger: OutputSchema = {
  fields: [
    { key: 'id', label: 'Subscription ID', format: 'number' },
    { key: 'eventType', label: 'Event Type' },
    { key: 'contactId', label: 'Contact ID', format: 'number' },
    { key: 'contactFullName', label: 'Contact Name' },
    { key: 'contactEmail', label: 'Contact Email', format: 'email' },
    { key: 'contactXrefs', label: 'Contact XREFs' },
    { key: 'name', label: 'Product' },
    { key: 'startDate', label: 'Start Date', format: 'datetime' },
    { key: 'endDate', label: 'End Date', format: 'datetime' },
    { key: 'amount', label: 'Amount', format: 'number' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'trialDayCount', label: 'Trial Days', format: 'number' },
    { key: 'gracePeriodDayCount', label: 'Grace Period Days', format: 'number' },
    { key: 'statusId', label: 'Status Code', description: 'A active, U replaced/updated, and other ChargeKeep status codes.' },
    { key: 'cancelationReason', label: 'Cancelation Reason' },
    { key: 'eventTime', label: 'Event Time' },
  ],
};

export const chargekeepOutputSchemas = { importedContact, contact, product, invoice, subscriptionUpdate, productList, contactSearch, contactGroups, leadTrigger, subscriptionTrigger };
