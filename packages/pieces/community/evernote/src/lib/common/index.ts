import {
  Property,
} from '@activepieces/pieces-framework';

export const evernoteCommon = {
  notebook: Property.Dropdown<string>({
    displayName: 'Notebook',
    required: true,
    description: 'Choose the notebook you want to work with',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Evernote account first',
          options: [],
        };
      }

      try {
        const { Client } = require('evernote');
        const client = new Client({ token: auth, sandbox: false });
        const noteStore = client.getNoteStore();
        const notebooks = await noteStore.listNotebooks();
        
        return {
          disabled: false,
          placeholder: 'Select a notebook',
          options: notebooks.map((notebook: any) => ({
            label: notebook.name || 'Untitled',
            value: notebook.guid,
          })),
        };
      } catch (error) {
        console.error('Error loading notebooks:', error);
        return {
          disabled: true,
          placeholder: 'Error loading notebooks',
          options: [],
        };
      }
    },
  }),

  tag: Property.Dropdown<string>({
    displayName: 'Tag',
    required: false,
    description: 'Choose a tag to filter by',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Evernote account first',
          options: [],
        };
      }

      try {
        const { Client } = require('evernote');
        const client = new Client({ token: auth, sandbox: false });
        const noteStore = client.getNoteStore();
        const tags = await noteStore.listTags();
        
        return {
          disabled: false,
          placeholder: 'Select a tag',
          options: tags.map((tag: any) => ({
            label: tag.name || 'Untitled',
            value: tag.guid,
          })),
        };
      } catch (error) {
        console.error('Error loading tags:', error);
        return {
          disabled: true,
          placeholder: 'Error loading tags',
          options: [],
        };
      }
    },
  }),

  note: Property.Dropdown<string>({
    displayName: 'Note',
    required: true,
    description: 'Choose the note you want to work with',
    refreshers: ['notebook'],
    options: async ({ auth, notebook }) => {
      if (!auth || !notebook) {
        return {
          disabled: true,
          placeholder: 'Please connect your account and select a notebook first',
          options: [],
        };
      }

      try {
        const { Client } = require('evernote');
        const client = new Client({ token: auth, sandbox: false });
        const noteStore = client.getNoteStore();
        
        const filter = new noteStore.constructor.NoteFilter();
        filter.notebookGuid = notebook as string;
        
        const notes = await noteStore.findNotes(filter, 0, 100);
        
        return {
          disabled: false,
          placeholder: 'Select a note',
          options: (notes.notes || []).map((note: any) => ({
            label: note.title || 'Untitled',
            value: note.guid,
          })),
        };
      } catch (error) {
        console.error('Error loading notes:', error);
        return {
          disabled: true,
          placeholder: 'Error loading notes',
          options: [],
        };
      }
    },
  }),
};
