import { OutputSchema } from '@activepieces/pieces-framework';

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'creatorId', label: 'Creator ID' },
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'previewurl', label: 'Preview URL', format: 'url' },
  { key: 'href', label: 'Download URL', format: 'url' },
];

const commenterFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'type', label: 'Type' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'roleName', label: 'Role Name' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'content', label: 'Content' },
  { key: 'commenterId', label: 'Commenter ID' },
  { key: 'commentedTime', label: 'Commented Time', format: 'datetime' },
  { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'commenter', label: 'Commenter', children: commenterFields },
  { key: 'impersonatedUser', label: 'Impersonated User' },
  { key: 'encodedContent', label: 'Encoded Content' },
];

const mappingInfoFields: OutputSchema['fields'] = [
  { key: 'mappingId', label: 'Mapping ID' },
  { key: 'mappingType', label: 'Mapping Type' },
  {
    key: 'isAccountTicketsViewable',
    label: 'Is Account Tickets Viewable',
    format: 'boolean',
  },
];

const customerHappinessFields: OutputSchema['fields'] = [
  { key: 'badPercentage', label: 'Bad Percentage' },
  { key: 'okPercentage', label: 'Ok Percentage' },
  { key: 'goodPercentage', label: 'Good Percentage' },
];

const followerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
];

const lastThreadFields: OutputSchema['fields'] = [
  { key: 'channel', label: 'Channel' },
  { key: 'isDraft', label: 'Is Draft', format: 'boolean' },
  { key: 'isForward', label: 'Is Forward', format: 'boolean' },
  { key: 'direction', label: 'Direction' },
];

const sourceFields: OutputSchema['fields'] = [
  { key: 'extId', label: 'Ext ID' },
  { key: 'appName', label: 'App Name' },
  { key: 'appPhotoURL', label: 'App Photo URL', format: 'image' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'type', label: 'Type' },
];

const ticketFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'ticketNumber', label: 'Ticket Number' },
  { key: 'layoutId', label: 'Layout ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'statusType', label: 'Status Type' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'category', label: 'Category' },
  { key: 'language', label: 'Language' },
  { key: 'subCategory', label: 'Sub Category' },
  { key: 'priority', label: 'Priority' },
  { key: 'channel', label: 'Channel' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'responseDueDate', label: 'Response Due Date', format: 'datetime' },
  { key: 'commentCount', label: 'Comment Count' },
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'threadCount', label: 'Thread Count' },
  { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
  { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'departmentId', label: 'Department ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'productId', label: 'Product ID' },
  { key: 'assigneeId', label: 'Assignee ID' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'relationshipType', label: 'Relationship Type' },
  { key: 'channelCode', label: 'Channel Code' },
  { key: 'lastThread', label: 'Last Thread', children: lastThreadFields },
  {
    key: 'customerResponseTime',
    label: 'Customer Response Time',
    format: 'datetime',
  },
  { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
  { key: 'source', label: 'Source', children: sourceFields },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
];

const parentFields: OutputSchema['fields'] = [
  { key: 'ticketNumber', label: 'Ticket Number' },
  { key: 'subject', label: 'Subject' },
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'tagType', label: 'Tag Type' },
  { key: 'id', label: 'ID' },
];

const agentFields: OutputSchema['fields'] = [
  { key: 'zuid', label: 'Zuid' },
  { key: 'emailId', label: 'Email ID', format: 'email' },
  { key: 'isConfirmed', label: 'Is Confirmed', format: 'boolean' },
  { key: 'status', label: 'Status' },
  { key: 'roleId', label: 'Role ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'aboutInfo', label: 'About Info' },
  { key: 'extn', label: 'Extn' },
  { key: 'countryCode', label: 'Country Code' },
  { key: 'name', label: 'Name' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'rolePermissionType', label: 'Role Permission Type' },
  { key: 'associatedDepartmentIds', label: 'Associated Department IDs' },
  { key: 'timeZone', label: 'Time Zone' },
  { key: 'id', label: 'ID' },
  { key: 'profileId', label: 'Profile ID' },
  { key: 'channelExpert', label: 'Channel Expert' },
  { key: 'langCode', label: 'Lang Code' },
  { key: 'cf', label: 'Custom Fields (API Names)' },
  {
    key: 'associatedChatDepartmentIds',
    label: 'Associated Chat Department IDs',
  },
  { key: 'isZiaAgent', label: 'Is Zia Agent', format: 'boolean' },
];

const approvalFields: OutputSchema['fields'] = [
  { key: 'approver', label: 'Approver', children: followerFields },
  { key: 'requester', label: 'Requester', children: followerFields },
  { key: 'requestedTime', label: 'Requested Time', format: 'datetime' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'processedTime', label: 'Processed Time', format: 'datetime' },
];

const resultFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'errors', label: 'Errors' },
];

const modifiedByFields: OutputSchema['fields'] = [
  { key: 'emailId', label: 'Email ID', format: 'email' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'id', label: 'ID' },
];

const commentWithAttachmentsFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'content', label: 'Content' },
  { key: 'commenterId', label: 'Commenter ID' },
  { key: 'commentedTime', label: 'Commented Time', format: 'datetime' },
  { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'commenter', label: 'Commenter', children: commenterFields },
  { key: 'impersonatedUser', label: 'Impersonated User' },
  { key: 'encodedContent', label: 'Encoded Content' },
  { key: 'attachments', label: 'Attachments' },
];

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'accountCount', label: 'Account Count' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'secondaryEmail', label: 'Secondary Email', format: 'email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Type' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'ownerId', label: 'Owner ID' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
  { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
  { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  {
    key: 'customerHappiness',
    label: 'Customer Happiness',
    children: customerHappinessFields,
  },
  { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
];

const supportPlanFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'supportType', label: 'Support Type' },
];

const accountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'website', label: 'Website' },
];

const ownerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
];

const authorFields: OutputSchema['fields'] = [
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'email', label: 'Email', format: 'email' },
];

const actionFields: OutputSchema['fields'] = [
  { key: 'method', label: 'Method' },
  { key: 'rel', label: 'Rel' },
  { key: 'href', label: 'Download URL', format: 'url' },
];

const teamFields: OutputSchema['fields'] = [
  { key: 'rolesWithSubordinates', label: 'Roles With Subordinates' },
  { key: 'departmentId', label: 'Department ID' },
  { key: 'roles', label: 'Roles' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'derivedAgents', label: 'Derived Agents' },
  { key: 'id', label: 'ID' },
  { key: 'subTeams', label: 'Sub Teams' },
  { key: 'logoUrl', label: 'Logo URL', format: 'image' },
  { key: 'agents', label: 'Agents' },
];

const agentRefFields: OutputSchema['fields'] = [
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'zuid', label: 'Zuid' },
];

const availableLocaleTranslationFields: OutputSchema['fields'] = [
  { key: 'translationId', label: 'Translation ID' },
  { key: 'authorId', label: 'Author ID' },
  { key: 'status', label: 'Status' },
  { key: 'latestVersionStatus', label: 'Latest Version Status' },
  { key: 'latestPublishedVersion', label: 'Latest Published Version' },
  { key: 'latestVersion', label: 'Latest Version' },
  { key: 'href', label: 'Download URL', format: 'url' },
  { key: 'translationState', label: 'Translation State' },
  { key: 'locale', label: 'Locale' },
  { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
  { key: 'isLocked', label: 'Is Locked', format: 'boolean' },
];

const categoryFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'locale', label: 'Locale' },
];

const historyFields: OutputSchema['fields'] = [
  { key: 'author', label: 'Author', children: followerFields },
  { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
  { key: 'content', label: 'Content' },
];

const roleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'reportsTo', label: 'Reports To' },
  { key: 'immediateSubRoles', label: 'Immediate Sub Roles' },
  {
    key: 'shareDataWithPeers',
    label: 'Share Data With Peers',
    format: 'boolean',
  },
  { key: 'isDefault', label: 'Is Default', format: 'boolean' },
  { key: 'isVisible', label: 'Is Visible', format: 'boolean' },
];

const threadSourceFields: OutputSchema['fields'] = [
  { key: 'appName', label: 'App Name' },
  { key: 'extId', label: 'Ext ID' },
  { key: 'permalink', label: 'Permalink' },
  { key: 'type', label: 'Type' },
  { key: 'uuid', label: 'Uuid' },
  { key: 'appPhotoURL', label: 'App Photo URL', format: 'image' },
];

const accountSummaryFields: OutputSchema['fields'] = [
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'id', label: 'ID' },
];

const creatorFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'photoUrl', label: 'Photo URL', format: 'image' },
  { key: 'id', label: 'ID' },
];

const agentContactFields: OutputSchema['fields'] = [
  { key: 'photoURL', label: 'Photo URL', format: 'image' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'emailId', label: 'Email ID', format: 'email' },
  { key: 'id', label: 'ID' },
  { key: 'zuid', label: 'Zuid' },
];

const contactSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Type' },
  { key: 'account', label: 'Account', children: accountSummaryFields },
];

const callFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'layoutId', label: 'Layout ID' },
  { key: 'departmentId', label: 'Department ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'startTime', label: 'Start Time', format: 'datetime' },
  { key: 'direction', label: 'Direction' },
  { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
  { key: 'ownerId', label: 'Owner ID' },
  { key: 'status', label: 'Status' },
  { key: 'statusType', label: 'Status Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
  { key: 'creatorId', label: 'Creator ID' },
  { key: 'callId', label: 'Call ID' },
  { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
  { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
  { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
  { key: 'ticketId', label: 'Ticket ID' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
  { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
];

const entityPinnedFields: OutputSchema['fields'] = [
  { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'encodedContent', label: 'Encoded Content' },
  { key: 'commentedTime', label: 'Commented Time', format: 'datetime' },
  { key: 'isPublic', label: 'Is Public', format: 'boolean' },
  { key: 'id', label: 'ID' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'content', label: 'Content' },
  { key: 'commenterId', label: 'Commenter ID' },
  { key: 'commenter', label: 'Commenter', children: commenterFields },
  { key: 'impersonatedUser', label: 'Impersonated User' },
];

const pinFields: OutputSchema['fields'] = [
  { key: 'pinnedTime', label: 'Pinned Time', format: 'datetime' },
  { key: 'pinnedById', label: 'Pinned By ID' },
  { key: 'entityPinned', label: 'Entity Pinned', children: entityPinnedFields },
  { key: 'isPublic', label: 'Is Public', format: 'boolean' },
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
];

const ticketContactFields: OutputSchema['fields'] = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'id', label: 'ID' },
  { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'secId', label: 'Sec ID' },
];

const ticketListItemFields: OutputSchema['fields'] = [
  { key: 'ticketNumber', label: 'Ticket Number' },
  { key: 'subject', label: 'Subject' },
  { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'channel', label: 'Channel' },
  { key: 'team', label: 'Team' },
  { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
  { key: 'secId', label: 'Sec ID' },
  { key: 'phone', label: 'Phone' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'contact', label: 'Contact', children: ticketContactFields },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'id', label: 'ID' },
  { key: 'assignee', label: 'Assignee', children: agentContactFields },
  { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  { key: 'status', label: 'Status' },
];

const timerFields: OutputSchema['fields'] = [
  { key: 'hours', label: 'Hours', format: 'number' },
  { key: 'seconds', label: 'Seconds', format: 'number' },
  { key: 'minutes', label: 'Minutes', format: 'number' },
  { key: 'state', label: 'State' },
];

const ticketAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'creatorId', label: 'Creator ID' },
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'isPublic', label: 'Is Public', format: 'boolean' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'previewurl', label: 'Preview URL', format: 'url' },
  { key: 'href', label: 'Download URL', format: 'url' },
];

const linkedParentFields: OutputSchema['fields'] = [
  { key: 'ticketNumber', label: 'Ticket Number' },
  { key: 'subject', label: 'Subject' },
  { key: 'associatedTicketId', label: 'Associated Ticket ID' },
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
];

export const zohoDeskAddAccountFollowersOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'followerIds', label: 'Follower IDs' },
  ],
};

