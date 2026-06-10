import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callFormsApi, googleFormsAuth, googleFormsCommon } from '../common/common';

const QUESTION_TYPES = {
  SHORT_ANSWER: 'Short Answer',
  PARAGRAPH: 'Paragraph',
  MULTIPLE_CHOICE: 'Multiple Choice',
  CHECKBOXES: 'Checkboxes',
  DROPDOWN: 'Dropdown',
} as const;

export const addQuestionAction = createAction({
  auth: googleFormsAuth,
  name: 'add_question',
  displayName: 'Add Question',
  description: 'Appends a new question to a form.',
  props: {
    include_team_drives: googleFormsCommon.include_team_drives,
    form_id: googleFormsCommon.form_id,
    title: Property.ShortText({
      displayName: 'Question Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional. Help text shown under the question title.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Question Type',
      required: true,
      defaultValue: 'SHORT_ANSWER',
      options: {
        disabled: false,
        options: [
          { label: QUESTION_TYPES.SHORT_ANSWER, value: 'SHORT_ANSWER' },
          { label: QUESTION_TYPES.PARAGRAPH, value: 'PARAGRAPH' },
          { label: QUESTION_TYPES.MULTIPLE_CHOICE, value: 'MULTIPLE_CHOICE' },
          { label: QUESTION_TYPES.CHECKBOXES, value: 'CHECKBOXES' },
          { label: QUESTION_TYPES.DROPDOWN, value: 'DROPDOWN' },
        ],
      },
    }),
    required: Property.Checkbox({
      displayName: 'Required',
      defaultValue: false,
      required: false,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'Required for Multiple Choice, Checkboxes, and Dropdown. Ignored for text types.',
      required: false,
    }),
    index: Property.Number({
      displayName: 'Position',
      description: 'Optional. 0-based position to insert the question at. Defaults to the end of the form.',
      required: false,
    }),
  },
  async run(context) {
    const { form_id, title, description, type, required, options, index } = context.propsValue;

    const choiceQuestion = buildChoiceQuestion({ type, options });
    const question = {
      required: required ?? false,
      ...(choiceQuestion ? { choiceQuestion } : { textQuestion: { paragraph: type === 'PARAGRAPH' } }),
    };

    const insertIndex = typeof index === 'number' && index >= 0 ? index : await getNextItemIndex(context.auth, form_id);

    const body = {
      requests: [
        {
          createItem: {
            item: {
              title,
              ...(description && description.length > 0 ? { description } : {}),
              questionItem: { question },
            },
            location: { index: insertIndex },
          },
        },
      ],
    };

    return await callFormsApi({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/forms/${form_id}:batchUpdate`,
      body,
    });
  },
});

function buildChoiceQuestion({
  type,
  options,
}: {
  type: string;
  options: unknown;
}): { type: string; options: { value: string }[] } | null {
  const isChoice = type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN';
  if (!isChoice) {
    return null;
  }
  const optionList = Array.isArray(options) ? options : [];
  const normalized = optionList
    .map((opt) => (typeof opt === 'string' ? opt : typeof opt === 'number' ? String(opt) : ''))
    .filter((opt) => opt.length > 0)
    .map((value) => ({ value }));
  if (normalized.length === 0) {
    throw new Error(`At least one option is required for question type ${type}.`);
  }
  const apiType = type === 'CHECKBOXES' ? 'CHECKBOX' : type === 'DROPDOWN' ? 'DROP_DOWN' : 'RADIO';
  return { type: apiType, options: normalized };
}

async function getNextItemIndex(auth: Parameters<typeof callFormsApi>[0]['auth'], formId: string): Promise<number> {
  const form = await callFormsApi<{ items?: unknown[] }>({
    auth,
    method: HttpMethod.GET,
    path: `/forms/${formId}`,
  });
  return Array.isArray(form.items) ? form.items.length : 0;
}
