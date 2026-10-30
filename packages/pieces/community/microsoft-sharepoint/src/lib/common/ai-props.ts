import { Property } from '@activepieces/pieces-framework';

function siteId<R extends boolean>({
  required,
  displayName = 'Site ID',
  description = 'SharePoint site ID, like "contoso.sharepoint.com,<guid>,<guid>". Use Find Site, Get Root Site or Get Site by Path to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function listId<R extends boolean>({
  required,
  displayName = 'List ID',
  description = 'SharePoint list ID (a GUID). Use List Lists to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function driveId<R extends boolean>({
  required,
  displayName = 'Drive ID',
  description = 'ID of a document library (drive). Use List Site Drives or Get Site Default Drive to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function itemId<R extends boolean>({
  required,
  displayName = 'Item ID',
  description = 'ID of a file or folder (drive item) in the drive. Use List Folder Children, Find File or Search to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function listItemId<R extends boolean>({
  required,
  displayName = 'List Item ID',
  description = 'ID of the list item, a number like "12" sent as text. Use List List Items to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'Maximum number of items to return, from 1 to 100. Defaults to 20.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required, defaultValue: 20 });
}

function nextLink<R extends boolean>({
  required,
  displayName = 'Next Link',
  description = 'The @odata.nextLink value from the previous call, to get the next page. Leave empty for the first page.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function booleanProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
    },
  });
}

export const microsoftSharePointAiProps = {
  siteId,
  listId,
  driveId,
  itemId,
  listItemId,
  limit,
  nextLink,
  booleanProp,
};

type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
