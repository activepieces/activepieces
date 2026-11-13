import type { OutputSchema } from '@activepieces/pieces-framework';

export const recordOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceType', label: 'Resource Type' },
    { key: 'id', label: 'Record ID' },
    { key: 'record', label: 'Record' },
  ],
};

export const deleteRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceType', label: 'Resource Type' },
    { key: 'id', label: 'Record Identifier' },
    { key: 'removed', label: 'Removed', format: 'boolean' },
  ],
};

export const searchRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceType', label: 'Resource Type' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'items', label: 'Records' },
    { key: 'nextPageToken', label: 'Next Page Token' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
  ],
};

export const suspendUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'primaryEmail', label: 'Primary Email', format: 'email' },
    { key: 'suspended', label: 'Suspended', format: 'boolean' },
    { key: 'suspensionReason', label: 'Suspension Reason' },
    { key: 'record', label: 'User Record' },
  ],
};

export const mobileDeviceActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceId', label: 'Device Resource ID' },
    { key: 'action', label: 'Action' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const transferDataOutputSchema: OutputSchema = {
  fields: [
    { key: 'transferId', label: 'Transfer ID' },
    { key: 'status', label: 'Status' },
    { key: 'oldOwnerUserId', label: 'From User ID' },
    { key: 'newOwnerUserId', label: 'To User ID' },
    { key: 'requestTime', label: 'Request Time', format: 'datetime' },
    {
      key: 'applications',
      label: 'Applications',
      labelKey: 'applicationId',
      listItems: [
        { key: 'applicationId', label: 'Application ID' },
        { key: 'status', label: 'Status' },
        {
          key: 'params',
          label: 'Parameters',
          labelKey: 'key',
          listItems: [
            { key: 'key', label: 'Key' },
            { key: 'value', label: 'Values' },
          ],
        },
      ],
    },
  ],
};

export const activityEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID' },
    { key: 'time', label: 'Time', format: 'datetime' },
    { key: 'application', label: 'Application' },
    { key: 'eventType', label: 'Event Type' },
    { key: 'eventName', label: 'Event Name' },
    {
      key: 'actor',
      label: 'Actor',
      children: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'profileId', label: 'Profile ID' },
        { key: 'callerType', label: 'Caller Type' },
      ],
    },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'ownerDomain', label: 'Owner Domain' },
    { key: 'parameters', label: 'Parameters', dynamicKey: true },
    { key: 'activity', label: 'Raw Activity' },
  ],
};
