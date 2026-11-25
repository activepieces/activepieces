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

export const sentCampaignFields: OutputSchemaField[] = [
  { key: 'CampaignID', label: 'Campaign ID' },
  { key: 'Name', label: 'Name' },
  { key: 'Subject', label: 'Subject' },
  { key: 'FromName', label: 'From Name' },
  { key: 'FromEmail', label: 'From Email', format: 'email' },
  { key: 'ReplyTo', label: 'Reply To', format: 'email' },
  { key: 'SentDate', label: 'Sent Date', format: 'datetime' },
  { key: 'TotalRecipients', label: 'Total Recipients', format: 'number' },
  { key: 'WebVersionURL', label: 'Web Version URL', format: 'url' },
  { key: 'WebVersionTextURL', label: 'Web Version Text URL', format: 'url' },
  { key: 'Tags', label: 'Tags' },
];

export const sentCampaignOutputSchema: OutputSchema = {
  fields: sentCampaignFields,
};

export const listCampaignsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Results',
      label: 'Campaigns',
      labelKey: 'Name',
      listItems: sentCampaignFields,
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

export const createDraftCampaignOutputSchema: OutputSchema = {
  fields: [
    { key: 'campaignId', label: 'Campaign ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const sendCampaignOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'campaignId', label: 'Campaign ID' },
    { key: 'sendDate', label: 'Send Date' },
  ],
};

export const deleteDraftCampaignOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'campaignId', label: 'Campaign ID' },
  ],
};

export const campaignActivityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'Results',
      label: 'Activity',
      labelKey: 'EmailAddress',
      listItems: [
        { key: 'EmailAddress', label: 'Email Address', format: 'email' },
        { key: 'ListID', label: 'List ID' },
        { key: 'Date', label: 'Date', format: 'datetime' },
        { key: 'IPAddress', label: 'IP Address' },
        { key: 'URL', label: 'Clicked URL', format: 'url' },
        { key: 'BounceType', label: 'Bounce Type' },
        { key: 'Reason', label: 'Bounce Reason' },
        { key: 'Latitude', label: 'Latitude', format: 'number' },
        { key: 'Longitude', label: 'Longitude', format: 'number' },
        { key: 'City', label: 'City' },
        { key: 'Region', label: 'Region' },
        { key: 'CountryCode', label: 'Country Code' },
        { key: 'CountryName', label: 'Country Name' },
      ],
    },
    { key: 'ResultsOrderedBy', label: 'Results Ordered By' },
    { key: 'OrderDirection', label: 'Order Direction' },
    ...paginationFields,
  ],
};

export const listStatsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'TotalActiveSubscribers',
      label: 'Total Active Subscribers',
      format: 'number',
    },
    {
      key: 'NewActiveSubscribersToday',
      label: 'New Active Subscribers Today',
      format: 'number',
    },
    {
      key: 'NewActiveSubscribersYesterday',
      label: 'New Active Subscribers Yesterday',
      format: 'number',
    },
    {
      key: 'NewActiveSubscribersThisWeek',
      label: 'New Active Subscribers This Week',
      format: 'number',
    },
    {
      key: 'NewActiveSubscribersThisMonth',
      label: 'New Active Subscribers This Month',
      format: 'number',
    },
    {
      key: 'NewActiveSubscribersThisYear',
      label: 'New Active Subscribers This Year',
      format: 'number',
    },
    { key: 'TotalUnsubscribes', label: 'Total Unsubscribes', format: 'number' },
    { key: 'UnsubscribesToday', label: 'Unsubscribes Today', format: 'number' },
    {
      key: 'UnsubscribesYesterday',
      label: 'Unsubscribes Yesterday',
      format: 'number',
    },
    {
      key: 'UnsubscribesThisWeek',
      label: 'Unsubscribes This Week',
      format: 'number',
    },
    {
      key: 'UnsubscribesThisMonth',
      label: 'Unsubscribes This Month',
      format: 'number',
    },
    {
      key: 'UnsubscribesThisYear',
      label: 'Unsubscribes This Year',
      format: 'number',
    },
    { key: 'TotalDeleted', label: 'Total Deleted', format: 'number' },
    { key: 'DeletedToday', label: 'Deleted Today', format: 'number' },
    { key: 'DeletedYesterday', label: 'Deleted Yesterday', format: 'number' },
    { key: 'DeletedThisWeek', label: 'Deleted This Week', format: 'number' },
    { key: 'DeletedThisMonth', label: 'Deleted This Month', format: 'number' },
    { key: 'DeletedThisYear', label: 'Deleted This Year', format: 'number' },
    { key: 'TotalBounces', label: 'Total Bounces', format: 'number' },
    { key: 'BouncesToday', label: 'Bounces Today', format: 'number' },
    { key: 'BouncesYesterday', label: 'Bounces Yesterday', format: 'number' },
    { key: 'BouncesThisWeek', label: 'Bounces This Week', format: 'number' },
    { key: 'BouncesThisMonth', label: 'Bounces This Month', format: 'number' },
    { key: 'BouncesThisYear', label: 'Bounces This Year', format: 'number' },
  ],
};

export const suppressEmailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'emailAddresses', label: 'Email Addresses' },
  ],
};

export const unsuppressEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'emailAddress', label: 'Email Address', format: 'email' },
    { key: 'wasSuppressed', label: 'Was Suppressed', format: 'boolean' },
  ],
};

export const createCustomFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'Field Key' },
    { key: 'fieldName', label: 'Field Name' },
    { key: 'dataType', label: 'Data Type' },
    { key: 'listId', label: 'List ID' },
  ],
};
