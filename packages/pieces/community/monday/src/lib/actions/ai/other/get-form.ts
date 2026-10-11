import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { getFormActionOutputSchema } from '../../../output-schemas';

export const getFormAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_form',
  classification: 'READ',
  displayName: 'Get Form',
  description: 'Gets a monday.com WorkForm and its questions by form token.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch a monday.com WorkForm\'s metadata and questions (ID, title, type, required, visible) by its form token, the string after /forms/ in the form URL. Use to learn what a form asks before interpreting its board items. Requires access to the form\'s board. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getFormActionOutputSchema,
  props: {
    form_token: Property.ShortText({
      displayName: 'Form Token',
      description: 'The token after "/forms/" and before "?" in the form\'s share URL.',
      required: true,
    }),
  },
  async run(context) {
    const token = extractToken(context.propsValue.form_token);

    const data = await makeClient(context.auth).query<{ form: MondayForm | null }>({
      query: `query ($formToken: String!) {
        form(formToken: $formToken) {
          id
          title
          description
          active
          isAnonymous
          ownerId
          questions { id title type required visible }
        }
      }`,
      variables: { formToken: token },
    });

    const form = data.form;
    if (!form) {
      throw new Error('Form not found or not accessible with this token.');
    }

    return {
      id: String(form.id),
      title: form.title,
      description: form.description ?? null,
      active: form.active,
      is_anonymous: form.isAnonymous,
      owner_id: form.ownerId === null || form.ownerId === undefined ? null : String(form.ownerId),
      question_count: (form.questions ?? []).length,
      questions: (form.questions ?? []).map((q) => ({
        id: q.id,
        title: q.title ?? null,
        type: q.type ?? null,
        required: q.required ?? null,
        visible: q.visible ?? null,
      })),
    };
  },
});

function extractToken(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/\/forms\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

type MondayForm = {
  id: number | string;
  title: string;
  description: string | null;
  active: boolean;
  isAnonymous: boolean;
  ownerId: number | null;
  questions: { id: string; title: string | null; type: string | null; required: boolean | null; visible: boolean | null }[] | null;
};
