import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const createNote = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a note in a chosen notebook',
  props: {
    notebookGuid: Property.Dropdown({
      displayName: 'Notebook',
      description: 'The notebook where the note will be created.',
      required: true,
      refreshers: [],
      // By destructuring { auth } directly, we get the correctly typed value
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please provide authentication first.',
            options: [],
          };
        }
        
        const response = await httpClient.sendRequest<
          { name: string; guid: string }[]
        >({
          method: HttpMethod.GET,
          url: 'https://www.evernote.com/api/v1/notebooks',
          headers: {
            // auth is now a strongly typed string (or the auth object)
            Authorization: `Bearer ${auth}`,
          },
        });

        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.map((notebook: { name: string; guid: string }) => {
              return {
                label: notebook.name,
                value: notebook.guid,
              };
            }),
          };
        }

        return {
          disabled: true,
          placeholder: 'Error fetching notebooks. Please check your token.',
          options: [],
        };
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the note.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        "The body of the note. Plain text will be automatically formatted for Evernote.",
      required: true,
    }),
  },
  async run(context) {
    const { title, content, notebookGuid } = context.propsValue;
    const token = context.auth as string;

    const formattedContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${content.replace(/\n/g, '<br/>')}</en-note>`;

    const notePayload = {
      title: title,
      content: formattedContent,
      notebookGuid: notebookGuid,
    };

    // Use the imported httpClient, not one from the context object
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.evernote.com/api/v1/notes`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: notePayload,
    });

    return response.body;
  },
});