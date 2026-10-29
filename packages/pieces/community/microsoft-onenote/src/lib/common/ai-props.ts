import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function notebookId<R extends boolean>({
  required,
  displayName = 'Notebook ID',
  description = 'OneNote notebook ID. Use List Notebooks or Get Recent Notebooks to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function sectionGroupId<R extends boolean>({
  required,
  displayName = 'Section Group ID',
  description = 'OneNote section group ID. Use List Section Groups to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function sectionId<R extends boolean>({
  required,
  displayName = 'Section ID',
  description = 'OneNote section ID. Use List Sections to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function pageId<R extends boolean>({
  required,
  displayName = 'Page ID',
  description = 'OneNote page ID. Use List Pages to find it.',
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

function skip<R extends boolean>({
  required,
  displayName = 'Skip',
  description = 'Number of items to skip, for the next page. Send the same filters with Skip set to the previous Skip plus Limit.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const microsoftOneNoteAiProps = {
  notebookId,
  sectionGroupId,
  sectionId,
  pageId,
  limit,
  skip,
};