export const zohoDeskUploadAccountAttachmentOutputSchema: OutputSchema = {
  fields: attachmentFields,
};

export const zohoDeskListAccountAttachmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'name',
      listItems: attachmentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateAccountCommentOutputSchema: OutputSchema = {
  fields: commentFields,
};

export const zohoDeskListAccountCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      listItems: commentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAccountContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'ID' },
        {
          key: 'mappingInfo',
          label: 'Mapping Info',
          children: mappingInfoFields,
        },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'accountCount', label: 'Account Count' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'secondaryEmail', label: 'Secondary Email', format: 'email' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'phone', label: 'Phone' },
        { key: 'type', label: 'Type' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
        { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
        { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
        {
          key: 'customerHappiness',
          label: 'Customer Happiness',
          children: customerHappinessFields,
        },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAccountContractsOutputSchema: OutputSchema = {
  fields: [
    { key: 'contracts', label: 'Contracts' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAccountFollowersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'followers',
      label: 'Followers',
      labelKey: 'email',
      listItems: followerFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAccountHistoryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'history',
      label: 'History',
      labelKey: 'subject',
      listItems: [
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'eventTime', label: 'Event Time', format: 'datetime' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'operation', label: 'Operation' },
        { key: 'statusType', label: 'Status Type' },
        {
          key: 'author',
          label: 'Author',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'photoURL', label: 'Photo URL', format: 'image' },
            { key: 'type', label: 'Type' },
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
          ],
        },
        { key: 'recipients', label: 'Recipients' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAccountProductsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'products',
      label: 'Products',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'productName', label: 'Product Name' },
        { key: 'productCode', label: 'Product Code' },
        { key: 'unitPrice', label: 'Unit Price', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSetAccountSlaOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'slaId', label: 'Sla ID' },
    { key: 'associate', label: 'Associate', format: 'boolean' },
  ],
};

export const zohoDeskListAccountSlasOutputSchema: OutputSchema = {
  fields: [
    { key: 'slas', label: 'Slas' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetAccountStatisticsOutputSchema: OutputSchema = {
  fields: [
    { key: 'firstResponseTime', label: 'First Response Time' },
    { key: 'openTickets', label: 'Open Tickets' },
    { key: 'responseTime', label: 'Response Time' },
    { key: 'spamTickets', label: 'Spam Tickets' },
    { key: 'totalTickets', label: 'Total Tickets' },
    {
      key: 'customerHappiness',
      label: 'Customer Happiness',
      children: [
        { key: 'badCount', label: 'Bad Count' },
        { key: 'goodCount', label: 'Good Count' },
        { key: 'okCount', label: 'Ok Count' },
      ],
    },
    { key: 'closedTickets', label: 'Closed Tickets' },
    { key: 'resolutionTime', label: 'Resolution Time' },
    {
      key: 'channelWiseCount',
      label: 'Channel Wise Count',
      children: [{ key: 'phone', label: 'Phone' }],
    },
    { key: 'escalatedTickets', label: 'Escalated Tickets' },
    { key: 'onholdTickets', label: 'Onhold Tickets' },
    { key: 'overdueTickets', label: 'Overdue Tickets' },
  ],
};

export const zohoDeskListAccountTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tickets',
      label: 'Tickets',
      labelKey: 'subject',
      listItems: ticketFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetAccountTimeSummaryOutputSchema: OutputSchema = {
  fields: [
    { key: 'totalMins', label: 'Total Mins', format: 'number' },
    { key: 'totalHours', label: 'Total Hours', format: 'number' },
    { key: 'totalCosts', label: 'Total Costs', format: 'number' },
    { key: 'totalSeconds', label: 'Total Seconds', format: 'number' },
  ],
};

export const zohoDeskListAccountTimeEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timeEntries',
      label: 'Time Entries',
      labelKey: 'id',
      listItems: [
        { key: 'parent', label: 'Parent', children: parentFields },
        { key: 'executedTime', label: 'Executed Time', format: 'datetime' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'departmentId', label: 'Department ID' },
        {
          key: 'agentCostPerHour',
          label: 'Agent Cost Per Hour',
          format: 'number',
        },
        { key: 'description', label: 'Description' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'mode', label: 'Mode' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'billingType', label: 'Billing Type' },
        { key: 'requestId', label: 'Request ID' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        { key: 'requestChargeType', label: 'Request Charge Type' },
        {
          key: 'layoutDetails',
          label: 'Layout Details',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'layoutName', label: 'Layout Name' },
          ],
        },
        { key: 'secondsSpent', label: 'Seconds Spent', format: 'number' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'fixedCost', label: 'Fixed Cost', format: 'number' },
        { key: 'minutesSpent', label: 'Minutes Spent', format: 'number' },
        { key: 'hoursSpent', label: 'Hours Spent', format: 'number' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'isBillable', label: 'Is Billable', format: 'boolean' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'invoiceId', label: 'Invoice ID' },
        { key: 'additionalCost', label: 'Additional Cost', format: 'number' },
        { key: 'totalCost', label: 'Total Cost', format: 'number' },
        { key: 'taskId', label: 'Task ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'website', label: 'Website', format: 'url' },
    { key: 'fax', label: 'Fax' },
    { key: 'industry', label: 'Industry' },
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' },
    { key: 'phone', label: 'Phone' },
    { key: 'annualrevenue', label: 'Annualrevenue' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'customFields', label: 'Custom Fields' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'associatedSLAIds', label: 'Associated SLAIds' },
    { key: 'zohoCRMAccount', label: 'Zoho CRM Account' },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
  ],
};

export const zohoDeskAddTicketFollowersOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'followerIds', label: 'Follower IDs' },
  ],
};

export const zohoDeskAddTicketTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Data', labelKey: 'name', listItems: tagFields },
  ],
};

export const zohoDeskFindAgentByEmailOutputSchema: OutputSchema = {
  fields: agentFields,
};

export const zohoDeskGetAgentTimeEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'parent', label: 'Parent', children: parentFields },
    { key: 'executedTime', label: 'Executed Time', format: 'datetime' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'agentCostPerHour', label: 'Agent Cost Per Hour', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'mode', label: 'Mode' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'requestId', label: 'Request ID' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'id', label: 'ID' },
    { key: 'requestChargeType', label: 'Request Charge Type' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'secondsSpent', label: 'Seconds Spent', format: 'number' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'fixedCost', label: 'Fixed Cost', format: 'number' },
    { key: 'minutesSpent', label: 'Minutes Spent', format: 'number' },
    { key: 'hoursSpent', label: 'Hours Spent', format: 'number' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'isBillable', label: 'Is Billable', format: 'boolean' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'invoiceId', label: 'Invoice ID' },
    { key: 'additionalCost', label: 'Additional Cost', format: 'number' },
    { key: 'totalCost', label: 'Total Cost', format: 'number' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const zohoDeskCreateTicketApprovalOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'approvals',
      label: 'Approvals',
      labelKey: 'subject',
      listItems: approvalFields,
    },
  ],
};

export const zohoDeskGetTicketApprovalOutputSchema: OutputSchema = {
  fields: approvalFields,
};

export const zohoDeskUpdateTicketApprovalOutputSchema: OutputSchema = {
  fields: approvalFields,
};

export const zohoDeskListTicketApprovalsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'approvals',
      label: 'Approvals',
      labelKey: 'subject',
      listItems: approvalFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskAssociateAccountProductsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'id',
      listItems: resultFields,
    },
  ],
};

export const zohoDeskAssociateProductAccountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'productId', label: 'Product ID' },
    { key: 'accountIds', label: 'Account IDs' },
    { key: 'associate', label: 'Associate', format: 'boolean' },
  ],
};

export const zohoDeskAssociateProductContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'productId', label: 'Product ID' },
    { key: 'contactIds', label: 'Contact IDs' },
    { key: 'associate', label: 'Associate', format: 'boolean' },
  ],
};

export const zohoDeskListBadgesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'badges',
      label: 'Badges',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'isCustom', label: 'Is Custom', format: 'boolean' },
        { key: 'iconUrl', label: 'Icon URL', format: 'image' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskAddContactFollowersOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'followerIds', label: 'Follower IDs' },
  ],
};

export const zohoDeskListContactHelpCentersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'helpCenters',
      label: 'Help Centers',
      listItems: [
        {
          key: 'helpCenter',
          label: 'Help Center',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'status', label: 'Status' },
          ],
        },
        { key: 'userId', label: 'User ID' },
        { key: 'userStatus', label: 'User Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskInviteContactToHelpCenterOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'helpCenterId', label: 'Help Center ID' },
  ],
};

export const zohoDeskListContactProfilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'profiles', label: 'Profiles' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateCallOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'startTime', label: 'Start Time', format: 'datetime' },
    { key: 'direction', label: 'Direction' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'status', label: 'Status' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'callId', label: 'Call ID' },
    { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
    { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskCreateCallCommentOutputSchema: OutputSchema = {
  fields: commentWithAttachmentsFields,
};

export const zohoDeskListCallCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      listItems: commentWithAttachmentsFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCloseTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketIds', label: 'Ticket IDs' },
  ],
};

