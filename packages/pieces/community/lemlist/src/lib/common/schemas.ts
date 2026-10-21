import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function pageSchema({
  label,
  labelKey,
  itemFields,
}: {
  label: string;
  labelKey: string;
  itemFields: OutputSchemaField[];
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      { key: 'count', label: 'Items Returned', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
      {
        key: 'has_more',
        label: 'Has More',
        format: 'boolean',
        description: 'True when the page was full; call again with Offset + Limit to get more.',
      },
    ],
  };
}

const leadFields: OutputSchemaField[] = [
  { key: '_id', label: 'Lead ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'companyDomain', label: 'Company Domain' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'campaignId', label: 'Campaign ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'isPaused', label: 'Is Paused', format: 'boolean' },
  { key: 'emailStatus', label: 'Email Status' },
];

const createdLeadFields: OutputSchemaField[] = [
  ...leadFields,
  { key: 'campaignName', label: 'Campaign Name' },
  { key: 'icebreaker', label: 'Icebreaker' },
  { key: 'phone', label: 'Phone' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', format: 'url' },
];

const leadByEmailFields: OutputSchemaField[] = [
  { key: '_id', label: 'Lead ID' },
  { key: 'state', label: 'State' },
  { key: 'status', label: 'Status' },
  { key: 'isPaused', label: 'Is Paused', format: 'boolean' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'source', label: 'Source' },
  { key: 'variables', label: 'Variables', description: 'Lead variables (firstName, companyName, custom variables...).' },
  {
    key: 'campaign',
    label: 'Campaign',
    children: [
      { key: 'id', label: 'Campaign ID' },
      { key: 'name', label: 'Campaign Name' },
      { key: 'status', label: 'Campaign Status' },
    ],
  },
  { key: 'sendingUser', label: 'Sending User', children: [{ key: 'email', label: 'Sender Email' }] },
];

const campaignFields: OutputSchemaField[] = [
  { key: '_id', label: 'Campaign ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By (User ID)' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'labels', label: 'Labels' },
  { key: 'hasError', label: 'Has Error', format: 'boolean' },
  { key: 'errors', label: 'Errors' },
  { key: 'sequenceId', label: 'Sequence ID' },
];

const activityFields: OutputSchemaField[] = [
  { key: '_id', label: 'Activity ID' },
  { key: 'type', label: 'Event Type' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'campaignId', label: 'Campaign ID' },
  { key: 'campaignName', label: 'Campaign Name' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'leadEmail', label: 'Lead Email', format: 'email' },
  { key: 'leadFirstName', label: 'Lead First Name' },
  { key: 'leadLastName', label: 'Lead Last Name' },
  { key: 'leadCompanyName', label: 'Lead Company Name' },
  { key: 'email', label: 'Contact Email', format: 'email' },
  { key: 'firstName', label: 'Contact First Name' },
  { key: 'lastName', label: 'Contact Last Name' },
  { key: 'sequenceId', label: 'Sequence ID' },
  { key: 'sequenceStep', label: 'Sequence Step', format: 'number' },
  { key: 'stepId', label: 'Step ID' },
  { key: 'sendUserId', label: 'Sender User ID' },
  { key: 'sendUserEmail', label: 'Sender Email', format: 'email' },
  { key: 'sendUserName', label: 'Sender Name' },
  { key: 'subject', label: 'Email Subject' },
  { key: 'teamId', label: 'Team ID' },
];

const contactFields: OutputSchemaField[] = [
  { key: '_id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'fields', label: 'Fields', description: 'Contact fields such as firstName, lastName, jobTitle, custom fields.' },
  {
    key: 'campaigns',
    label: 'Campaigns',
    labelKey: 'campaignId',
    listItems: [
      { key: 'campaignId', label: 'Campaign ID' },
      { key: 'campaignState', label: 'Campaign State' },
      { key: 'leadId', label: 'Lead ID' },
      { key: 'leadState', label: 'Lead State' },
    ],
  },
  { key: 'ownerId', label: 'Owner User ID' },
  { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'firstName', label: 'First Name', description: 'Returned by List Contacts (Get Contact puts it under Fields).' },
  { key: 'lastName', label: 'Last Name', description: 'Returned by List Contacts (Get Contact puts it under Fields).' },
  { key: 'campaignCount', label: 'Campaign Count', format: 'number' },
];

const companyFields: OutputSchemaField[] = [
  { key: '_id', label: 'Company ID' },
  { key: 'domain', label: 'Domain' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', format: 'url' },
  { key: 'fields', label: 'Fields', description: 'Company fields such as name, industry, location.' },
  { key: 'ownerId', label: 'Owner User ID' },
  { key: 'source', label: 'Source' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const noteFields: OutputSchemaField[] = [
  { key: '_id', label: 'Note ID' },
  { key: 'note', label: 'Note' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'companyId', label: 'Company ID' },
  { key: 'userId', label: 'Author User ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const taskFields: OutputSchemaField[] = [
  { key: '_id', label: 'Task ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Message' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'userId', label: 'Assigned User ID' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'campaignId', label: 'Campaign ID' },
  { key: 'leadFirstName', label: 'Lead First Name' },
  { key: 'leadLastName', label: 'Lead Last Name' },
  { key: 'ownerName', label: 'Assignee Name' },
  { key: 'manual', label: 'Manual Task', format: 'boolean' },
];

const unsubscribeFields: OutputSchemaField[] = [
  { key: '_id', label: 'Unsubscribe ID' },
  { key: 'value', label: 'Email or Domain' },
  { key: 'source', label: 'Source' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const labelFields: OutputSchemaField[] = [
  { key: '_id', label: 'Label ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const webhookFields: OutputSchemaField[] = [
  { key: '_id', label: 'Webhook ID' },
  { key: 'targetUrl', label: 'Target URL', format: 'url' },
  { key: 'type', label: 'Event Type' },
  { key: 'campaignId', label: 'Campaign ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'disabled', label: 'Disabled', format: 'boolean' },
  { key: 'disabledReason', label: 'Disabled Reason' },
];

const scheduleFields: OutputSchemaField[] = [
  { key: '_id', label: 'Schedule ID' },
  { key: 'name', label: 'Name' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'start', label: 'Start Time' },
  { key: 'end', label: 'End Time' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'secondsToWait', label: 'Seconds Between Emails', format: 'number' },
];

const warningsField: OutputSchemaField = {
  key: 'warnings',
  label: 'Warnings',
  labelKey: 'code',
  listItems: [
    { key: 'code', label: 'Code' },
    { key: 'message', label: 'Message' },
  ],
};

export const lemlistSchemas = {
  lead: { fields: leadFields },
  leadWithWarnings: {
    fields: [
      ...leadFields,
      { key: 'campaignName', label: 'Campaign Name' },
      { key: 'leadUrl', label: 'Lead API URL', format: 'url' },
      warningsField,
    ],
  },
  createdLead: { fields: [...createdLeadFields, warningsField] },
  leadList: { fields: leadFields, itemLabel: '{email}' },
  leadsByEmail: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'leads', label: 'Leads', labelKey: 'campaign.name', listItems: leadByEmailFields },
    ],
  },
  unsubscribedLead: { fields: leadFields },
  deletedLead: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyRemoved', label: 'Was Already Removed', format: 'boolean' },
      { key: 'lead', label: 'Lead', children: leadFields },
    ],
  },
  leadState: {
    fields: [
      { key: 'leads', label: 'Leads Updated', labelKey: 'campaignId', listItems: leadFields },
      { key: 'count', label: 'Leads Updated', format: 'number' },
    ],
  },
  variables: {
    fields: [{ key: 'ok', label: 'OK', format: 'boolean' }, warningsField],
  },
  ok: { fields: [{ key: 'ok', label: 'OK', format: 'boolean' }] },
  team: {
    fields: [
      { key: '_id', label: 'Team ID' },
      { key: 'name', label: 'Name' },
      { key: 'userIds', label: 'User IDs' },
      {
        key: 'users',
        label: 'Users',
        labelKey: 'email',
        listItems: [
          { key: 'userId', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'role', label: 'Role' },
        ],
      },
      { key: 'createdAt', label: 'Created At', format: 'datetime' },
    ],
  },
  senders: pageSchema({
    label: 'Senders',
    labelKey: 'userId',
    itemFields: [
      { key: 'userId', label: 'User ID' },
      {
        key: 'campaigns',
        label: 'Campaigns',
        labelKey: 'name',
        listItems: [
          { key: '_id', label: 'Campaign ID' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
        ],
      },
    ],
  }),
  credits: {
    fields: [
      { key: 'credits', label: 'Credits Left', format: 'number' },
      {
        key: 'details',
        label: 'Details',
        children: [
          {
            key: 'remaining',
            label: 'Remaining',
            children: [
              { key: 'total', label: 'Total', format: 'number' },
              { key: 'subscription', label: 'Subscription', format: 'number' },
              { key: 'paid', label: 'Paid', format: 'number' },
              { key: 'gifted', label: 'Gifted', format: 'number' },
              { key: 'freemium', label: 'Freemium', format: 'number' },
            ],
          },
        ],
      },
    ],
  },
  campaign: { fields: campaignFields },
  campaignDetails: {
    fields: [
      ...campaignFields,
      {
        key: 'senders',
        label: 'Senders',
        labelKey: 'email',
        listItems: [
          { key: 'id', label: 'User ID' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'sendUserMailboxId', label: 'Mailbox ID' },
        ],
      },
      {
        key: 'creator',
        label: 'Creator',
        children: [
          { key: 'userId', label: 'Creator User ID' },
          { key: 'userEmail', label: 'Creator Email', format: 'email' },
        ],
      },
    ],
  },
  campaignPage: pageSchema({ label: 'Campaigns', labelKey: 'name', itemFields: campaignFields }),
  createdCampaign: {
    fields: [
      { key: '_id', label: 'Campaign ID' },
      { key: 'name', label: 'Name' },
      { key: 'state', label: 'State' },
      { key: 'sequenceId', label: 'Sequence ID' },
      { key: 'scheduleIds', label: 'Schedule IDs' },
      { key: 'createdAt', label: 'Created At', format: 'datetime' },
    ],
  },
  updatedCampaign: {
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'stopOnEmailReplied', label: 'Stop on Email Replied', format: 'boolean' },
      { key: 'stopOnMeetingBooked', label: 'Stop on Meeting Booked', format: 'boolean' },
      { key: 'stopOnLinkClicked', label: 'Stop on Link Clicked', format: 'boolean' },
      { key: 'disableTrackOpen', label: 'Open Tracking Disabled', format: 'boolean' },
      { key: 'disableTrackClick', label: 'Click Tracking Disabled', format: 'boolean' },
    ],
  },
  campaignState: {
    fields: [
      { key: '_id', label: 'Campaign ID' },
      { key: 'state', label: 'State' },
    ],
  },
  campaignStats: {
    fields: [
      { key: 'nbLeads', label: 'Leads', format: 'number' },
      { key: 'nbLeadsLaunched', label: 'Leads Launched', format: 'number' },
      { key: 'nbLeadsReached', label: 'Leads Reached', format: 'number' },
      { key: 'nbLeadsOpened', label: 'Leads Opened', format: 'number' },
      { key: 'nbLeadsInteracted', label: 'Leads Interacted', format: 'number' },
      { key: 'nbLeadsAnswered', label: 'Leads Answered', format: 'number' },
      { key: 'nbLeadsInterested', label: 'Leads Interested', format: 'number' },
      { key: 'nbLeadsNotInterested', label: 'Leads Not Interested', format: 'number' },
      { key: 'nbLeadsUnsubscribed', label: 'Leads Unsubscribed', format: 'number' },
      { key: 'messagesSent', label: 'Messages Sent', format: 'number' },
      { key: 'messagesBounced', label: 'Messages Bounced', format: 'number' },
      { key: 'delivered', label: 'Delivered', format: 'number' },
      { key: 'opened', label: 'Opened', format: 'number' },
      { key: 'clicked', label: 'Clicked', format: 'number' },
      { key: 'replied', label: 'Replied', format: 'number' },
      { key: 'meetingBooked', label: 'Meetings Booked', format: 'number' },
      { key: 'nbLeadsInterrupted', label: 'Leads Interrupted', format: 'number' },
      { key: 'messagesNotSent', label: 'Messages Not Sent', format: 'number' },
      { key: 'invitationAccepted', label: 'LinkedIn Invitations Accepted', format: 'number' },
      { key: 'perChannel', label: 'Per Channel', description: 'Counts per channel (email, linkedin, ...): sent, delivered, opened, clicked, replied, bounced.' },
      {
        key: 'steps',
        label: 'Steps',
        labelKey: 'index',
        listItems: [
          { key: 'index', label: 'Index', format: 'number' },
          { key: 'taskType', label: 'Step Type' },
          { key: 'sent', label: 'Sent', format: 'number' },
          { key: 'opened', label: 'Opened', format: 'number' },
          { key: 'clicked', label: 'Clicked', format: 'number' },
          { key: 'replied', label: 'Replied', format: 'number' },
          { key: 'bounced', label: 'Bounced', format: 'number' },
        ],
      },
    ],
  },
  sequences: {
    fields: [
      {
        key: 'sequences',
        label: 'Sequences',
        labelKey: '_id',
        listItems: [
          { key: '_id', label: 'Sequence ID' },
          {
            key: 'steps',
            label: 'Steps',
            labelKey: 'index',
            listItems: [
              { key: '_id', label: 'Step ID' },
              { key: 'index', label: 'Index', format: 'number' },
              { key: 'type', label: 'Type' },
              { key: 'delay', label: 'Delay (days)', format: 'number' },
              { key: 'subject', label: 'Subject' },
              { key: 'message', label: 'Message', format: 'html' },
            ],
          },
        ],
      },
      { key: 'count', label: 'Sequences', format: 'number' },
    ],
  },
  schedules: {
    fields: [
      { key: 'items', label: 'Schedules', labelKey: 'name', listItems: scheduleFields },
      { key: 'count', label: 'Schedules Returned', format: 'number' },
    ],
  },
  campaignLeads: pageSchema({
    label: 'Leads',
    labelKey: '_id',
    itemFields: [
      { key: '_id', label: 'Lead ID' },
      { key: 'contactId', label: 'Contact ID' },
      { key: 'state', label: 'State' },
    ],
  }),
  enrichment: {
    fields: [{ key: 'id', label: 'Enrichment ID', description: 'Pass to Get Enrichment Result.' }],
  },
  enrichmentResult: {
    fields: [
      { key: 'enrichmentId', label: 'Enrichment ID' },
      { key: 'done', label: 'Done', format: 'boolean' },
      { key: 'enrichmentStatus', label: 'Status' },
      { key: 'input', label: 'Input' },
      { key: 'data', label: 'Data', description: 'Found email, phone or LinkedIn data.' },
    ],
  },
  activity: { fields: activityFields },
  activityPage: pageSchema({ label: 'Activities', labelKey: 'type', itemFields: activityFields }),
  unsubscribePage: pageSchema({ label: 'Unsubscribes', labelKey: 'value', itemFields: unsubscribeFields }),
  unsubscribeStatus: {
    fields: [
      { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
      { key: 'record', label: 'Record', children: unsubscribeFields },
    ],
  },
  unsubscribe: {
    fields: [
      { key: '_id', label: 'Unsubscribe ID' },
      { key: 'value', label: 'Email or Domain' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  contact: { fields: contactFields },
  contactLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'contact', label: 'Contact', children: contactFields },
    ],
  },
  upsertResult: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      {
        key: 'data',
        label: 'Record',
        children: [
          { key: '_id', label: 'ID' },
          { key: 'created', label: 'Created', format: 'boolean' },
          { key: 'updated', label: 'Updated', format: 'boolean' },
          { key: 'fields', label: 'Fields' },
        ],
      },
      warningsField,
    ],
  },
  contactPage: pageSchema({ label: 'Contacts', labelKey: 'email', itemFields: contactFields }),
  company: { fields: companyFields },
  companyPage: pageSchema({ label: 'Companies', labelKey: 'domain', itemFields: companyFields }),
  note: { fields: noteFields },
  notePage: {
    fields: [
      { key: 'items', label: 'Notes', labelKey: 'note', listItems: noteFields },
      { key: 'total', label: 'Total Notes', format: 'number' },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  messages: {
    fields: [
      {
        key: 'items',
        label: 'Messages',
        labelKey: 'type',
        listItems: [
          { key: '_id', label: 'Activity ID' },
          { key: 'type', label: 'Type' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'subject', label: 'Subject' },
          { key: 'message', label: 'Message', format: 'html' },
        ],
      },
      { key: 'count', label: 'Items Returned', format: 'number' },
      { key: 'total', label: 'Total Messages', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  sentEmail: {
    fields: [
      { key: 'ok', label: 'Sent', format: 'boolean' },
      { key: 'contactId', label: 'Contact ID' },
    ],
  },
  labels: {
    fields: [
      { key: 'items', label: 'Labels', labelKey: 'name', listItems: labelFields },
      { key: 'count', label: 'Labels Returned', format: 'number' },
    ],
  },
  label: { fields: labelFields },
  task: { fields: taskFields },
  taskPage: {
    fields: [
      { key: 'items', label: 'Tasks', labelKey: 'title', listItems: taskFields },
      { key: 'count', label: 'Items Returned', format: 'number' },
      { key: 'page', label: 'Page', format: 'number' },
    ],
  },
  ignoredTasks: {
    fields: [
      { key: 'ignored', label: 'Ignored Task IDs' },
      { key: 'count', label: 'Tasks Ignored', format: 'number' },
      { key: 'response', label: 'lemlist Response', description: 'Raw lemlist reply (an empty object on success).' },
    ],
  },
  webhooks: {
    fields: [
      { key: 'items', label: 'Webhooks', labelKey: 'targetUrl', listItems: webhookFields },
      { key: 'count', label: 'Webhooks (max 200 per team)', format: 'number' },
    ],
  },
} satisfies Record<string, OutputSchema>;
