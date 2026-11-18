import { DropdownState, Property, tryCatch } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from './client';

import type { MicrosoftOneNoteList, Notebook, OnenotePage, OnenoteSection } from './types';

function notebookId<R extends boolean>({
  required,
  displayName = 'Notebook',
  description = 'The notebook to use.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftOneNoteAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your account first' });
      }
      const client = microsoftOneNoteClient.create({ auth });
      const { data: response, error } = await tryCatch<MicrosoftOneNoteList<Notebook>>(() =>
        client.api('/me/onenote/notebooks').get(),
      );
      if (error) {
        return disabledOptions({ placeholder: 'Failed to load notebooks' });
      }
      return {
        disabled: false,
        options: response.value.map((notebook) => ({
          label: notebook.displayName ?? '',
          value: notebook.id ?? '',
        })),
      };
    },
  });
}

function sectionId<R extends boolean>({
  required,
  displayName = 'Section',
  description = 'The section to use.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftOneNoteAuth,
    displayName,
    description,
    required,
    refreshers: ['notebook_id'],
    options: async ({ auth, notebook_id }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your account first' });
      }
      if (!notebook_id) {
        return disabledOptions({ placeholder: 'Select a notebook first' });
      }
      const client = microsoftOneNoteClient.create({ auth });
      const { data: response, error } = await tryCatch<MicrosoftOneNoteList<OnenoteSection>>(() =>
        client.api(`/me/onenote/notebooks/${String(notebook_id)}/sections`).get(),
      );
      if (error) {
        return disabledOptions({ placeholder: 'Failed to load sections' });
      }
      return {
        disabled: false,
        options: response.value.map((section) => ({
          label: section.displayName ?? '',
          value: section.id ?? '',
        })),
      };
    },
  });
}

function pageId<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'The page to use.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: microsoftOneNoteAuth,
    displayName,
    description,
    required,
    refreshers: ['section_id'],
    options: async ({ auth, section_id }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect your account first' });
      }
      if (!section_id) {
        return disabledOptions({ placeholder: 'Select a section first' });
      }
      const client = microsoftOneNoteClient.create({ auth });
      const { data: response, error } = await tryCatch<MicrosoftOneNoteList<OnenotePage>>(() =>
        client.api(`/me/onenote/sections/${String(section_id)}/pages`).get(),
      );
      if (error) {
        return disabledOptions({ placeholder: 'Failed to load pages' });
      }
      return {
        disabled: false,
        options: response.value.map((page) => ({
          label: page.title ?? '',
          value: page.id ?? '',
        })),
      };
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const microsoftOneNoteProps = { notebookId, sectionId, pageId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
