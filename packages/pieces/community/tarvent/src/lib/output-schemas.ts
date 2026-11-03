import { OutputSchema } from '@activepieces/pieces-framework';

type Field = OutputSchema['fields'][number];

const contactFields: Field[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
  {
    key: 'groups',
    label: 'Groups',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Group ID' },
      { key: 'name', label: 'Group Name' },
    ],
  },
  { key: 'rating', label: 'Rating', format: 'number' },
  { key: 'streetAddress', label: 'Street Address' },
  { key: 'streetAddress2', label: 'Street Address 2' },
  { key: 'addressLocality', label: 'City' },
  { key: 'addressRegion', label: 'State / Region' },
  { key: 'postalCode', label: 'Postal Code' },
  { key: 'addressCountry', label: 'Country' },
  { key: 'timeZone', label: 'Time Zone' },
  { key: 'language', label: 'Language' },
  { key: 'sendFormat', label: 'Send Format' },
  { key: 'optInUtc', label: 'Opted In At', format: 'datetime' },
  { key: 'confirmedUtc', label: 'Confirmed At', format: 'datetime' },
  { key: 'optOutUtc', label: 'Opted Out At', format: 'datetime' },
  {
    key: 'profileFields',
    label: 'Profile Fields',
    listItems: [
      { key: 'id', label: 'Profile Field ID' },
      {
        key: 'dataField',
        label: 'Data Field',
        children: [
          { key: 'id', label: 'Data Field ID' },
          { key: 'labelText', label: 'Label' },
        ],
      },
      { key: 'value', label: 'Value' },
    ],
  },
  { key: 'createdUtc', label: 'Created At', format: 'datetime' },
  { key: 'modifiedUtc', label: 'Modified At', format: 'datetime' },
];

const pageFields: Field[] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
  { key: 'nextCursor', label: 'Next Cursor' },
];

const countedPageFields: Field[] = [...pageFields, { key: 'totalCount', label: 'Total Count', format: 'number' }];

const webhookContactFields: Field[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'key', label: 'Contact Key' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status Code' },
  { key: 'rating', label: 'Rating' },
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'streetaddress', label: 'Street Address' },
  { key: 'streetaddress2', label: 'Street Address 2' },
  { key: 'addresslocality', label: 'City' },
  { key: 'addressregion', label: 'State / Region' },
  { key: 'postalcode', label: 'Postal Code' },
  { key: 'addresscountry', label: 'Country' },
  { key: 'timezone', label: 'Time Zone' },
  { key: 'language', label: 'Language' },
  { key: 'sendformat', label: 'Send Format Code' },
  { key: 'optinsource', label: 'Opt-in Source Code' },
  { key: 'optinutc', label: 'Opted In At (UTC, MM/DD/YYYY)' },
  { key: 'confirmedutc', label: 'Confirmed At (UTC, MM/DD/YYYY)' },
  { key: 'createdutc', label: 'Created At (UTC, MM/DD/YYYY)' },
  { key: 'modifiedutc', label: 'Modified At (UTC, MM/DD/YYYY)' },
  { key: 'groups', label: 'Group IDs (JSON text)' },
  { key: 'tags', label: 'Tags (JSON text)' },
];

const contactPayloadField: Field = { key: 'contact', label: 'Contact', children: webhookContactFields };

function webhookEvent({ payload }: { payload: Field[] }): OutputSchema {
  return {
    fields: [
      { key: 'id', label: 'Event ID' },
      { key: 'dateUtc', label: 'Event Time', format: 'datetime' },
      { key: 'accountId', label: 'Account ID' },
      { key: 'eventType', label: 'Event Type', format: 'number' },
      {
        key: 'initiator',
        label: 'Initiator',
        children: [
          { key: 'source', label: 'Source Code' },
          { key: 'ip', label: 'IP' },
          { key: 'device', label: 'Device' },
          { key: 'software', label: 'Software' },
          { key: 'os', label: 'Operating System' },
          { key: 'referrer', label: 'Referrer', format: 'url' },
        ],
      },
      { key: 'payload', label: 'Payload', children: [...payload, contactPayloadField] },
    ],
  };
}

