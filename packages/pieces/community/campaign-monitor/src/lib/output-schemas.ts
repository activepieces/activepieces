import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

export const subscriberFields: OutputSchemaField[] = [
  { key: 'EmailAddress', label: 'Email Address', format: 'email' },
  { key: 'Name', label: 'Name' },
  { key: 'Date', label: 'Date', format: 'datetime' },
  { key: 'ListJoinedDate', label: 'List Joined Date', format: 'datetime' },
  { key: 'State', label: 'State' },
  { key: 'CustomFields', label: 'Custom Fields' },
  { key: 'ReadsEmailWith', label: 'Reads Email With' },
  { key: 'ConsentToTrack', label: 'Consent to Track' },
  { key: 'ConsentToSendSms', label: 'Consent to Send SMS' },
  { key: 'MobileNumber', label: 'Mobile Number' },
];

export const paginationFields: OutputSchemaField[] = [
  { key: 'PageNumber', label: 'Page Number', format: 'number' },
  { key: 'PageSize', label: 'Page Size', format: 'number' },
  { key: 'RecordsOnThisPage', label: 'Records on This Page', format: 'number' },
  {
    key: 'TotalNumberOfRecords',
    label: 'Total Number of Records',
    format: 'number',
  },
  { key: 'NumberOfPages', label: 'Number of Pages', format: 'number' },
];

export const subscriptionResultFields: OutputSchemaField[] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'emailAddress', label: 'Email Address', format: 'email' },
  { key: 'listId', label: 'List ID' },
];

export const subscriptionResultOutputSchema: OutputSchema = {
  fields: subscriptionResultFields,
};

export const findSubscriberOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Subscriber', children: subscriberFields },
  ],
};

export const subscriberOutputSchema: OutputSchema = {
  fields: subscriberFields,
};

export const clientOutputSchema: OutputSchema = {
  fields: [
    { key: 'ClientID', label: 'Client ID' },
    { key: 'Name', label: 'Name' },
  ],
};

export const listClientsOutputSchema: OutputSchema = {
  itemLabel: '{Name}',
  fields: [
    {
      key: 'clients',
      label: 'Clients',
      value: '',
      labelKey: 'Name',
      listItems: [
        { key: 'ClientID', label: 'Client ID' },
        { key: 'Name', label: 'Name' },
      ],
    },
  ],
};

export const listSmartEmailsOutputSchema: OutputSchema = {
  itemLabel: '{Name}',
  fields: [
    {
      key: 'smartEmails',
      label: 'Smart Emails',
      value: '',
      labelKey: 'Name',
      listItems: [
        { key: 'ID', label: 'Smart Email ID' },
        { key: 'Name', label: 'Name' },
        { key: 'Status', label: 'Status' },
        { key: 'CreatedAt', label: 'Created At' },
      ],
    },
  ],
};

export const listListsOutputSchema: OutputSchema = {
  itemLabel: '{Name}',
  fields: [
    {
      key: 'lists',
      label: 'Lists',
      value: '',
      labelKey: 'Name',
      listItems: [
        { key: 'ListID', label: 'List ID' },
        { key: 'Name', label: 'Name' },
      ],
    },
  ],
};

export const listSubscribersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Results',
      label: 'Subscribers',
      labelKey: 'EmailAddress',
      listItems: subscriberFields,
    },
    ...paginationFields,
  ],
};

export const createListOutputSchema: OutputSchema = {
  fields: [
    { key: 'listId', label: 'List ID' },
    { key: 'title', label: 'Title' },
  ],
};

export const listCampaignsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Results',
      label: 'Campaigns',
      labelKey: 'Name',
      listItems: [
        { key: 'CampaignID', label: 'Campaign ID' },
        { key: 'Name', label: 'Name' },
        { key: 'Subject', label: 'Subject' },
        { key: 'FromName', label: 'From Name' },
        { key: 'FromEmail', label: 'From Email', format: 'email' },
        { key: 'ReplyTo', label: 'Reply To', format: 'email' },
        { key: 'SentDate', label: 'Sent Date', format: 'datetime' },
        { key: 'TotalRecipients', label: 'Total Recipients', format: 'number' },
        { key: 'WebVersionURL', label: 'Web Version URL', format: 'url' },
        {
          key: 'WebVersionTextURL',
          label: 'Web Version Text URL',
          format: 'url',
        },
        { key: 'Tags', label: 'Tags' },
      ],
    },
    { key: 'ResultsOrderedBy', label: 'Results Ordered By' },
    { key: 'OrderDirection', label: 'Order Direction' },
    ...paginationFields,
  ],
};

export const campaignSummaryOutputSchema: OutputSchema = {
  fields: [
    { key: 'Name', label: 'Name' },
    { key: 'Recipients', label: 'Recipients', format: 'number' },
    { key: 'TotalOpened', label: 'Total Opened', format: 'number' },
    { key: 'UniqueOpened', label: 'Unique Opened', format: 'number' },
    { key: 'Clicks', label: 'Clicks', format: 'number' },
    { key: 'Unsubscribed', label: 'Unsubscribed', format: 'number' },
    { key: 'Bounced', label: 'Bounced', format: 'number' },
    { key: 'SpamComplaints', label: 'Spam Complaints', format: 'number' },
    { key: 'Forwards', label: 'Forwards', format: 'number' },
    { key: 'Likes', label: 'Likes', format: 'number' },
    { key: 'Mentions', label: 'Mentions', format: 'number' },
    { key: 'WebVersionURL', label: 'Web Version URL', format: 'url' },
    { key: 'WebVersionTextURL', label: 'Web Version Text URL', format: 'url' },
    { key: 'WorldviewURL', label: 'Worldview URL', format: 'url' },
  ],
};

export const sendSmartEmailOutputSchema: OutputSchema = {
  itemLabel: '{Recipient}',
  fields: [
    {
      key: 'messages',
      label: 'Messages',
      value: '',
      labelKey: 'Recipient',
      listItems: [
        { key: 'MessageID', label: 'Message ID' },
        { key: 'Recipient', label: 'Recipient' },
        { key: 'Status', label: 'Status' },
      ],
    },
  ],
};
