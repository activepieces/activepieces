import { OutputSchema } from '@activepieces/pieces-framework';

export const sendNotificationActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      value: 'body.status',
      format: 'number',
      description: '1 when Pushover accepted the notification. Any other value means it was rejected.',
    },
    {
      key: 'request',
      label: 'Request ID',
      value: 'body.request',
      description: 'Pushover\'s identifier for this request, worth quoting when reporting a delivery problem.',
    },
    {
      key: 'receipt',
      label: 'Receipt',
      value: 'body.receipt',
      description:
        'Only returned at emergency priority (2). Use it to check whether the notification was acknowledged.',
    },
  ],
};

export const sendPushMessageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the notification. Any other value means it was rejected.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request, worth quoting when reporting a delivery problem.',
    },
    {
      key: 'receipt',
      label: 'Receipt',
      description:
        'Only returned at emergency priority (2). Pass it to Get Emergency Receipt Status or Cancel Emergency Retries.',
    },
  ],
};

export const getAppLimitsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'limit',
      label: 'Monthly Limit',
      format: 'number',
      description: 'Total messages the application may send this month.',
    },
    {
      key: 'remaining',
      label: 'Remaining',
      format: 'number',
      description:
        'Messages still available before the monthly quota is exhausted and sends start returning 429.',
    },
    {
      key: 'reset',
      label: 'Quota Reset',
      format: 'number',
      description: 'Unix timestamp in seconds at which the monthly counter resets.',
    },
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request, worth quoting when reporting a problem.',
    },
  ],
};

export const listNotificationSoundsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sounds',
      label: 'Sounds',
      labelKey: 'name',
      description: 'Every sound Pushover accepts for the Sound parameter of Send Push Message.',
      listItems: [
        {
          key: 'id',
          label: 'Sound ID',
          description: 'Identifier to pass as the Sound parameter, for example pushover or cosmic.',
        },
        {
          key: 'name',
          label: 'Name',
          description: 'Human-readable sound name, for example Pushover (default).',
        },
      ],
    },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
      description: 'Number of sounds returned.',
    },
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const listDeliveryGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      description: 'Delivery groups owned by the same account as the application token.',
      listItems: [
        {
          key: 'group',
          label: 'Group Key',
          description: 'The 30-character group key every other group action takes as input.',
        },
        {
          key: 'name',
          label: 'Name',
          description: 'Group name, unique within the account.',
        },
      ],
    },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
      description: 'Number of groups returned.',
    },
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const getDeliveryGroupOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Name',
      description: 'Name of the delivery group.',
    },
    {
      key: 'users',
      label: 'Members',
      labelKey: 'user',
      description: 'Every member of the group, including members currently suspended.',
      listItems: [
        {
          key: 'user',
          label: 'User Key',
          description:
            'The 30-character user key of the member, as passed to Remove User from Delivery Group, Disable Group User and Enable Group User.',
        },
        {
          key: 'device',
          label: 'Device',
          description:
            'Device the group delivers to for this member, or null when every device of theirs receives group messages.',
        },
        {
          key: 'memo',
          label: 'Memo',
          description: 'Note stored with the membership, for example Primary on-call.',
        },
        {
          key: 'disabled',
          label: 'Disabled',
          format: 'boolean',
          description:
            'True while the member is suspended by Disable Group User and group messages skip them. Restore with Enable Group User.',
        },
        {
          key: 'valid',
          label: 'Valid',
          format: 'boolean',
          description:
            'False when the user key is no longer reachable, for example because the account was deleted or has no active device.',
        },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const getLicenseCreditsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'credits',
      label: 'Credits',
      format: 'number',
      description:
        'Prepaid license credits the application still holds. Assign License spends one irreversibly.',
    },
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const validateUserKeyOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when the key is valid, has at least one active device and is not disabled.',
    },
    {
      key: 'group',
      label: 'Is Group',
      format: 'number',
      description: '1 when the validated key is a delivery group key, 0 when it is a user key.',
    },
    {
      key: 'devices',
      label: 'Devices',
      description:
        'Names of the devices registered to this user, usable as the Device parameter of Send Push Message.',
    },
    {
      key: 'licenses',
      label: 'Licenses',
      description: 'Platforms the user holds a license for, for example Android or iOS.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const createDeliveryGroupOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'group',
      label: 'Group Key',
      description: 'The 30-character group key, whether the group was created or already existed.',
    },
    {
      key: 'name',
      label: 'Name',
      description: 'Name of the group.',
    },
    {
      key: 'created',
      label: 'Created',
      format: 'boolean',
      description:
        'True when a new group was created, false when an existing group with that name was returned.',
    },
  ],
};

export const renameDeliveryGroupOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover renamed the group.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const getReceiptStatusOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      format: 'number',
      description:
        '1 once a recipient acknowledged the emergency notification, which stops the retries.',
    },
    {
      key: 'acknowledged_at',
      label: 'Acknowledged At',
      format: 'number',
      description: 'Unix timestamp in seconds of the acknowledgement, 0 while unacknowledged.',
    },
    {
      key: 'acknowledged_by',
      label: 'Acknowledged By',
      description: 'User key of the recipient who acknowledged, empty while unacknowledged.',
    },
    {
      key: 'acknowledged_by_device',
      label: 'Acknowledged By Device',
      description: 'Device name that acknowledged, empty while unacknowledged.',
    },
    {
      key: 'last_delivered_at',
      label: 'Last Delivered At',
      format: 'number',
      description: 'Unix timestamp in seconds of the most recent retry delivery.',
    },
    {
      key: 'expired',
      label: 'Expired',
      format: 'number',
      description: '1 once the retry window closed without an acknowledgement.',
    },
    {
      key: 'expires_at',
      label: 'Expires At',
      format: 'number',
      description: 'Unix timestamp in seconds at which retrying stops.',
    },
    {
      key: 'called_back',
      label: 'Called Back',
      format: 'number',
      description: '1 once Pushover called the callback URL supplied at send time.',
    },
    {
      key: 'called_back_at',
      label: 'Called Back At',
      format: 'number',
      description: 'Unix timestamp in seconds of the callback, 0 when no callback fired.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const cancelEmergencyRetriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when the retry loop for this receipt is stopped.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const cancelEmergencyRetriesByTagOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description: '1 when Pushover accepted the request.',
    },
    {
      key: 'canceled',
      label: 'Canceled Count',
      format: 'number',
      description:
        'Number of still-retrying emergency notifications carrying the tag that were stopped.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const addUserToGroupOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description:
        '1 when the user was added as a member. Adding someone who is already a member fails instead of returning a non-1 status.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const removeUserFromGroupOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description:
        '1 when the member was removed. Removing someone who is not a member fails instead of returning a non-1 status.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const disableGroupUserOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description:
        '1 when the member is suspended. Read the membership back with Get Delivery Group to see disabled turn true.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};

export const enableGroupUserOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      format: 'number',
      description:
        '1 when the member receives group messages again. Read the membership back with Get Delivery Group to see disabled turn false.',
    },
    {
      key: 'request',
      label: 'Request ID',
      description: 'Pushover\'s identifier for this request.',
    },
  ],
};
