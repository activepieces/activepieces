import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, onBehalfOfProp } from '../common';

type GreenhouseNote = {
  id: number;
  created_at: string;
  body: string;
  visibility: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
};

export const createCandidateNoteAction = createAction({
  name: 'create_candidate_note',
  displayName: 'Create Candidate Note',
  description: 'Adds a note to an existing candidate profile in Greenhouse.',
  auth: greenhouseAuth,
  props: {
    on_behalf_of: onBehalfOfProp,
    candidate_id: Property.ShortText({
      displayName: 'Candidate ID',
      description:
        'The numeric ID of the candidate to add the note to. You can find this in the candidate URL in Greenhouse ' +
        '(e.g. `https://app.greenhouse.io/people/**123456**`), or map it from a previous **Create Candidate** step.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Note',
      description: 'The content of the note.',
      required: true,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Who can see this note. **Admin Only** — only admins; **Private** — only the author; **Public** — all Greenhouse users.',
      required: true,
      defaultValue: 'public',
      options: {
        options: [
          { label: 'Public (all users)', value: 'public' },
          { label: 'Private (author only)', value: 'private' },
          { label: 'Admin Only', value: 'admin_only' },
        ],
      },
    }),
  },
  async run(context) {
    const { on_behalf_of, candidate_id, body, visibility } = context.propsValue;

    const response = await greenhouseApiCall<GreenhouseNote>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/candidates/${candidate_id}/activity_feed/notes`,
      body: {
        user_id: Number(on_behalf_of),
        body,
        visibility,
      },
      onBehalfOf: on_behalf_of,
    });

    const note = response.body;
    return {
      id: note.id,
      candidate_id,
      body: note.body,
      visibility: note.visibility,
      created_at: note.created_at,
      created_by_user_id: note.user?.id ?? null,
      created_by_first_name: note.user?.first_name ?? null,
      created_by_last_name: note.user?.last_name ?? null,
    };
  },
});
