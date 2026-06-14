import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from '../common/client';
import { sliteProps } from '../common/props';
import { SliteAskResponse } from '../common/types';

export const sliteAskQuestionAction = createAction({
  auth: sliteAuth,
  name: 'ask_question',
  displayName: 'Ask Question',
  description:
    'Asks a question in natural language and returns an answer drawn from your Slite docs, with sources.',
  audience: 'both',
  aiMetadata: {
    description:
      "Runs Slite's AskX over the workspace knowledge base, returning a natural-language answer synthesized from indexed docs along with the source docs it drew from. Choose this for question-answering or retrieval over team docs rather than keyword lookup; optionally scope the answer to docs nested under a given parent doc id. Read-only and idempotent: repeating the same question produces the same answer for the current index state.",
    idempotent: true,
  },
  props: {
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask your Slite knowledge base.',
      required: true,
    }),
    parent_note_id: sliteProps.noteId({
      required: false,
      displayName: 'Parent Doc',
      description: 'Limit the answer to docs nested under this parent.',
    }),
  },
  async run(context) {
    const { question, parent_note_id } = context.propsValue;
    const response = await sliteApi.call<SliteAskResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/ask',
      query: {
        question,
        parentNoteId: parent_note_id,
      },
    });
    return response;
  },
});
