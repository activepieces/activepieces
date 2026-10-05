import { OutputSchema } from '@activepieces/pieces-framework';

const labelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Label ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
];

const boardLabelFields: OutputSchema['fields'] = [
  ...labelFields,
  { key: 'idBoard', label: 'Board ID' },
  { key: 'uses', label: 'Uses', format: 'number' },
];

const cardFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Card ID' },
  { key: 'name', label: 'Name' },
  { key: 'desc', label: 'Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'shortUrl', label: 'Short URL', format: 'url' },
  { key: 'closed', label: 'Archived', format: 'boolean' },
  { key: 'due', label: 'Due Date', format: 'datetime' },
  { key: 'dueComplete', label: 'Due Complete', format: 'boolean' },
  { key: 'dateLastActivity', label: 'Last Activity', format: 'datetime' },
  { key: 'idBoard', label: 'Board ID' },
  { key: 'idList', label: 'List ID' },
  { key: 'idMembers', label: 'Member IDs' },
  { key: 'idChecklists', label: 'Checklist IDs' },
  { key: 'labels', label: 'Labels', labelKey: 'name', listItems: labelFields },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'mimeType', label: 'MIME Type' },
  { key: 'bytes', label: 'Size (Bytes)', format: 'filesize' },
  { key: 'isUpload', label: 'Is Upload', format: 'boolean' },
  { key: 'date', label: 'Added At', format: 'datetime' },
];

const listFields: OutputSchema['fields'] = [
  { key: 'id', label: 'List ID' },
  { key: 'name', label: 'Name' },
  { key: 'closed', label: 'Archived', format: 'boolean' },
  { key: 'color', label: 'Color' },
  { key: 'idBoard', label: 'Board ID' },
  { key: 'pos', label: 'Position', format: 'number' },
];

const boardFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Name' },
  { key: 'desc', label: 'Description' },
  { key: 'closed', label: 'Archived', format: 'boolean' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'shortUrl', label: 'Short URL', format: 'url' },
  { key: 'idOrganization', label: 'Organization ID' },
  {
    key: 'prefs',
    label: 'Preferences',
    children: [
      { key: 'permissionLevel', label: 'Permission Level' },
      { key: 'background', label: 'Background Color' },
    ],
  },
];

const memberSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Member ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'username', label: 'Username' },
  { key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
  { key: 'initials', label: 'Initials' },
];

const boardMemberFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Member ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'username', label: 'Username' },
];

const customFieldOptionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Option ID' },
  { key: 'idCustomField', label: 'Custom Field ID' },
  {
    key: 'value',
    label: 'Value',
    children: [{ key: 'text', label: 'Text' }],
  },
  { key: 'color', label: 'Color' },
  { key: 'pos', label: 'Position', format: 'number' },
];

const customFieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Custom Field ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'type',
    label: 'Type',
    description: 'One of text, number, date, checkbox or list.',
  },
  { key: 'idModel', label: 'Board ID' },
  { key: 'modelType', label: 'Model Type' },
  { key: 'fieldGroup', label: 'Field Group' },
  {
    key: 'display',
    label: 'Display',
    children: [
      { key: 'cardFront', label: 'Show on Card Front', format: 'boolean' },
    ],
  },
  { key: 'pos', label: 'Position', format: 'number' },
  {
    key: 'options',
    label: 'Options',
    description: 'Present on list (dropdown) fields only.',
    labelKey: 'id',
    listItems: customFieldOptionFields,
  },
];

const checkItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Check Item ID' },
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State' },
  { key: 'due', label: 'Due Date', format: 'datetime' },
  { key: 'idMember', label: 'Member ID' },
  { key: 'idChecklist', label: 'Checklist ID' },
];

const checklistFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Checklist ID' },
  { key: 'name', label: 'Name' },
  { key: 'idBoard', label: 'Board ID' },
  { key: 'idCard', label: 'Card ID' },
  {
    key: 'checkItems',
    label: 'Check Items',
    labelKey: 'name',
    listItems: checkItemFields,
  },
];

const memberFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Member ID' },
  { key: 'username', label: 'Username' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
];

const reactionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Reaction ID' },
  { key: 'idMember', label: 'Member ID' },
  { key: 'idModel', label: 'Comment ID' },
  {
    key: 'member',
    label: 'Member',
    children: [
      { key: 'id', label: 'Member ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'username', label: 'Username' },
    ],
  },
  {
    key: 'emoji',
    label: 'Emoji',
    children: [
      { key: 'shortName', label: 'Short Name' },
      { key: 'native', label: 'Native' },
      { key: 'name', label: 'Name' },
    ],
  },
];

const commentActionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date', format: 'datetime' },
  {
    key: 'data',
    label: 'Data',
    children: [
      { key: 'text', label: 'Text' },
      {
        key: 'card',
        label: 'Card',
        children: [
          { key: 'id', label: 'Card ID' },
          { key: 'name', label: 'Name' },
        ],
      },
      { key: 'dateLastEdited', label: 'Last Edited', format: 'datetime' },
    ],
  },
  {
    key: 'memberCreator',
    label: 'Member Creator',
    children: [
      { key: 'id', label: 'Member ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'username', label: 'Username' },
    ],
  },
];

export const createCardAiActionOutputSchema: OutputSchema = { fields: cardFields };

export const getCardAiActionOutputSchema: OutputSchema = { fields: cardFields };

export const updateCardAiActionOutputSchema: OutputSchema = { fields: cardFields };

export const listCardAttachmentsAiActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'attachments', label: 'Attachments', value: '', listItems: attachmentFields },
  ],
};

export const searchCardsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardFields },
  ],
};

export const searchMembersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'members',
      label: 'Members',
      labelKey: 'fullName',
      listItems: [
        ...memberSummaryFields,
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'active', label: 'Active', format: 'boolean' },
      ],
    },
  ],
};

export const listCardsInListActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardFields },
  ],
};

export const listCardsInBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'cards', label: 'Cards', labelKey: 'name', listItems: cardFields },
  ],
};

export const listCardMembersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'members',
      label: 'Members',
      labelKey: 'fullName',
      listItems: memberSummaryFields,
    },
  ],
};

export const addCommentToCardActionOutputSchema: OutputSchema = { fields: commentActionFields };

export const listCardCommentsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      listItems: commentActionFields,
    },
  ],
};

export const updateCommentActionOutputSchema: OutputSchema = { fields: commentActionFields };

export const addMemberToCardActionOutputSchema: OutputSchema = {
  itemLabel: '{fullName}',
  fields: [
    { key: 'members', label: 'Card Members', value: '', listItems: memberSummaryFields },
  ],
};

export const removeMemberFromCardActionOutputSchema: OutputSchema = {
  itemLabel: '{fullName}',
  fields: [
    { key: 'members', label: 'Card Members', value: '', listItems: memberSummaryFields },
  ],
};

export const createBoardLabelActionOutputSchema: OutputSchema = { fields: boardLabelFields };

export const updateLabelActionOutputSchema: OutputSchema = { fields: boardLabelFields };

export const listBoardLabelsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'labels', label: 'Labels', labelKey: 'name', listItems: boardLabelFields },
  ],
};

export const addLabelToCardActionOutputSchema: OutputSchema = {
  fields: [{ key: 'labelIds', label: 'Label IDs', value: '' }],
};

export const moveCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const archiveCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const createListActionOutputSchema: OutputSchema = { fields: listFields };

export const getListActionOutputSchema: OutputSchema = { fields: listFields };

export const listListsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields },
  ],
};

export const renameListActionOutputSchema: OutputSchema = { fields: listFields };

export const archiveListActionOutputSchema: OutputSchema = { fields: listFields };

export const createBoardActionOutputSchema: OutputSchema = { fields: boardFields };

export const getBoardActionOutputSchema: OutputSchema = { fields: boardFields };

export const listBoardsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'boards', label: 'Boards', labelKey: 'name', listItems: boardFields },
  ],
};

export const listOrganizationBoardsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'boards', label: 'Boards', labelKey: 'name', listItems: boardFields },
  ],
};

export const listBoardMembersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'members',
      label: 'Members',
      labelKey: 'fullName',
      listItems: boardMemberFields,
    },
  ],
};

export const getMemberActionOutputSchema: OutputSchema = { fields: memberFields };

export const getMyMemberActionOutputSchema: OutputSchema = { fields: memberFields };

export const addChecklistToCardActionOutputSchema: OutputSchema = { fields: checklistFields };

export const addChecklistItemActionOutputSchema: OutputSchema = { fields: checkItemFields };

export const listCardChecklistsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'checklists',
      label: 'Checklists',
      labelKey: 'name',
      listItems: checklistFields,
    },
  ],
};

export const setChecklistItemStateActionOutputSchema: OutputSchema = { fields: checkItemFields };

export const addReactionToCommentActionOutputSchema: OutputSchema = { fields: reactionFields };

export const updateBoardActionOutputSchema: OutputSchema = { fields: boardFields };

export const archiveBoardActionOutputSchema: OutputSchema = { fields: boardFields };

export const createCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const getCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const updateCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const getCardAttachmentActionOutputSchema: OutputSchema = { fields: attachmentFields };

export const getCardAttachmentsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'attachments', label: 'Attachments', value: '', listItems: attachmentFields },
  ],
};

