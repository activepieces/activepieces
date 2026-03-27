import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { granolaAuth } from '../../';
import {
  granolaApiCall,
  flattenNoteWithTranscript,
  GranolaNote,
} from '../common';

export const getNoteAction = createAction({
  auth: granolaAuth,
  name: 'get_note',
  displayName: 'Get Note',
  description: 'Retrieve a single meeting note by its ID, with optional transcript.',
  props: {
    note_id: Property.ShortText({
      displayName: 'Note ID',
      description:
        'The ID of the note to retrieve. Starts with `not_` followed by 14 characters (e.g. `not_1d3tmYTlCICgjy`). You can get this from the **List Notes** action.',
      required: true,
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description:
        'Include the full meeting transcript in the response. The transcript shows who said what and when.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};
    if (context.propsValue.include_transcript) {
      queryParams['include'] = 'transcript';
    }

    const response = await granolaApiCall<GranolaNote>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/notes/${context.propsValue.note_id}`,
      queryParams,
    });

    return flattenNoteWithTranscript(response.body);
  },
});
