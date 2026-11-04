import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function page<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'Page number to return, starting at 1. Defaults to 1. The response has `current_page` and `total`; request the next page while more results remain.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function listId<R extends boolean>({
  required,
  displayName = 'List ID',
  description = 'ID of a SendFox list, e.g. "123456". Use List Lists to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function contactId<R extends boolean>({
  required,
  displayName = 'Contact ID',
  description = 'ID of a SendFox contact, e.g. "98765432". Create Contact returns it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function campaignId<R extends boolean>({
  required,
  displayName = 'Campaign ID',
  description = 'ID of a SendFox campaign, e.g. "1234567". Use List Campaigns to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function tagId<R extends boolean>({
  required,
  displayName = 'Tag ID',
  description = 'ID of a SendFox contact tag, e.g. "4321". Use List Tags to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function query<R extends boolean>({
  required,
  displayName = 'Search',
  description = 'Text to filter results by. Leave empty to return all.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const sendfoxAiProps = {
  page,
  listId,
  contactId,
  campaignId,
  tagId,
  query,
};