export const addCardAttachmentActionOutputSchema: OutputSchema = { fields: attachmentFields };

export const copyCardActionOutputSchema: OutputSchema = { fields: cardFields };

export const addCardAttachmentFromUrlActionOutputSchema: OutputSchema = {
  fields: attachmentFields,
};

export const updateChecklistActionOutputSchema: OutputSchema = {
  fields: checklistFields,
};

export const updateChecklistItemActionOutputSchema: OutputSchema = {
  fields: checkItemFields,
};

export const moveListToBoardActionOutputSchema: OutputSchema = {
  fields: listFields,
};

export const listBoardMembershipsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'memberships',
      label: 'Memberships',
      labelKey: 'memberType',
      listItems: [
        { key: 'id', label: 'Membership ID' },
        { key: 'idMember', label: 'Member ID' },
        { key: 'memberType', label: 'Role' },
        { key: 'unconfirmed', label: 'Invite Pending', format: 'boolean' },
        { key: 'deactivated', label: 'Deactivated', format: 'boolean' },
        { key: 'member', label: 'Member', children: boardMemberFields },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listCardActivityActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'activity',
      label: 'Activity',
      description:
        'Activity entries, newest first, of the requested type. Each carries its type, date and the member who caused it.',
      labelKey: 'type',
      listItems: [
        { key: 'id', label: 'Action ID' },
        { key: 'type', label: 'Type' },
        { key: 'date', label: 'Date', format: 'datetime' },
        { key: 'idMemberCreator', label: 'Member ID' },
        {
          key: 'memberCreator',
          label: 'Member',
          children: boardMemberFields,
        },
        {
          key: 'data',
          label: 'Data',
          description:
            'Payload specific to the activity type, such as the comment text or the lists a card moved between.',
          dynamicKey: true,
        },
      ],
    },
    { key: 'count', label: 'Count on This Page', format: 'number' },
  ],
};

export const listCardVotesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'voters',
      label: 'Voters',
      description: 'The members who voted on this card.',
      labelKey: 'username',
      listItems: boardMemberFields,
    },
    { key: 'count', label: 'Vote Count', format: 'number' },
  ],
};

export const deleteBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'board_id', label: 'Board ID' },
  ],
};

export const deleteLabelActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'label_id', label: 'Label ID' },
  ],
};

export const deleteCustomFieldActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'custom_field_id', label: 'Custom Field ID' },
  ],
};

export const removeCardVoteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'card_id', label: 'Card ID' },
    { key: 'member_id', label: 'Member ID' },
  ],
};

export const customFieldActionOutputSchema: OutputSchema = {
  fields: customFieldFields,
};

export const customFieldOptionActionOutputSchema: OutputSchema = {
  fields: customFieldOptionFields,
};

export const listBoardCustomFieldsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_fields',
      label: 'Custom Fields',
      labelKey: 'name',
      listItems: customFieldFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listCustomFieldOptionsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'options',
      label: 'Options',
      labelKey: 'id',
      listItems: customFieldOptionFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listCardCustomFieldValuesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_field_values',
      label: 'Custom Field Values',
      labelKey: 'idCustomField',
      listItems: [
        { key: 'id', label: 'Item ID' },
        { key: 'idCustomField', label: 'Custom Field ID' },
        { key: 'idModel', label: 'Card ID' },
        { key: 'modelType', label: 'Model Type' },
        {
          key: 'idValue',
          label: 'Selected Option ID',
          description:
            'Set on dropdown fields only; resolve it to its text via List Custom Field Options.',
        },
        {
          key: 'value',
          label: 'Value',
          description:
            'Absent on dropdown fields. Carries exactly one of the keys below, matching the field type.',
          children: [
            { key: 'text', label: 'Text' },
            { key: 'number', label: 'Number' },
            { key: 'date', label: 'Date', format: 'datetime' },
            { key: 'checked', label: 'Checked' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const setCardCustomFieldValueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Item ID' },
    { key: 'idCustomField', label: 'Custom Field ID' },
    { key: 'idModel', label: 'Card ID' },
    { key: 'modelType', label: 'Model Type' },
    { key: 'idValue', label: 'Selected Option ID' },
    {
      key: 'value',
      label: 'Value',
      children: [
        { key: 'text', label: 'Text' },
        { key: 'number', label: 'Number' },
        { key: 'date', label: 'Date', format: 'datetime' },
        { key: 'checked', label: 'Checked' },
      ],
    },
  ],
};

export const cardMovedTriggerOutputSchema: OutputSchema = { fields: cardFields };

export const newCardTriggerOutputSchema: OutputSchema = { fields: cardFields };

export const deadlineTriggerOutputSchema: OutputSchema = { fields: cardFields };
