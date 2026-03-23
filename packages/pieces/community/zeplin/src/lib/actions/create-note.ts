import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ziplinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { project_idProp, screen_idProp } from '../common/props';

export const createNote = createAction({
  auth: ziplinAuth,
  name: 'createNote',
  displayName: 'Create Note',
  description: 'Create a note on a screen in Zeplin',
  props: {
    projectId: project_idProp,
    screenId: screen_idProp,
    content: Property.LongText({
      displayName: 'Note content',
      description: 'The content of the note',
      required: true,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'The color of the note',
      required: true,
      options: {
        options: [
          { label: 'Orange', value: 'orange' },
          { label: 'Peach', value: 'peach' },
          { label: 'Green', value: 'green' },
          { label: 'Yellow', value: 'yellow' },
          { label: 'Turquoise', value: 'turquoise' },
          { label: 'Cornflower Blue', value: 'cornflower_blue' },
          { label: 'Deep Purple', value: 'deep_purple' },
        ],
      },
    }),
    x: Property.Number({
      displayName: 'X Coordinate',
      description: 'The x coordinate position of the note on the screen',
      required: true,
    }),
    y: Property.Number({
      displayName: 'Y Coordinate',
      description: 'The y coordinate position of the note on the screen',
      required: true,
    }),
    x_start: Property.Number({
      displayName: 'X Start Coordinate',
      description: 'The starting x coordinate for range selection (optional)',
      required: false,
    }),
    y_start: Property.Number({
      displayName: 'Y Start Coordinate',
      description: 'The starting y coordinate for range selection (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, screenId, content, x, y, color, x_start, y_start } =
      context.propsValue;

    const body: Record<string, unknown> = {
      content,
      position: {
        x,
        y,
        x_start,
        y_start,
      },
      color,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/projects/${projectId}/screens/${screenId}/notes`,
      body
    );

    return response;
  },
});