export const zohoDeskCreateContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'accountCount', label: 'Account Count' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'secondaryEmail', label: 'Secondary Email', format: 'email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'state', label: 'State' },
    { key: 'street', label: 'Street' },
    { key: 'zip', label: 'Zip' },
    { key: 'description', label: 'Description' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'language', label: 'Language' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'photoURL', label: 'Photo URL', format: 'image' },
    {
      key: 'customerHappiness',
      label: 'Customer Happiness',
      children: customerHappinessFields,
    },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskListContactAccountsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'accounts',
      label: 'Accounts',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'accountName', label: 'Account Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'website', label: 'Website', format: 'url' },
        { key: 'phone', label: 'Phone' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        {
          key: 'mappingInfo',
          label: 'Mapping Info',
          children: mappingInfoFields,
        },
        { key: 'mappingType', label: 'Mapping Type' },
        { key: 'zohoCRMAccount', label: 'Zoho CRM Account' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        {
          key: 'customerHappiness',
          label: 'Customer Happiness',
          children: customerHappinessFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListContactTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tickets',
      label: 'Tickets',
      labelKey: 'subject',
      listItems: ticketFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetContactsByIdsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'email',
      listItems: contactFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateContractOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'supportPlan', label: 'Support Plan', children: supportPlanFields },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'contractName', label: 'Contract Name' },
    { key: 'contractNumber', label: 'Contract Number' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'productId', label: 'Product ID' },
    { key: 'notifyOn', label: 'Notify On', format: 'date' },
    {
      key: 'sla',
      label: 'Sla',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    { key: 'account', label: 'Account', children: accountFields },
    {
      key: 'product',
      label: 'Product',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'productName', label: 'Product Name' },
      ],
    },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'modifiedBy', label: 'Modified By' },
    { key: 'startDate', label: 'Start Date', format: 'date' },
    { key: 'endDate', label: 'End Date', format: 'date' },
    { key: 'contractStatus', label: 'Contract Status' },
    { key: 'owner', label: 'Owner', children: ownerFields },
    { key: 'notificationAgentIds', label: 'Notification Agent IDs' },
    { key: 'notifyBefore', label: 'Notify Before' },
    { key: 'associatedSLAId', label: 'Associated SLAId' },
  ],
};

export const zohoDeskDownloadContractCommentAttachmentOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'fileName', label: 'File Name' },
      { key: 'file', label: 'File', format: 'url' },
    ],
  };

export const zohoDeskUpdateContractCommentOutputSchema: OutputSchema = {
  fields: commentWithAttachmentsFields,
};

export const zohoDeskListTicketConversationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'conversations',
      label: 'Conversations',
      labelKey: 'id',
      listItems: [
        { key: 'sentiment', label: 'Sentiment' },
        {
          key: 'isDescriptionThread',
          label: 'Is Description Thread',
          format: 'boolean',
        },
        { key: 'canReply', label: 'Can Reply', format: 'boolean' },
        { key: 'bcc', label: 'Bcc', format: 'email' },
        { key: 'channel', label: 'Channel' },
        { key: 'aspects', label: 'Aspects' },
        { key: 'source', label: 'Source', children: sourceFields },
        { key: 'type', label: 'Type' },
        {
          key: 'lastRatingIconURL',
          label: 'Last Rating Icon URL',
          format: 'image',
        },
        { key: 'impersonatedUser', label: 'Impersonated User' },
        { key: 'channelRelatedInfo', label: 'Channel Related Info' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        { key: 'contentType', label: 'Content Type' },
        { key: 'direction', label: 'Direction' },
        { key: 'summary', label: 'Summary' },
        { key: 'cc', label: 'Cc', format: 'email' },
        { key: 'keyWords', label: 'Key Words' },
        { key: 'visibility', label: 'Visibility' },
        { key: 'author', label: 'Author', children: authorFields },
        { key: 'isForward', label: 'Is Forward', format: 'boolean' },
        { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
        { key: 'responderId', label: 'Responder ID' },
        { key: 'respondedIn', label: 'Responded In' },
        { key: 'attachmentCount', label: 'Attachment Count' },
        { key: 'readReceipts', label: 'Read Receipts' },
        { key: 'to', label: 'To', format: 'email' },
        {
          key: 'fromEmailAddress',
          label: 'From Email Address',
          format: 'email',
        },
        { key: 'actions', label: 'Actions', listItems: actionFields },
        { key: 'status', label: 'Status' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'attachments', label: 'Attachments' },
        { key: 'encodedContent', label: 'Encoded Content' },
        { key: 'commentedTime', label: 'Commented Time', format: 'datetime' },
        { key: 'isPublic', label: 'Is Public', format: 'boolean' },
        { key: 'content', label: 'Content' },
        { key: 'commenterId', label: 'Commenter ID' },
        { key: 'commenter', label: 'Commenter', children: commenterFields },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCountAccountsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count' }],
};

export const zohoDeskCountAgentsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const zohoDeskCountAgentsByTypeOutputSchema: OutputSchema = {
  fields: [
    { key: 'lightAgents', label: 'Light Agents', format: 'number' },
    {
      key: 'deactivatedZiaAgents',
      label: 'Deactivated Zia Agents',
      format: 'number',
    },
    { key: 'importedAgents', label: 'Imported Agents', format: 'number' },
    { key: 'deactivatedAgents', label: 'Deactivated Agents', format: 'number' },
    { key: 'closedAgents', label: 'Closed Agents', format: 'number' },
    { key: 'allAgents', label: 'All Agents', format: 'number' },
    { key: 'activeAgents', label: 'Active Agents', format: 'number' },
    { key: 'allZiaAgents', label: 'All Zia Agents', format: 'number' },
    { key: 'unconfirmedAgents', label: 'Unconfirmed Agents', format: 'number' },
    { key: 'activeZiaAgents', label: 'Active Zia Agents', format: 'number' },
    { key: 'deletedAgents', label: 'Deleted Agents', format: 'number' },
  ],
};

export const zohoDeskDeleteAccountAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteAccountCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const zohoDeskDeleteAccountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'accountIds', label: 'Account IDs' },
  ],
};

export const zohoDeskDeleteContactAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteContactCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const zohoDeskDeleteCallAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'callId', label: 'Call ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteCallCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'callId', label: 'Call ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const zohoDeskDeleteCallsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'callIds', label: 'Call IDs' },
  ],
};

export const zohoDeskDeleteContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contactIds', label: 'Contact IDs' },
  ],
};

export const zohoDeskDeleteContractCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'contractId', label: 'Contract ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const zohoDeskDeleteEventAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'eventId', label: 'Event ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteEventsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'eventIds', label: 'Event IDs' },
  ],
};

export const zohoDeskDeleteProductAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'productId', label: 'Product ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteProductsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'productIds', label: 'Product IDs' },
  ],
};

export const zohoDeskDeleteTicketAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteTicketCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const zohoDeskDeleteTicketTimeEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'timeEntryId', label: 'Time Entry ID' },
  ],
};

export const zohoDeskDeleteTaskAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'taskId', label: 'Task ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const zohoDeskDeleteTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'taskIds', label: 'Task IDs' },
  ],
};

export const zohoDeskDeleteTicketResolutionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
  ],
};

export const zohoDeskListDepartmentAgentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'agents',
      label: 'Agents',
      labelKey: 'name',
      listItems: [
        { key: 'zuid', label: 'Zuid' },
        { key: 'emailId', label: 'Email ID', format: 'email' },
        { key: 'isConfirmed', label: 'Is Confirmed', format: 'boolean' },
        { key: 'status', label: 'Status' },
        { key: 'roleId', label: 'Role ID' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'aboutInfo', label: 'About Info' },
        { key: 'extn', label: 'Extn' },
        { key: 'countryCode', label: 'Country Code' },
        { key: 'name', label: 'Name' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
        { key: 'rolePermissionType', label: 'Role Permission Type' },
        { key: 'associatedDepartmentIds', label: 'Associated Department IDs' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'id', label: 'ID' },
        { key: 'profileId', label: 'Profile ID' },
        { key: 'channelExpert', label: 'Channel Expert' },
        { key: 'langCode', label: 'Lang Code' },
        {
          key: 'associatedChatDepartmentIds',
          label: 'Associated Chat Department IDs',
        },
        { key: 'isZiaAgent', label: 'Is Zia Agent', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListDepartmentTeamsOutputSchema: OutputSchema = {
  fields: [
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: teamFields },
  ],
};

export const zohoDeskCreateDraftReplyOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments' },
    { key: 'content', label: 'Content' },
    { key: 'id', label: 'ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'canReply', label: 'Can Reply', format: 'boolean' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'replyTo', label: 'Reply To' },
    { key: 'summary', label: 'Summary' },
    { key: 'author', label: 'Author', children: authorFields },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'readReceipts', label: 'Read Receipts' },
    { key: 'impersonatedUser', label: 'Impersonated User' },
    { key: 'source', label: 'Source', children: sourceFields },
    {
      key: 'isDescriptionThread',
      label: 'Is Description Thread',
      format: 'boolean',
    },
    {
      key: 'isContentTruncated',
      label: 'Is Content Truncated',
      format: 'boolean',
    },
    { key: 'fullContentURL', label: 'Full Content URL', format: 'url' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'actions', label: 'Actions', listItems: actionFields },
    { key: 'direction', label: 'Direction' },
    { key: 'cc', label: 'Cc', format: 'email' },
    { key: 'responderId', label: 'Responder ID' },
    { key: 'bcc', label: 'Bcc', format: 'email' },
    { key: 'to', label: 'To', format: 'email' },
    { key: 'fromEmailAddress', label: 'From Email Address', format: 'email' },
    { key: 'isForward', label: 'Is Forward', format: 'boolean' },
  ],
};