export const tarventOutputSchemas = {
  contact: { fields: contactFields },
  findContact: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'contact', label: 'Contact', children: contactFields },
    ],
  },
  contactPage: {
    fields: [{ key: 'items', label: 'Contacts', labelKey: 'email', listItems: contactFields }, ...pageFields],
  },
  deleteContact: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'audienceId', label: 'Audience ID' },
    ],
  },
  contactTags: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'action', label: 'Action' },
      { key: 'tags', label: 'Tags' },
    ],
  },
  contactGroup: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'groupId', label: 'Group ID' },
      { key: 'audienceId', label: 'Audience ID' },
      { key: 'action', label: 'Action' },
    ],
  },
  contactNoteCreated: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'message', label: 'Note' },
    ],
  },
  contactNotePage: {
    fields: [
      {
        key: 'items',
        label: 'Notes',
        labelKey: 'message',
        listItems: [
          { key: 'id', label: 'Note ID' },
          { key: 'message', label: 'Note' },
          { key: 'status', label: 'Status' },
          { key: 'createdBy', label: 'Created By' },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
          { key: 'modifiedUtc', label: 'Modified At', format: 'datetime' },
        ],
      },
      ...pageFields,
    ],
  },
  contactStatus: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'status', label: 'Status' },
    ],
  },
  contactJourney: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'journeyId', label: 'Journey ID' },
      { key: 'action', label: 'Action' },
    ],
  },
  journeyStatus: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'journeyId', label: 'Journey ID' },
      { key: 'action', label: 'Action' },
    ],
  },
  customEventGenerated: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'eventKey', label: 'Event Key' },
    ],
  },
  audienceGroup: {
    fields: [
      { key: 'id', label: 'Group ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'isPublic', label: 'Public', format: 'boolean' },
      { key: 'isDynamic', label: 'Dynamic', format: 'boolean' },
    ],
  },
  suppressionFilter: {
    fields: [
      { key: 'id', label: 'Suppression Filter ID' },
      { key: 'localPart', label: 'Local Part' },
      { key: 'domain', label: 'Domain' },
      { key: 'reason', label: 'Reason' },
      { key: 'createdUtc', label: 'Created At', format: 'datetime' },
    ],
  },
  suppressionRemoved: {
    fields: [
      { key: 'removed', label: 'Filters Removed', format: 'number' },
      { key: 'filterIds', label: 'Removed Filter IDs' },
    ],
  },
  transactionSent: {
    fields: [
      { key: 'requestId', label: 'Request ID' },
      { key: 'transactionId', label: 'Transaction ID' },
      {
        key: 'recipients',
        label: 'Recipients',
        labelKey: 'emailAddress',
        listItems: [
          { key: 'emailAddress', label: 'Email', format: 'email' },
          { key: 'transactionId', label: 'Transaction ID' },
          { key: 'sent', label: 'Accepted', format: 'boolean' },
          { key: 'errorCode', label: 'Error Code' },
          { key: 'errorMsg', label: 'Error Message' },
        ],
      },
    ],
  },
  transaction: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'transactionId', label: 'Transaction ID' },
      {
        key: 'items',
        label: 'Recipients',
        labelKey: 'recipient',
        listItems: [
          { key: 'id', label: 'Transaction ID' },
          { key: 'requestId', label: 'Request ID' },
          { key: 'status', label: 'Status' },
          { key: 'recipient', label: 'Recipient', format: 'email' },
          { key: 'recipientName', label: 'Recipient Name' },
          { key: 'recipientType', label: 'Recipient Type' },
          { key: 'from', label: 'From', format: 'email' },
          { key: 'fromName', label: 'From Name' },
          { key: 'replyTo', label: 'Reply To', format: 'email' },
          { key: 'subject', label: 'Subject' },
          { key: 'groupName', label: 'Group Name' },
          { key: 'tags', label: 'Tags' },
          { key: 'error', label: 'Error' },
          { key: 'bounceCategory', label: 'Bounce Category' },
          { key: 'openCount', label: 'Opens', format: 'number' },
          { key: 'clickCount', label: 'Clicks', format: 'number' },
          { key: 'sendCount', label: 'Send Count', format: 'number' },
          { key: 'complaint', label: 'Spam Complaint', format: 'boolean' },
          { key: 'unsubscribe', label: 'Unsubscribed', format: 'boolean' },
          { key: 'contactId', label: 'Contact ID' },
          { key: 'sendAtUtc', label: 'Send At', format: 'datetime' },
          { key: 'processedUtc', label: 'Processed At', format: 'datetime' },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  campaignSent: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'campaignId', label: 'Campaign ID' },
      { key: 'sendUtc', label: 'Send Time', format: 'datetime' },
    ],
  },
  campaignStats: {
    fields: [
      { key: 'campaignId', label: 'Campaign ID' },
      { key: 'totalSent', label: 'Sent', format: 'number' },
      { key: 'totalDelivered', label: 'Delivered', format: 'number' },
      { key: 'totalDeliveredPct', label: 'Delivered %', format: 'number' },
      { key: 'totalOpens', label: 'Opens', format: 'number' },
      { key: 'uniqueOpens', label: 'Unique Opens', format: 'number' },
      { key: 'uniqueOpensPct', label: 'Unique Opens %', format: 'number' },
      { key: 'totalClicks', label: 'Clicks', format: 'number' },
      { key: 'uniqueClicks', label: 'Unique Clicks', format: 'number' },
      { key: 'uniqueClicksPct', label: 'Unique Clicks %', format: 'number' },
      { key: 'clickToOpenPct', label: 'Click-to-Open %', format: 'number' },
      { key: 'totalReplies', label: 'Replies', format: 'number' },
      { key: 'uniqueReplies', label: 'Unique Replies', format: 'number' },
      { key: 'uniqueRepliesPct', label: 'Unique Replies %', format: 'number' },
      { key: 'totalBounce', label: 'Bounces', format: 'number' },
      { key: 'totalBouncePct', label: 'Bounces %', format: 'number' },
      { key: 'uniqueHardBounce', label: 'Hard Bounces', format: 'number' },
      { key: 'uniqueHardBouncePct', label: 'Hard Bounces %', format: 'number' },
      { key: 'uniqueSoftBounce', label: 'Soft Bounces', format: 'number' },
      { key: 'uniqueSoftBouncePct', label: 'Soft Bounces %', format: 'number' },
      { key: 'uniqueOptOut', label: 'Opt-outs', format: 'number' },
      { key: 'uniqueOptOutPct', label: 'Opt-outs %', format: 'number' },
      { key: 'uniqueSpam', label: 'Spam Complaints', format: 'number' },
      { key: 'uniqueSpamPct', label: 'Spam Complaints %', format: 'number' },
      { key: 'uniqueSuppressed', label: 'Suppressed', format: 'number' },
      { key: 'engagementScore', label: 'Engagement Score', format: 'number' },
      { key: 'engagementScoreAvg', label: 'Average Engagement Score', format: 'number' },
      { key: 'senderReputation', label: 'Sender Reputation', format: 'number' },
      { key: 'sendDomain', label: 'Send Domain' },
    ],
  },
  audiencePage: {
    fields: [
      {
        key: 'items',
        label: 'Audiences',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Audience ID' },
          { key: 'name', label: 'Name' },
          { key: 'companyName', label: 'Company Name' },
          { key: 'streetAddress', label: 'Street Address' },
          { key: 'streetAddress2', label: 'Street Address 2' },
          { key: 'addressLocality', label: 'City' },
          { key: 'addressRegion', label: 'State / Region' },
          { key: 'postalCode', label: 'Postal Code' },
          { key: 'addressCountry', label: 'Country' },
          { key: 'phone', label: 'Phone' },
          { key: 'website', label: 'Website', format: 'url' },
          { key: 'totalContacts', label: 'Total Contacts', format: 'number' },
          { key: 'totalActiveContacts', label: 'Active Contacts', format: 'number' },
          { key: 'totalUnconfirmedContacts', label: 'Unconfirmed Contacts', format: 'number' },
          { key: 'totalUndeliverableContacts', label: 'Undeliverable Contacts', format: 'number' },
          { key: 'totalUnsubscribedContacts', label: 'Unsubscribed Contacts', format: 'number' },
          { key: 'totalComplaintContacts', label: 'Complaint Contacts', format: 'number' },
          { key: 'totalSuppressedContacts', label: 'Suppressed Contacts', format: 'number' },
          { key: 'tags', label: 'Tags' },
          {
            key: 'customKeyDataField',
            label: 'Custom Key Field',
            children: [
              { key: 'id', label: 'Data Field ID' },
              { key: 'labelText', label: 'Label' },
            ],
          },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
          { key: 'lastModifiedUtc', label: 'Modified At', format: 'datetime' },
        ],
      },
      ...countedPageFields,
    ],
  },
  audienceGroupPage: {
    fields: [
      {
        key: 'items',
        label: 'Groups',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Group ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'isPublic', label: 'Public', format: 'boolean' },
        ],
      },
      ...countedPageFields,
    ],
  },
  campaignPage: {
    fields: [
      {
        key: 'items',
        label: 'Campaigns',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Campaign ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'audienceId', label: 'Audience ID' },
          { key: 'sendStatus', label: 'Send Status' },
          { key: 'tags', label: 'Tags' },
          { key: 'mvWinType', label: 'Multivariate Win Type' },
          { key: 'timeJumper', label: 'Time Jumper', format: 'boolean' },
          { key: 'scheduledToSendUtc', label: 'Scheduled To Send At', format: 'datetime' },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
          { key: 'modifiedUtc', label: 'Modified At', format: 'datetime' },
        ],
      },
      ...countedPageFields,
    ],
  },
  journeyPage: {
    fields: [
      {
        key: 'items',
        label: 'Journeys',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Journey ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'audienceId', label: 'Audience ID' },
          { key: 'status', label: 'Status' },
          { key: 'reEntryType', label: 'Re-entry Type' },
          { key: 'tags', label: 'Tags' },
          { key: 'totalEmailNodes', label: 'Email Steps', format: 'number' },
          { key: 'totalNotificationEmailNodes', label: 'Notification Email Steps', format: 'number' },
          { key: 'totalSiteNotificationNodes', label: 'Site Notification Steps', format: 'number' },
          { key: 'totalSMSNodes', label: 'SMS Steps', format: 'number' },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
          { key: 'modifiedUtc', label: 'Modified At', format: 'datetime' },
        ],
      },
      ...pageFields,
    ],
  },
  customEventPage: {
    fields: [
      {
        key: 'items',
        label: 'Custom Events',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Custom Event ID' },
          { key: 'key', label: 'Event Key' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'createdUtc', label: 'Created At', format: 'datetime' },
          { key: 'modifiedUtc', label: 'Modified At', format: 'datetime' },
        ],
      },
      ...pageFields,
    ],
  },
  tagPage: {
    fields: [
      {
        key: 'items',
        label: 'Tags',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Tag' },
          { key: 'count', label: 'Times Used', format: 'number' },
          { key: 'type', label: 'Entity Type' },
          { key: 'isSystem', label: 'System Tag', format: 'boolean' },
        ],
      },
      ...pageFields,
    ],
  },
  customApiCall: {
    fields: [
      { key: 'status', label: 'Status Code', format: 'number' },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body' },
    ],
  },
  contactEvent: webhookEvent({ payload: [{ key: 'audienceId', label: 'Audience ID' }] }),
  emailEvent: webhookEvent({ payload: [{ key: 'emailId', label: 'Email ID' }] }),
  clickEvent: webhookEvent({
    payload: [
      { key: 'emailId', label: 'Email ID' },
      {
        key: 'link',
        label: 'Link',
        children: [
          { key: 'id', label: 'Link ID' },
          { key: 'url', label: 'URL', format: 'url' },
        ],
      },
    ],
  }),
  bounceEvent: webhookEvent({
    payload: [
      { key: 'emailId', label: 'Email ID' },
      {
        key: 'bounce',
        label: 'Bounce',
        children: [
          { key: 'type', label: 'Bounce Type', format: 'number' },
          { key: 'response', label: 'Server Response' },
        ],
      },
    ],
  }),
  formEvent: webhookEvent({
    payload: [
      { key: 'formId', label: 'Form ID' },
      { key: 'questionData', label: 'Answers' },
    ],
  }),
  pageEvent: webhookEvent({ payload: [{ key: 'pageId', label: 'Page ID' }] }),
} satisfies Record<string, OutputSchema>;
