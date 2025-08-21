import {
  OAuth2PropertyValue,
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
        const response = await fetch('https://www.evernote.com/edam/user', {
          headers: {
            'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notebooksResponse = await fetch('https://www.evernote.com/edam/notebook', {
          headers: {
            'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!notebooksResponse.ok) {
          throw new Error(`HTTP error! status: ${notebooksResponse.status}`);
        }

        const notebooks = await notebooksResponse.json();
        
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
        const response = await fetch('https://www.evernote.com/edam/tag', {
          headers: {
            'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const tags = await response.json();
        
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
        const response = await fetch(`https://www.evernote.com/edam/note?notebookGuid=${notebook}&maxNotes=100`, {
          headers: {
            'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notes = await response.json();
        
        return {
          disabled: false,
          placeholder: 'Select a note',
          options: notes.notes?.map((note: any) => ({
            label: note.title || 'Untitled',
            value: note.guid,
          })) || [],
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
