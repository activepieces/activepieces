import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type GreenhouseNote = {
  id: number;
  created_at: string;
  updated_at: string;
  candidate_id: number | null;
  application_id: number | null;
  body: string | null;
  subject: string | null;
  type: string;
  user_id: number | null;
  visibility: string | null;
};

export const createCandidateNoteAction = createAction({
  name: 'create_candidate_note',
  displayName: 'Create Candidate Note',
  description: 'Adds a note to an existing candidate profile in Greenhouse.',
  auth: greenhouseAuth,
  props: {
    candidate_id: Property.ShortText({
      displayName: 'Candidate ID',
      description:
        'The numeric ID of the candidate to add the note to. Found in the candidate URL in Greenhouse ' +
        '(e.g. `https://app.greenhouse.io/people/**123456**`), or mapped from a previous **Create Candidate** step.',
      required: true,
    }),
    note_type: Property.StaticDropdown({
      displayName: 'Note Type',
      description: 'The type of note to create.',
      required: true,
      defaultValue: 'NOTE',
      options: {
        options: [
          { label: 'Note', value: 'NOTE' },
          { label: 'Activity', value: 'ACTIVITY' },
        ],
      },
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
    user_id: Property.ShortText({
      displayName: 'Author User ID',
      description:
        'Optional. The Greenhouse user ID to attribute this note to. ' +
        'To find it: go to **Configure → Users**, click a user, and copy the number from the URL ' +
        '(e.g. `https://app.greenhouse.io/people/**12345**`).',
      required: false,
    }),
  },
  async run(context) {
    const { candidate_id, note_type, body, visibility, user_id } = context.propsValue;

    const noteBody: Record<string, unknown> = {
      candidate_id: Number(candidate_id),
      note_type,
      body,
      visibility,
    };

    if (user_id) noteBody['user_id'] = Number(user_id);

    const response = await greenhouseApiCall<GreenhouseNote>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      endpoint: '/notes',
      body: noteBody,
    });

    const note = response.body;
    return {
      id: note.id,
      candidate_id: note.candidate_id,
      application_id: note.application_id,
      body: note.body,
      subject: note.subject,
      type: note.type,
      visibility: note.visibility,
      created_at: note.created_at,
      updated_at: note.updated_at,
      user_id: note.user_id,
    };
  },
});