export const zohoDeskCreateEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'startTime', label: 'Start Time', format: 'datetime' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
    { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskListFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'displayLabel', label: 'Display Label' },
        { key: 'apiName', label: 'API Name' },
        { key: 'isCustomField', label: 'Is Custom Field', format: 'boolean' },
        {
          key: 'showToHelpCenter',
          label: 'Show To Help Center',
          format: 'boolean',
        },
        { key: 'name', label: 'Name' },
        { key: 'i18NLabel', label: 'I18 NLabel' },
        {
          key: 'isEncryptedField',
          label: 'Is Encrypted Field',
          format: 'boolean',
        },
        { key: 'id', label: 'ID' },
        { key: 'type', label: 'Type' },
        { key: 'maxLength', label: 'Max Length', format: 'number' },
        { key: 'isMandatory', label: 'Is Mandatory', format: 'boolean' },
        {
          key: 'allowedValues',
          label: 'Allowed Values',
          listItems: [
            { key: 'statusType', label: 'Status Type' },
            { key: 'value', label: 'Value' },
          ],
        },
        { key: 'subType', label: 'Sub Type' },
        {
          key: 'lookup',
          label: 'Lookup',
          children: [
            { key: 'onDelete', label: 'On Delete' },
            { key: 'relatedListLabel', label: 'Related List Label' },
            {
              key: 'module',
              label: 'Module',
              children: [
                { key: 'apiName', label: 'API Name' },
                { key: 'nameField', label: 'Name Field' },
                { key: 'id', label: 'ID' },
              ],
            },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'website', label: 'Website', format: 'url' },
    { key: 'fax', label: 'Fax' },
    { key: 'industry', label: 'Industry' },
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' },
    { key: 'phone', label: 'Phone' },
    { key: 'annualrevenue', label: 'Annualrevenue' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'customFields', label: 'Custom Fields' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    { key: 'associatedSLAIds', label: 'Associated SLAIds' },
    { key: 'zohoCRMAccount', label: 'Zoho CRM Account' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
  ],
};

export const zohoDeskGetArticleOutputSchema: OutputSchema = {
  fields: [
    { key: 'likeCount', label: 'Like Count' },
    { key: 'commentCount', label: 'Comment Count' },
    { key: 'templateUsedUsersCount', label: 'Template Used Users Count' },
    {
      key: 'templateLastUpdatedTime',
      label: 'Template Last Updated Time',
      format: 'datetime',
    },
    { key: 'latestVersion', label: 'Latest Version' },
    { key: 'modifierId', label: 'Modifier ID' },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    {
      key: 'isArticleSummaryPresent',
      label: 'Is Article Summary Present',
      format: 'boolean',
    },
    { key: 'latestVersionModifierId', label: 'Latest Version Modifier ID' },
    { key: 'portalUrl', label: 'Portal URL', format: 'url' },
    { key: 'translationSource', label: 'Translation Source' },
    {
      key: 'seo',
      label: 'Seo',
      children: [
        { key: 'keywords', label: 'Keywords' },
        { key: 'isEnabled', label: 'Is Enabled', format: 'boolean' },
        { key: 'description', label: 'Description' },
        { key: 'title', label: 'Title' },
      ],
    },
    { key: 'latestPublishedVersion', label: 'Latest Published Version' },
    { key: 'owner', label: 'Owner', children: agentRefFields },
    { key: 'templateUsageCount', label: 'Template Usage Count' },
    { key: 'myVote', label: 'My Vote' },
    {
      key: 'availableLocaleTranslations',
      label: 'Available Locale Translations',
      listItems: availableLocaleTranslationFields,
    },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'authorId', label: 'Author ID' },
    { key: 'feedbackCount', label: 'Feedback Count' },
    { key: 'translationState', label: 'Translation State' },
    { key: 'viewCount', label: 'View Count' },
    { key: 'usageCount', label: 'Usage Count' },
    { key: 'dislikeCount', label: 'Dislike Count' },
    { key: 'title', label: 'Title' },
    { key: 'permission', label: 'Permission' },
    { key: 'locale', label: 'Locale' },
    { key: 'category', label: 'Category', children: categoryFields },
    { key: 'tags', label: 'Tags' },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'templateUsageCount', label: 'Template Usage Count' },
        { key: 'feedbackCount', label: 'Feedback Count' },
        { key: 'unlikeCount', label: 'Unlike Count' },
        { key: 'dislikeCount', label: 'Dislike Count' },
        { key: 'lastUsageTime', label: 'Last Usage Time', format: 'datetime' },
        { key: 'likeCount', label: 'Like Count' },
        { key: 'viewCount', label: 'View Count' },
        {
          key: 'lastActivityTime',
          label: 'Last Activity Time',
          format: 'datetime',
        },
        { key: 'usageCount', label: 'Usage Count' },
      ],
    },
    { key: 'position', label: 'Position' },
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'answer', label: 'Answer' },
    { key: 'categoryId', label: 'Category ID' },
    { key: 'author', label: 'Author', children: agentRefFields },
    { key: 'isTemplate', label: 'Is Template', format: 'boolean' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'expiryDate', label: 'Expiry Date', format: 'datetime' },
    { key: 'createdBy', label: 'Created By', children: agentRefFields },
    { key: 'modifiedBy', label: 'Modified By', children: agentRefFields },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'currentVersion', label: 'Current Version' },
    { key: 'attachments', label: 'Attachments' },
    { key: 'permalink', label: 'Permalink' },
    { key: 'rootCategoryId', label: 'Root Category ID' },
    { key: 'translationId', label: 'Translation ID' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'latestVersionStatus', label: 'Latest Version Status' },
    {
      key: 'latestVersionModifiedBy',
      label: 'Latest Version Modified By',
      children: agentRefFields,
    },
    { key: 'reviewedBy', label: 'Reviewed By' },
    { key: 'reviewedTime', label: 'Reviewed Time', format: 'datetime' },
    { key: 'sourceLocale', label: 'Source Locale' },
    { key: 'summary', label: 'Summary' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'articleNumber', label: 'Article Number' },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'isLocked', label: 'Is Locked', format: 'boolean' },
  ],
};

export const zohoDeskGetDepartmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'nameInCustomerPortal', label: 'Name In Customer Portal' },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'chatStatus', label: 'Chat Status' },
    { key: 'associatedAgentIds', label: 'Associated Agent IDs' },
    { key: 'isEnabled', label: 'Is Enabled', format: 'boolean' },
    { key: 'isDefault', label: 'Is Default', format: 'boolean' },
    {
      key: 'isAssignToTeamEnabled',
      label: 'Is Assign To Team Enabled',
      format: 'boolean',
    },
    {
      key: 'isVisibleInCustomerPortal',
      label: 'Is Visible In Customer Portal',
      format: 'boolean',
    },
    { key: 'hasLogo', label: 'Has Logo', format: 'boolean' },
    { key: 'sanitizedName', label: 'Sanitized Name' },
  ],
};

export const zohoDeskGetOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'country', label: 'Country' },
    { key: 'migrationFrom', label: 'Migration From' },
    { key: 'city', label: 'City' },
    {
      key: 'preferredCommunicationChannels',
      label: 'Preferred Communication Channels',
    },
    { key: 'companyName', label: 'Company Name' },
    { key: 'description', label: 'Description' },
    { key: 'edition', label: 'Edition' },
    { key: 'industry', label: 'Industry' },
    { key: 'preferredSolution', label: 'Preferred Solution' },
    { key: 'employeeCount', label: 'Employee Count', format: 'number' },
    { key: 'isAdminInOrg', label: 'Is Admin In Org', format: 'boolean' },
    { key: 'faviconURL', label: 'Favicon URL', format: 'url' },
    { key: 'portalName', label: 'Portal Name' },
    { key: 'street', label: 'Street' },
    { key: 'currencyLocale', label: 'Currency Locale' },
    { key: 'alias', label: 'Alias' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'state', label: 'State' },
    {
      key: 'isPayloadEncryptionEnabled',
      label: 'Is Payload Encryption Enabled',
      format: 'boolean',
    },
    { key: 'fax', label: 'Fax' },
    { key: 'zip', label: 'Zip' },
    { key: 'website', label: 'Website' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'currencySymbol', label: 'Currency Symbol' },
    { key: 'logoURL', label: 'Logo URL', format: 'image' },
    { key: 'customDomain', label: 'Custom Domain' },
    { key: 'employeeCountRange', label: 'Employee Count Range' },
    { key: 'isDefault', label: 'Is Default', format: 'boolean' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'portalURL', label: 'Portal URL', format: 'url' },
    { key: 'primaryContact', label: 'Primary Contact', format: 'email' },
    { key: 'designation', label: 'Designation' },
    { key: 'currencyCode', label: 'Currency Code' },
    { key: 'isSandboxPortal', label: 'Is Sandbox Portal', format: 'boolean' },
  ],
};

export const zohoDeskGetProductOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'departmentIds', label: 'Department IDs' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'productName', label: 'Product Name' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'description', label: 'Description' },
    { key: 'productCode', label: 'Product Code' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'productCategory', label: 'Product Category' },
    { key: 'unitPrice', label: 'Unit Price', format: 'number' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'modifiedBy', label: 'Modified By' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
  ],
};

export const zohoDeskGetTicketResolutionOutputSchema: OutputSchema = {
  fields: historyFields,
};

export const zohoDeskGetRoleOutputSchema: OutputSchema = { fields: roleFields };

export const zohoDeskGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
    { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskGetTeamOutputSchema: OutputSchema = { fields: teamFields };

export const zohoDeskGetTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'subCategory', label: 'Sub Category' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'subject', label: 'Subject' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
    { key: 'language', label: 'Language' },
    { key: 'source', label: 'Source', children: threadSourceFields },
    { key: 'resolution', label: 'Resolution' },
    { key: 'sharedDepartments', label: 'Shared Departments' },
    { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
    { key: 'approvalCount', label: 'Approval Count' },
    { key: 'isOverDue', label: 'Is Over Due', format: 'boolean' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    {
      key: 'contact',
      label: 'Contact',
      children: [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'id', label: 'ID' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'type', label: 'Type' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'account', label: 'Account', children: accountSummaryFields },
      ],
    },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'id', label: 'ID' },
    {
      key: 'isResponseOverdue',
      label: 'Is Response Overdue',
      format: 'boolean',
    },
    {
      key: 'customerResponseTime',
      label: 'Customer Response Time',
      format: 'datetime',
    },
    { key: 'productId', label: 'Product ID' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'threadCount', label: 'Thread Count' },
    { key: 'secondaryContacts', label: 'Secondary Contacts' },
    { key: 'priority', label: 'Priority' },
    { key: 'classification', label: 'Classification' },
    { key: 'commentCount', label: 'Comment Count' },
    { key: 'taskCount', label: 'Task Count' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'phone', label: 'Phone' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'assignee', label: 'Assignee', children: followerFields },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'entitySkills', label: 'Entity Skills' },
    { key: 'ticketNumber', label: 'Ticket Number' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
    { key: 'skillsInfo', label: 'Skills Info' },
    { key: 'isRead', label: 'Is Read', format: 'boolean' },
    { key: 'description', label: 'Description' },
    { key: 'timeEntryCount', label: 'Time Entry Count' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'responseDueDate', label: 'Response Due Date', format: 'datetime' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'modifiedBy', label: 'Modified By' },
    {
      key: 'department',
      label: 'Department',
      children: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
      ],
    },
    { key: 'followerCount', label: 'Follower Count' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'channelCode', label: 'Channel Code' },
    {
      key: 'product',
      label: 'Product',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'productName', label: 'Product Name' },
      ],
    },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'slaId', label: 'Sla ID' },
    { key: 'team', label: 'Team' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'assigneeId', label: 'Assignee ID' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'teamId', label: 'Team ID' },
    { key: 'contractId', label: 'Contract ID' },
    { key: 'tagCount', label: 'Tag Count' },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'isEscalated', label: 'Is Escalated', format: 'boolean' },
    { key: 'category', label: 'Category' },
  ],
};

export const zohoDeskListHelpCenterGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'creator', label: 'Creator', children: creatorFields },
        { key: 'modifier', label: 'Modifier', children: creatorFields },
        { key: 'logoUrl', label: 'Logo URL', format: 'image' },
        { key: 'helpCenterId', label: 'Help Center ID' },
        { key: 'isAssociated', label: 'Is Associated', format: 'boolean' },
        { key: 'count', label: 'Count' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status' },
        { key: 'id', label: 'ID' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListHelpCentersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'helpCenters',
      label: 'Help Centers',
      labelKey: 'name',
      listItems: [
        {
          key: 'isMultilingualEnabled',
          label: 'Is Multilingual Enabled',
          format: 'boolean',
        },
        { key: 'id', label: 'ID' },
        { key: 'logoUrl', label: 'Logo URL', format: 'image' },
        { key: 'departmentIds', label: 'Department IDs' },
        { key: 'name', label: 'Name' },
        {
          key: 'isEncodedPermalinkAllowed',
          label: 'Is Encoded Permalink Allowed',
          format: 'boolean',
        },
        { key: 'url', label: 'URL', format: 'url' },
        {
          key: 'helpCenterLocales',
          label: 'Help Center Locales',
          labelKey: 'name',
          listItems: [
            { key: 'locale', label: 'Locale' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'locales', label: 'Locales' },
        { key: 'primaryLocale', label: 'Primary Locale' },
        { key: 'status', label: 'Status' },
        { key: 'isDefault', label: 'Is Default', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'subCategory', label: 'Sub Category' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'subject', label: 'Subject' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
    { key: 'language', label: 'Language' },
    { key: 'source', label: 'Source', children: threadSourceFields },
    { key: 'resolution', label: 'Resolution' },
    { key: 'sharedDepartments', label: 'Shared Departments' },
    { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
    { key: 'approvalCount', label: 'Approval Count' },
    { key: 'isOverDue', label: 'Is Over Due', format: 'boolean' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'id', label: 'ID' },
    {
      key: 'isResponseOverdue',
      label: 'Is Response Overdue',
      format: 'boolean',
    },
    {
      key: 'customerResponseTime',
      label: 'Customer Response Time',
      format: 'datetime',
    },
    { key: 'productId', label: 'Product ID' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'threadCount', label: 'Thread Count' },
    { key: 'secondaryContacts', label: 'Secondary Contacts' },
    { key: 'priority', label: 'Priority' },
    { key: 'classification', label: 'Classification' },
    { key: 'commentCount', label: 'Comment Count' },
    { key: 'taskCount', label: 'Task Count' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'phone', label: 'Phone' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'entitySkills', label: 'Entity Skills' },
    { key: 'ticketNumber', label: 'Ticket Number' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
    { key: 'description', label: 'Description' },
    { key: 'timeEntryCount', label: 'Time Entry Count' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'responseDueDate', label: 'Response Due Date', format: 'datetime' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'modifiedBy', label: 'Modified By' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'channelCode', label: 'Channel Code' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'slaId', label: 'Sla ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'assigneeId', label: 'Assignee ID' },
    { key: 'teamId', label: 'Team ID' },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'isEscalated', label: 'Is Escalated', format: 'boolean' },
    { key: 'category', label: 'Category' },
  ],
};

export const findContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      labelKey: 'title',
      listItems: [
        { key: 'lastName', label: 'Last Name' },
        { key: 'country', label: 'Country' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'secondaryEmail', label: 'Secondary Email', format: 'email' },
        { key: 'city', label: 'City' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'description', label: 'Description' },
        { key: 'language', label: 'Language' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
        { key: 'twitter', label: 'Twitter' },
        { key: 'street', label: 'Street' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
        { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
        { key: 'id', label: 'ID' },
        { key: 'state', label: 'State' },
        {
          key: 'customerHappiness',
          label: 'Customer Happiness',
          children: customerHappinessFields,
        },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'zip', label: 'Zip' },
        { key: 'owner', label: 'Owner', children: agentContactFields },
        { key: 'accountCount', label: 'Account Count' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'facebook', label: 'Facebook' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'firstName', label: 'First Name' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
        { key: 'phone', label: 'Phone' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'account', label: 'Account', children: accountSummaryFields },
      ],
    },
  ],
};

export const listTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'category', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'subCategory', label: 'Sub Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'channel', label: 'Channel' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        {
          key: 'responseDueDate',
          label: 'Response Due Date',
          format: 'datetime',
        },
        { key: 'commentCount', label: 'Comment Count' },
        { key: 'sentiment', label: 'Sentiment' },
        { key: 'threadCount', label: 'Thread Count' },
        { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
        { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'productId', label: 'Product ID' },
        { key: 'assigneeId', label: 'Assignee ID' },
        { key: 'teamId', label: 'Team ID' },
        { key: 'relationshipType', label: 'Relationship Type' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        { key: 'assignee', label: 'Assignee', children: followerFields },
        { key: 'channelCode', label: 'Channel Code' },
        { key: 'lastThread', label: 'Last Thread', children: lastThreadFields },
        {
          key: 'customerResponseTime',
          label: 'Customer Response Time',
          format: 'datetime',
        },
        { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
        { key: 'source', label: 'Source', children: sourceFields },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
      ],
    },
  ],
};

export const zohoDeskListLabelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      labelKey: 'name',
      listItems: [
        { key: 'creator', label: 'Creator', children: creatorFields },
        { key: 'modifier', label: 'Modifier', children: creatorFields },
        {
          key: 'preferences',
          label: 'Preferences',
          children: [
            { key: 'textColor', label: 'Text Color' },
            { key: 'bgColor', label: 'Bg Color' },
            { key: 'shape', label: 'Shape' },
          ],
        },
        { key: 'id', label: 'ID' },
        { key: 'helpCenterId', label: 'Help Center ID' },
        { key: 'count', label: 'Count' },
        { key: 'name', label: 'Name' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'logoUrl', label: 'Logo URL', format: 'image' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskLinkArticlesToTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'articleIds', label: 'Article IDs' },
  ],
};

export const zohoDeskListAccountsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'accounts',
      label: 'Accounts',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'accountName', label: 'Account Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'website', label: 'Website', format: 'url' },
        { key: 'phone', label: 'Phone' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'zohoCRMAccount', label: 'Zoho CRM Account' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        {
          key: 'customerHappiness',
          label: 'Customer Happiness',
          children: customerHappinessFields,
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListAgentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'agents',
      label: 'Agents',
      labelKey: 'name',
      listItems: agentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListArticlesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'articles',
      label: 'Articles',
      labelKey: 'title',
      listItems: [
        { key: 'likeCount', label: 'Like Count' },
        { key: 'commentCount', label: 'Comment Count' },
        { key: 'templateUsedUsersCount', label: 'Template Used Users Count' },
        {
          key: 'templateLastUpdatedTime',
          label: 'Template Last Updated Time',
          format: 'datetime',
        },
        { key: 'permission', label: 'Permission' },
        { key: 'latestVersion', label: 'Latest Version' },
        { key: 'title', label: 'Title' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'authorId', label: 'Author ID' },
        { key: 'modifierId', label: 'Modifier ID' },
        { key: 'feedbackCount', label: 'Feedback Count' },
        { key: 'translationState', label: 'Translation State' },
        { key: 'viewCount', label: 'View Count' },
        { key: 'usageCount', label: 'Usage Count' },
        { key: 'dislikeCount', label: 'Dislike Count' },
        { key: 'portalUrl', label: 'Portal URL', format: 'url' },
        { key: 'latestVersionModifierId', label: 'Latest Version Modifier ID' },
        { key: 'translationSource', label: 'Translation Source' },
        { key: 'latestPublishedVersion', label: 'Latest Published Version' },
        { key: 'owner', label: 'Owner', children: agentRefFields },
        { key: 'templateUsageCount', label: 'Template Usage Count' },
        {
          key: 'availableLocaleTranslations',
          label: 'Available Locale Translations',
          listItems: availableLocaleTranslationFields,
        },
        { key: 'locale', label: 'Locale' },
        { key: 'category', label: 'Category', children: categoryFields },
        { key: 'position', label: 'Position' },
        { key: 'id', label: 'ID' },
        { key: 'status', label: 'Status' },
        { key: 'categoryId', label: 'Category ID' },
        { key: 'author', label: 'Author', children: agentRefFields },
        { key: 'isTemplate', label: 'Is Template', format: 'boolean' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdBy', label: 'Created By', children: agentRefFields },
        { key: 'modifiedBy', label: 'Modified By', children: agentRefFields },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'expiryDate', label: 'Expiry Date', format: 'datetime' },
        { key: 'permalink', label: 'Permalink' },
        { key: 'rootCategoryId', label: 'Root Category ID' },
        { key: 'translationId', label: 'Translation ID' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'latestVersionStatus', label: 'Latest Version Status' },
        {
          key: 'latestVersionModifiedBy',
          label: 'Latest Version Modified By',
          children: agentRefFields,
        },
        { key: 'sourceLocale', label: 'Source Locale' },
        { key: 'summary', label: 'Summary' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'articleNumber', label: 'Article Number' },
        { key: 'attachmentCount', label: 'Attachment Count' },
        { key: 'isLocked', label: 'Is Locked', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListCallsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'calls',
      label: 'Calls',
      labelKey: 'subject',
      listItems: callFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListContractsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contracts',
      label: 'Contracts',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        {
          key: 'supportPlan',
          label: 'Support Plan',
          children: supportPlanFields,
        },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'associatedSupportPlanId', label: 'Associated Support Plan ID' },
        { key: 'contractName', label: 'Contract Name' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'productId', label: 'Product ID' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'startDate', label: 'Start Date', format: 'date' },
        { key: 'endDate', label: 'End Date', format: 'date' },
        { key: 'contractStatus', label: 'Contract Status' },
        { key: 'associatedSLAId', label: 'Associated SLAId' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListDepartmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'departments',
      label: 'Departments',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'nameInCustomerPortal', label: 'Name In Customer Portal' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'chatStatus', label: 'Chat Status' },
        { key: 'isEnabled', label: 'Is Enabled', format: 'boolean' },
        { key: 'isDefault', label: 'Is Default', format: 'boolean' },
        {
          key: 'isVisibleInCustomerPortal',
          label: 'Is Visible In Customer Portal',
          format: 'boolean',
        },
        { key: 'hasLogo', label: 'Has Logo', format: 'boolean' },
        { key: 'sanitizedName', label: 'Sanitized Name' },
        {
          key: 'isAssignToTeamEnabled',
          label: 'Is Assign To Team Enabled',
          format: 'boolean',
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'priority', label: 'Priority' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketFollowersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'followers',
      label: 'Followers',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'following', label: 'Following' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListOrganizationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'id',
      listItems: [
        { key: 'country', label: 'Country' },
        { key: 'migrationFrom', label: 'Migration From' },
        { key: 'city', label: 'City' },
        {
          key: 'preferredCommunicationChannels',
          label: 'Preferred Communication Channels',
        },
        { key: 'companyName', label: 'Company Name' },
        { key: 'description', label: 'Description' },
        { key: 'edition', label: 'Edition' },
        { key: 'industry', label: 'Industry' },
        { key: 'preferredSolution', label: 'Preferred Solution' },
        { key: 'employeeCount', label: 'Employee Count', format: 'number' },
        { key: 'isAdminInOrg', label: 'Is Admin In Org', format: 'boolean' },
        { key: 'faviconURL', label: 'Favicon URL', format: 'url' },
        { key: 'portalName', label: 'Portal Name' },
        { key: 'street', label: 'Street' },
        { key: 'currencyLocale', label: 'Currency Locale' },
        { key: 'alias', label: 'Alias' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'state', label: 'State' },
        {
          key: 'isPayloadEncryptionEnabled',
          label: 'Is Payload Encryption Enabled',
          format: 'boolean',
        },
        { key: 'fax', label: 'Fax' },
        { key: 'zip', label: 'Zip' },
        { key: 'website', label: 'Website' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'currencySymbol', label: 'Currency Symbol' },
        { key: 'logoURL', label: 'Logo URL', format: 'image' },
        { key: 'employeeCountRange', label: 'Employee Count Range' },
        { key: 'isDefault', label: 'Is Default', format: 'boolean' },
        { key: 'phoneNumber', label: 'Phone Number' },
        { key: 'portalURL', label: 'Portal URL', format: 'url' },
        { key: 'primaryContact', label: 'Primary Contact', format: 'email' },
        { key: 'designation', label: 'Designation' },
        { key: 'currencyCode', label: 'Currency Code' },
        {
          key: 'isSandboxPortal',
          label: 'Is Sandbox Portal',
          format: 'boolean',
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
  ],
};

export const zohoDeskListTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'priority', label: 'Priority' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tickets',
      label: 'Tickets',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'category', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'subCategory', label: 'Sub Category' },
        { key: 'priority', label: 'Priority' },
        { key: 'channel', label: 'Channel' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        {
          key: 'responseDueDate',
          label: 'Response Due Date',
          format: 'datetime',
        },
        { key: 'commentCount', label: 'Comment Count' },
        { key: 'sentiment', label: 'Sentiment' },
        { key: 'threadCount', label: 'Thread Count' },
        { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
        { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'productId', label: 'Product ID' },
        { key: 'assigneeId', label: 'Assignee ID' },
        { key: 'teamId', label: 'Team ID' },
        { key: 'relationshipType', label: 'Relationship Type' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'channelCode', label: 'Channel Code' },
        { key: 'lastThread', label: 'Last Thread' },
        {
          key: 'customerResponseTime',
          label: 'Customer Response Time',
          format: 'datetime',
        },
        { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
        { key: 'source', label: 'Source', children: sourceFields },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        { key: 'assignee', label: 'Assignee', children: followerFields },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskMergeContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'accountCount', label: 'Account Count' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'secondaryEmail', label: 'Secondary Email', format: 'email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'state', label: 'State' },
    { key: 'street', label: 'Street' },
    { key: 'zip', label: 'Zip' },
    { key: 'description', label: 'Description' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'language', label: 'Language' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'isFollowing', label: 'Is Following', format: 'boolean' },
    { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
    { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'photoURL', label: 'Photo URL', format: 'image' },
    {
      key: 'customerHappiness',
      label: 'Customer Happiness',
      children: customerHappinessFields,
    },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskMoveTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'departmentId', label: 'Department ID' },
  ],
};

export const zohoDeskListProductContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'email',
      listItems: contactFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListProductTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tickets',
      label: 'Tickets',
      labelKey: 'subject',
      listItems: ticketFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateTicketPinOutputSchema: OutputSchema = {
  fields: pinFields,
};

export const zohoDeskListTicketPinsOutputSchema: OutputSchema = {
  fields: [
    { key: 'pins', label: 'Pins', labelKey: 'id', listItems: pinFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskRemoveTicketTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'tags', label: 'Tags' },
  ],
};

export const zohoDeskSendTicketReplyOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments' },
    { key: 'content', label: 'Content' },
    { key: 'id', label: 'ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'canReply', label: 'Can Reply', format: 'boolean' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'replyTo', label: 'Reply To' },
    { key: 'summary', label: 'Summary' },
    { key: 'author', label: 'Author', children: authorFields },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'respondedIn', label: 'Responded In' },
    { key: 'readReceipts', label: 'Read Receipts' },
    { key: 'impersonatedUser', label: 'Impersonated User' },
    { key: 'source', label: 'Source', children: sourceFields },
    {
      key: 'isDescriptionThread',
      label: 'Is Description Thread',
      format: 'boolean',
    },
    {
      key: 'isContentTruncated',
      label: 'Is Content Truncated',
      format: 'boolean',
    },
    { key: 'fullContentURL', label: 'Full Content URL', format: 'url' },
    { key: 'actions', label: 'Actions' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'direction', label: 'Direction' },
    { key: 'cc', label: 'Cc', format: 'email' },
    { key: 'responderId', label: 'Responder ID' },
    { key: 'bcc', label: 'Bcc', format: 'email' },
    { key: 'to', label: 'To', format: 'email' },
    { key: 'fromEmailAddress', label: 'From Email Address', format: 'email' },
    { key: 'isForward', label: 'Is Forward', format: 'boolean' },
  ],
};

export const zohoDeskListReplyAddressesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'addresses',
      label: 'Addresses',
      labelKey: 'displayName',
      listItems: [
        { key: 'departmentId', label: 'Department ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'serviceProviderType', label: 'Service Provider Type' },
        { key: 'issues', label: 'Issues' },
        { key: 'smtpDetails', label: 'Smtp Details' },
        {
          key: 'isDepartmentDefault',
          label: 'Is Department Default',
          format: 'boolean',
        },
        { key: 'id', label: 'ID' },
        { key: 'isActive', label: 'Is Active', format: 'boolean' },
        { key: 'createdBy', label: 'Created By', children: followerFields },
        { key: 'modifiedBy', label: 'Modified By' },
        { key: 'address', label: 'Address', format: 'email' },
        { key: 'isVerified', label: 'Is Verified', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketResolutionHistoryOutputSchema: OutputSchema = {
  fields: [
    { key: 'history', label: 'History', listItems: historyFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListRolesOutputSchema: OutputSchema = {
  fields: [
    { key: 'roles', label: 'Roles', labelKey: 'name', listItems: roleFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchAccountsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'accounts',
      label: 'Accounts',
      labelKey: 'id',
      listItems: [
        { key: 'owner', label: 'Owner', children: agentContactFields },
        { key: 'country', label: 'Country' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'website', label: 'Website' },
        { key: 'code', label: 'Code' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'accountName', label: 'Account Name' },
        { key: 'city', label: 'City' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'description', label: 'Description' },
        { key: 'industry', label: 'Industry' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'street', label: 'Street' },
        { key: 'annualrevenue', label: 'Annualrevenue' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        { key: 'state', label: 'State' },
        { key: 'fax', label: 'Fax' },
        { key: 'email', label: 'Email' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchActivitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activities',
      label: 'Activities',
      labelKey: 'subject',
      listItems: [
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'description', label: 'Description' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'contact', label: 'Contact', children: ticketContactFields },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        {
          key: 'modifiedBy',
          label: 'Modified By',
          children: agentContactFields,
        },
        { key: 'id', label: 'ID' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'reminder', label: 'Reminder' },
        { key: 'ticket', label: 'Ticket', children: ticketListItemFields },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'module', label: 'Module' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'assignee', label: 'Assignee', children: agentContactFields },
        { key: 'category', label: 'Category' },
        { key: 'activityType', label: 'Activity Type' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
        { key: 'direction', label: 'Direction' },
        { key: 'callId', label: 'Call ID' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'owner', label: 'Owner', children: agentContactFields },
        { key: 'country', label: 'Country' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'website', label: 'Website', format: 'url' },
        { key: 'code', label: 'Code' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'accountName', label: 'Account Name' },
        { key: 'city', label: 'City' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'module', label: 'Module' },
        { key: 'description', label: 'Description' },
        { key: 'industry', label: 'Industry' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'street', label: 'Street' },
        { key: 'annualrevenue', label: 'Annualrevenue' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        { key: 'state', label: 'State' },
        { key: 'fax', label: 'Fax' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'subCategory', label: 'Sub Category' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'subject', label: 'Subject' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'channel', label: 'Channel' },
        { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
        { key: 'language', label: 'Language' },
        { key: 'resolution', label: 'Resolution' },
        { key: 'sharedDepartments', label: 'Shared Departments' },
        { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
        { key: 'isOverDue', label: 'Is Over Due', format: 'boolean' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        {
          key: 'customerResponseTime',
          label: 'Customer Response Time',
          format: 'datetime',
        },
        { key: 'parentTicket', label: 'Parent Ticket' },
        { key: 'productId', label: 'Product ID' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'threadCount', label: 'Thread Count' },
        { key: 'secondaryContacts', label: 'Secondary Contacts' },
        { key: 'priority', label: 'Priority' },
        { key: 'classification', label: 'Classification' },
        { key: 'commentCount', label: 'Comment Count' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'assignee', label: 'Assignee', children: agentContactFields },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'childTicketCount', label: 'Child Ticket Count' },
        { key: 'status', label: 'Status' },
        { key: 'entitySkills', label: 'Entity Skills' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
        { key: 'isRead', label: 'Is Read', format: 'boolean' },
        {
          key: 'responseDueDate',
          label: 'Response Due Date',
          format: 'datetime',
        },
        { key: 'modifiedBy', label: 'Modified By' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
        {
          key: 'product',
          label: 'Product',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'productName', label: 'Product Name' },
          ],
        },
        { key: 'slaId', label: 'Sla ID' },
        { key: 'relationshipType', label: 'Relationship Type' },
        { key: 'lastThread', label: 'Last Thread', children: lastThreadFields },
        { key: 'team', label: 'Team' },
        { key: 'assigneeId', label: 'Assignee ID' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'teamId', label: 'Team ID' },
        { key: 'isEscalated', label: 'Is Escalated', format: 'boolean' },
        { key: 'category', label: 'Category' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'secondaryEmail', label: 'Secondary Email' },
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
        { key: 'twitter', label: 'Twitter' },
        { key: 'isEndUser', label: 'Is End User', format: 'boolean' },
        { key: 'zohoCRMContact', label: 'Zoho CRM Contact' },
        {
          key: 'customerHappiness',
          label: 'Customer Happiness',
          children: customerHappinessFields,
        },
        { key: 'zip', label: 'Zip' },
        { key: 'accountCount', label: 'Account Count' },
        { key: 'facebook', label: 'Facebook' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'firstName', label: 'First Name' },
        { key: 'isAnonymous', label: 'Is Anonymous', format: 'boolean' },
        { key: 'account', label: 'Account' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchArticlesOutputSchema: OutputSchema = {
  fields: [
    { key: 'articles', label: 'Articles' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchCallsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'calls',
      label: 'Calls',
      labelKey: 'subject',
      listItems: [
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'description', label: 'Description' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'contact', label: 'Contact', children: ticketContactFields },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        {
          key: 'modifiedBy',
          label: 'Modified By',
          children: agentContactFields,
        },
        { key: 'id', label: 'ID' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
        { key: 'direction', label: 'Direction' },
        { key: 'callId', label: 'Call ID' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'reminder', label: 'Reminder' },
        { key: 'ticket', label: 'Ticket', children: ticketListItemFields },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'assignee', label: 'Assignee', children: agentContactFields },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'activityType', label: 'Activity Type' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'contacts', label: 'Contacts' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'subject',
      listItems: [
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'description', label: 'Description' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'contact', label: 'Contact', children: ticketContactFields },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        {
          key: 'modifiedBy',
          label: 'Modified By',
          children: agentContactFields,
        },
        { key: 'id', label: 'ID' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'reminder', label: 'Reminder' },
        { key: 'ticket', label: 'Ticket' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'assignee', label: 'Assignee', children: agentContactFields },
        { key: 'category', label: 'Category' },
        { key: 'activityType', label: 'Activity Type' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchProductsOutputSchema: OutputSchema = {
  fields: [
    { key: 'products', label: 'Products' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'tasks', label: 'Tasks' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskSearchTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tickets',
      label: 'Tickets',
      labelKey: 'subject',
      listItems: [
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'subCategory', label: 'Sub Category' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'subject', label: 'Subject' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'channel', label: 'Channel' },
        { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
        { key: 'language', label: 'Language' },
        { key: 'resolution', label: 'Resolution' },
        { key: 'sharedDepartments', label: 'Shared Departments' },
        { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
        { key: 'isOverDue', label: 'Is Over Due', format: 'boolean' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        {
          key: 'customerResponseTime',
          label: 'Customer Response Time',
          format: 'datetime',
        },
        { key: 'parentTicket', label: 'Parent Ticket' },
        { key: 'productId', label: 'Product ID' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'threadCount', label: 'Thread Count' },
        { key: 'secondaryContacts', label: 'Secondary Contacts' },
        { key: 'priority', label: 'Priority' },
        { key: 'classification', label: 'Classification' },
        { key: 'commentCount', label: 'Comment Count' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'assignee', label: 'Assignee', children: agentContactFields },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'childTicketCount', label: 'Child Ticket Count' },
        { key: 'status', label: 'Status' },
        { key: 'entitySkills', label: 'Entity Skills' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
        { key: 'isRead', label: 'Is Read', format: 'boolean' },
        { key: 'description', label: 'Description' },
        {
          key: 'responseDueDate',
          label: 'Response Due Date',
          format: 'datetime',
        },
        { key: 'modifiedBy', label: 'Modified By' },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'product', label: 'Product' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'slaId', label: 'Sla ID' },
        { key: 'relationshipType', label: 'Relationship Type' },
        { key: 'lastThread', label: 'Last Thread' },
        { key: 'team', label: 'Team' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'assigneeId', label: 'Assignee ID' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'teamId', label: 'Team ID' },
        { key: 'isEscalated', label: 'Is Escalated', format: 'boolean' },
        { key: 'category', label: 'Category' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListSupportPlansOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'supportPlans',
      label: 'Support Plans',
      labelKey: 'name',
      listItems: [
        { key: 'creditDetails', label: 'Credit Details' },
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'supportType', label: 'Support Type' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        {
          key: 'sla',
          label: 'Sla',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
            { key: 'status', label: 'Status' },
          ],
        },
        { key: 'createdBy', label: 'Created By', children: ownerFields },
        { key: 'modifiedBy', label: 'Modified By', children: ownerFields },
        {
          key: 'department',
          label: 'Department',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'id', label: 'ID' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketActiveTimersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timers',
      label: 'Timers',
      listItems: [
        { key: 'timer', label: 'Timer', children: timerFields },
        { key: 'userId', label: 'User ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskUploadTicketAttachmentOutputSchema: OutputSchema = {
  fields: ticketAttachmentFields,
};

export const zohoDeskListTicketAttachmentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'name',
      listItems: ticketAttachmentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskCreateTicketCommentOutputSchema: OutputSchema = {
  fields: entityPinnedFields,
};

export const zohoDeskGetTicketCommentHistoryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'history',
      label: 'History',
      listItems: [
        { key: 'attachments', label: 'Attachments' },
        { key: 'commentedTime', label: 'Commented Time', format: 'datetime' },
        { key: 'isPublic', label: 'Is Public', format: 'boolean' },
        { key: 'contentType', label: 'Content Type' },
        { key: 'commenterId', label: 'Commenter ID' },
        { key: 'content', label: 'Content' },
        { key: 'commenter', label: 'Commenter', children: commenterFields },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      listItems: entityPinnedFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetTicketTimerOutputSchema: OutputSchema = {
  fields: timerFields,
};

export const zohoDeskListTicketTimeEntriesByBillingTypeOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'timeEntries', label: 'Time Entries' },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  };

export const zohoDeskAddTaskTimeEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'parent', label: 'Parent', children: linkedParentFields },
    { key: 'executedTime', label: 'Executed Time', format: 'datetime' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'agentCostPerHour', label: 'Agent Cost Per Hour', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'mode', label: 'Mode' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'requestId', label: 'Request ID' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'id', label: 'ID' },
    { key: 'requestChargeType', label: 'Request Charge Type' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'secondsSpent', label: 'Seconds Spent', format: 'number' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'fixedCost', label: 'Fixed Cost', format: 'number' },
    { key: 'minutesSpent', label: 'Minutes Spent', format: 'number' },
    { key: 'hoursSpent', label: 'Hours Spent', format: 'number' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'isBillable', label: 'Is Billable', format: 'boolean' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'invoiceId', label: 'Invoice ID' },
    { key: 'additionalCost', label: 'Additional Cost', format: 'number' },
    { key: 'totalCost', label: 'Total Cost', format: 'number' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const zohoDeskListTaskTimeEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timeEntries',
      label: 'Time Entries',
      labelKey: 'id',
      listItems: [
        { key: 'parent', label: 'Parent', children: linkedParentFields },
        { key: 'executedTime', label: 'Executed Time', format: 'datetime' },
        { key: 'customFields', label: 'Custom Fields' },
        { key: 'departmentId', label: 'Department ID' },
        {
          key: 'agentCostPerHour',
          label: 'Agent Cost Per Hour',
          format: 'number',
        },
        { key: 'description', label: 'Description' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'mode', label: 'Mode' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'billingType', label: 'Billing Type' },
        { key: 'requestId', label: 'Request ID' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'id', label: 'ID' },
        { key: 'requestChargeType', label: 'Request Charge Type' },
        {
          key: 'layoutDetails',
          label: 'Layout Details',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'layoutName', label: 'Layout Name' },
          ],
        },
        { key: 'secondsSpent', label: 'Seconds Spent', format: 'number' },
        { key: 'cf', label: 'Custom Fields (API Names)' },
        { key: 'fixedCost', label: 'Fixed Cost', format: 'number' },
        { key: 'minutesSpent', label: 'Minutes Spent', format: 'number' },
        { key: 'hoursSpent', label: 'Hours Spent', format: 'number' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'isBillable', label: 'Is Billable', format: 'boolean' },
        { key: 'createdBy', label: 'Created By' },
        { key: 'invoiceId', label: 'Invoice ID' },
        { key: 'additionalCost', label: 'Additional Cost', format: 'number' },
        { key: 'totalCost', label: 'Total Cost', format: 'number' },
        { key: 'taskId', label: 'Task ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTeamMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      labelKey: 'id',
      listItems: [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'photoURL', label: 'Photo URL', format: 'image' },
        { key: 'roleId', label: 'Role ID' },
        { key: 'profileId', label: 'Profile ID' },
        { key: 'emailId', label: 'Email ID', format: 'email' },
        { key: 'id', label: 'ID' },
        { key: 'zuid', label: 'Zuid' },
      ],
    },
  ],
};

export const zohoDeskGetTicketThreadOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments' },
    { key: 'content', label: 'Content' },
    { key: 'id', label: 'ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'canReply', label: 'Can Reply', format: 'boolean' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'replyTo', label: 'Reply To', format: 'email' },
    { key: 'summary', label: 'Summary' },
    { key: 'author', label: 'Author', children: authorFields },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'aspects', label: 'Aspects' },
    { key: 'plainText', label: 'Plain Text' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'readReceipts', label: 'Read Receipts' },
    { key: 'impersonatedUser', label: 'Impersonated User' },
    { key: 'source', label: 'Source', children: sourceFields },
    {
      key: 'isDescriptionThread',
      label: 'Is Description Thread',
      format: 'boolean',
    },
    {
      key: 'isContentTruncated',
      label: 'Is Content Truncated',
      format: 'boolean',
    },
    { key: 'keyWords', label: 'Key Words' },
    { key: 'fullContentURL', label: 'Full Content URL', format: 'url' },
    { key: 'actions', label: 'Actions' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'direction', label: 'Direction' },
    { key: 'cc', label: 'Cc', format: 'email' },
    { key: 'responderId', label: 'Responder ID' },
    { key: 'bcc', label: 'Bcc', format: 'email' },
    { key: 'to', label: 'To', format: 'email' },
    { key: 'fromEmailAddress', label: 'From Email Address', format: 'email' },
    { key: 'isForward', label: 'Is Forward', format: 'boolean' },
  ],
};

export const zohoDeskGetLatestTicketThreadOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments' },
    { key: 'content', label: 'Content' },
    { key: 'id', label: 'ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'canReply', label: 'Can Reply', format: 'boolean' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'replyTo', label: 'Reply To', format: 'email' },
    { key: 'summary', label: 'Summary' },
    { key: 'author', label: 'Author', children: authorFields },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'aspects', label: 'Aspects' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'readReceipts', label: 'Read Receipts' },
    { key: 'impersonatedUser', label: 'Impersonated User' },
    { key: 'source', label: 'Source', children: sourceFields },
    {
      key: 'isDescriptionThread',
      label: 'Is Description Thread',
      format: 'boolean',
    },
    {
      key: 'isContentTruncated',
      label: 'Is Content Truncated',
      format: 'boolean',
    },
    { key: 'keyWords', label: 'Key Words' },
    { key: 'fullContentURL', label: 'Full Content URL', format: 'url' },
    { key: 'actions', label: 'Actions' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'direction', label: 'Direction' },
    { key: 'cc', label: 'Cc', format: 'email' },
    { key: 'responderId', label: 'Responder ID' },
    { key: 'bcc', label: 'Bcc', format: 'email' },
    { key: 'to', label: 'To', format: 'email' },
    { key: 'fromEmailAddress', label: 'From Email Address', format: 'email' },
    { key: 'isForward', label: 'Is Forward', format: 'boolean' },
  ],
};

export const zohoDeskListTicketThreadsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'threads',
      label: 'Threads',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'channel', label: 'Channel' },
        { key: 'canReply', label: 'Can Reply', format: 'boolean' },
        { key: 'contentType', label: 'Content Type' },
        { key: 'hasAttach', label: 'Has Attach', format: 'boolean' },
        { key: 'status', label: 'Status' },
        { key: 'summary', label: 'Summary' },
        { key: 'author', label: 'Author', children: authorFields },
        { key: 'attachmentCount', label: 'Attachment Count' },
        { key: 'sentiment', label: 'Sentiment' },
        { key: 'aspects', label: 'Aspects' },
        { key: 'channelRelatedInfo', label: 'Channel Related Info' },
        { key: 'respondedIn', label: 'Responded In' },
        {
          key: 'lastRatingIconURL',
          label: 'Last Rating Icon URL',
          format: 'image',
        },
        { key: 'readReceipts', label: 'Read Receipts' },
        { key: 'impersonatedUser', label: 'Impersonated User' },
        {
          key: 'isDescriptionThread',
          label: 'Is Description Thread',
          format: 'boolean',
        },
        { key: 'source', label: 'Source', children: sourceFields },
        { key: 'keyWords', label: 'Key Words' },
        { key: 'actions', label: 'Actions' },
        { key: 'visibility', label: 'Visibility' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'direction', label: 'Direction' },
        { key: 'cc', label: 'Cc', format: 'email' },
        { key: 'responderId', label: 'Responder ID' },
        { key: 'bcc', label: 'Bcc', format: 'email' },
        { key: 'to', label: 'To', format: 'email' },
        {
          key: 'fromEmailAddress',
          label: 'From Email Address',
          format: 'email',
        },
        { key: 'isForward', label: 'Is Forward', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketActivitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activities',
      label: 'Activities',
      labelKey: 'subject',
      listItems: [
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
        { key: 'id', label: 'ID' },
        { key: 'direction', label: 'Direction' },
        { key: 'callId', label: 'Call ID' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'category', label: 'Category' },
        { key: 'activityType', label: 'Activity Type' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketCallsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'calls',
      label: 'Calls',
      labelKey: 'subject',
      listItems: callFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketEventsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'subject',
      listItems: [
        { key: 'callId', label: 'Call ID' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
        { key: 'id', label: 'ID' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'category', label: 'Category' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskListTicketHistoryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'history',
      label: 'History',
      listItems: [
        { key: 'eventName', label: 'Event Name' },
        { key: 'eventTime', label: 'Event Time', format: 'datetime' },
        {
          key: 'actor',
          label: 'Actor',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
          ],
        },
        { key: 'source', label: 'Source' },
        {
          key: 'eventInfo',
          label: 'Event Info',
          listItems: [
            { key: 'propertyName', label: 'Property Name' },
            {
              key: 'propertyValue',
              label: 'Property Value',
              children: [
                { key: 'previousValue', label: 'Previous Value' },
                { key: 'updatedValue', label: 'Updated Value' },
                { key: 'type', label: 'Type' },
              ],
            },
            { key: 'propertyType', label: 'Property Type' },
            {
              key: 'systemProperty',
              label: 'System Property',
              format: 'boolean',
            },
          ],
        },
        { key: 'actorInfo', label: 'Actor Info' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskGetTicketMetricsOutputSchema: OutputSchema = {
  fields: [
    { key: 'firstResponseTime', label: 'First Response Time' },
    { key: 'totalResponseTime', label: 'Total Response Time' },
    { key: 'responseCount', label: 'Response Count' },
    { key: 'outgoingCount', label: 'Outgoing Count' },
    { key: 'threadCount', label: 'Thread Count' },
    { key: 'resolutionTime', label: 'Resolution Time' },
    { key: 'reopenCount', label: 'Reopen Count' },
    { key: 'reassignCount', label: 'Reassign Count' },
    {
      key: 'stagingData',
      label: 'Staging Data',
      listItems: [
        { key: 'status', label: 'Status' },
        { key: 'handledTime', label: 'Handled Time' },
      ],
    },
    {
      key: 'agentsHandled',
      label: 'Agents Handled',
      listItems: [
        { key: 'agentId', label: 'Agent ID' },
        { key: 'agentName', label: 'Agent Name' },
        { key: 'handlingTime', label: 'Handling Time' },
      ],
    },
  ],
};

export const zohoDeskListTicketTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'subject',
      listItems: [
        { key: 'callId', label: 'Call ID' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'statusType', label: 'Status Type' },
        { key: 'contactId', label: 'Contact ID' },
        { key: 'subject', label: 'Subject' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'departmentId', label: 'Department ID' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'creatorId', label: 'Creator ID' },
        { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'priority', label: 'Priority' },
        { key: 'layoutId', label: 'Layout ID' },
        { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
        { key: 'isCommented', label: 'Is Commented', format: 'boolean' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
        { key: 'id', label: 'ID' },
        { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
        { key: 'category', label: 'Category' },
        { key: 'ticketId', label: 'Ticket ID' },
        { key: 'status', label: 'Status' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zohoDeskUpdateCallOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'startTime', label: 'Start Time', format: 'datetime' },
    { key: 'direction', label: 'Direction' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'activityTime', label: 'Activity Time', format: 'datetime' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'status', label: 'Status' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'creatorId', label: 'Creator ID' },
    { key: 'callId', label: 'Call ID' },
    { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
    { key: 'modifiedBy', label: 'Modified By', children: modifiedByFields },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
  ],
};

export const zohoDeskUpdateContractOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'supportPlan', label: 'Support Plan', children: supportPlanFields },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'contractName', label: 'Contract Name' },
    { key: 'contractNumber', label: 'Contract Number' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'productId', label: 'Product ID' },
    { key: 'notifyOn', label: 'Notify On', format: 'date' },
    {
      key: 'sla',
      label: 'Sla',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    { key: 'account', label: 'Account', children: accountFields },
    {
      key: 'product',
      label: 'Product',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'productName', label: 'Product Name' },
      ],
    },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'description', label: 'Description' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'modifiedBy', label: 'Modified By' },
    { key: 'associatedSLAId', label: 'Associated SLAId' },
    { key: 'notifyBefore', label: 'Notify Before' },
    { key: 'owner', label: 'Owner', children: ownerFields },
    { key: 'notificationAgentIds', label: 'Notification Agent IDs' },
    { key: 'startDate', label: 'Start Date', format: 'date' },
    { key: 'endDate', label: 'End Date', format: 'date' },
    { key: 'contractStatus', label: 'Contract Status' },
  ],
};

export const zohoDeskUpdateManyAccountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result', labelKey: 'id', listItems: resultFields },
  ],
};

export const zohoDeskUpdateTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'subCategory', label: 'Sub Category' },
    { key: 'statusType', label: 'Status Type' },
    { key: 'subject', label: 'Subject' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'departmentId', label: 'Department ID' },
    { key: 'channel', label: 'Channel' },
    { key: 'onholdTime', label: 'Onhold Time', format: 'datetime' },
    { key: 'language', label: 'Language' },
    { key: 'source', label: 'Source', children: threadSourceFields },
    { key: 'resolution', label: 'Resolution' },
    { key: 'sharedDepartments', label: 'Shared Departments' },
    { key: 'closedTime', label: 'Closed Time', format: 'datetime' },
    { key: 'approvalCount', label: 'Approval Count' },
    { key: 'isOverDue', label: 'Is Over Due', format: 'boolean' },
    { key: 'isTrashed', label: 'Is Trashed', format: 'boolean' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'id', label: 'ID' },
    {
      key: 'isResponseOverdue',
      label: 'Is Response Overdue',
      format: 'boolean',
    },
    {
      key: 'customerResponseTime',
      label: 'Customer Response Time',
      format: 'datetime',
    },
    { key: 'productId', label: 'Product ID' },
    { key: 'contactId', label: 'Contact ID' },
    { key: 'threadCount', label: 'Thread Count' },
    { key: 'secondaryContacts', label: 'Secondary Contacts' },
    { key: 'priority', label: 'Priority' },
    { key: 'classification', label: 'Classification' },
    { key: 'commentCount', label: 'Comment Count' },
    { key: 'taskCount', label: 'Task Count' },
    { key: 'accountId', label: 'Account ID' },
    { key: 'phone', label: 'Phone' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    { key: 'isSpam', label: 'Is Spam', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'entitySkills', label: 'Entity Skills' },
    { key: 'ticketNumber', label: 'Ticket Number' },
    { key: 'customFields', label: 'Custom Fields' },
    { key: 'isArchived', label: 'Is Archived', format: 'boolean' },
    { key: 'description', label: 'Description' },
    { key: 'timeEntryCount', label: 'Time Entry Count' },
    { key: 'channelRelatedInfo', label: 'Channel Related Info' },
    { key: 'responseDueDate', label: 'Response Due Date', format: 'datetime' },
    { key: 'isDeleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'modifiedBy', label: 'Modified By' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'layoutDetails',
      label: 'Layout Details',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'layoutName', label: 'Layout Name' },
      ],
    },
    { key: 'channelCode', label: 'Channel Code' },
    { key: 'cf', label: 'Custom Fields (API Names)' },
    { key: 'slaId', label: 'Sla ID' },
    { key: 'layoutId', label: 'Layout ID' },
    { key: 'assigneeId', label: 'Assignee ID' },
    { key: 'teamId', label: 'Team ID' },
    { key: 'attachmentCount', label: 'Attachment Count' },
    { key: 'isEscalated', label: 'Is Escalated', format: 'boolean' },
    { key: 'category', label: 'Category' },
  ],
};

export const zohoDeskListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'viewName', label: 'View Name' },
        { key: 'isCustomView', label: 'Is Custom View', format: 'boolean' },
        { key: 'isLocked', label: 'Is Locked', format: 'boolean' },
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
        { key: 'deprecatedViewId', label: 'Deprecated View ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};
