import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { hesperanAuth } from '../auth';
import { hesperanApi } from '../common/client';
import { hesperanProps } from '../common/props';

export const askQuestion = createAction({
  auth: hesperanAuth,
  name: 'ask_question',
  classification: 'READ',
  displayName: 'Ask a Question',
  description:
    'Ask one typed question about a text or JSON state and get probabilities back: pick one option, check a yes/no statement, or rate on a scale. Hesperan returns numbers, never generated text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Answer one typed question about a state with probabilities: "choice" picks one of your options, "noul" gives the probability that a statement is true, "score" rates on your scale. Use for ad-hoc judgments without a calibrated profile; use "Decide with Profile" when a profile exists and you need an auto/review action. No side effects besides billing, so a retry is safe.',
    idempotent: true,
  },
  props: {
    state: hesperanProps.state(),
    send_as_json: hesperanProps.sendAsJson(),
    question_type: Property.StaticDropdown({
      displayName: 'Question Type',
      description: 'Choice picks one option, Yes / No checks a statement, Score rates on a scale you define.',
      required: true,
      defaultValue: 'choice',
      options: {
        disabled: false,
        options: [
          { label: 'Choice (pick one option)', value: 'choice' },
          { label: 'Yes / No (is a statement true?)', value: 'noul' },
          { label: 'Score (rate on a scale)', value: 'score' },
        ],
      },
    }),
    instructions: Property.LongText({
      displayName: 'Question',
      description:
        'For Choice and Score, the question, for example "Which team should handle this ticket?". For Yes / No, write a statement rather than a question, for example "This email is a phishing attempt."',
      required: true,
    }),
    criteria: Property.DynamicProperties({
      auth: hesperanAuth,
      displayName: 'Answers',
      required: true,
      refreshers: ['question_type'],
      props: async ({ question_type }): Promise<DynamicPropsValue> => {
        if (question_type === 'noul') {
          return {
            yes_means: Property.ShortText({
              displayName: 'Yes Means',
              description: 'Optional. What counts as yes, for example "it tries to obtain credentials or money under false pretences".',
              required: false,
            }),
            no_means: Property.ShortText({
              displayName: 'No Means',
              description: 'Optional. What counts as no, for example "it is a legitimate message".',
              required: false,
            }),
          };
        }
        if (question_type === 'score') {
          return {
            levels: Property.Array({
              displayName: 'Levels (lowest first)',
              description:
                'One description per level, lowest first, for example "no action needed", "handle this week", "handle today", "page someone now". At least two.',
              required: true,
            }),
          };
        }
        if (question_type === 'choice') {
          return {
            options: Property.Array({
              displayName: 'Options',
              description:
                'At least two mutually exclusive options. The key is returned as the answer (for example billing); the meaning is what Hesperan compares against the state (for example "charges, refunds, invoices").',
              required: true,
              properties: {
                key: Property.ShortText({
                  displayName: 'Key',
                  description: 'Short answer key without spaces, for example billing.',
                  required: true,
                }),
                meaning: Property.ShortText({
                  displayName: 'Meaning',
                  description: 'What this option means. Leave empty to use the key.',
                  required: false,
                }),
              },
            }),
          };
        }
        return {};
      },
    }),
  },
  async run(context) {
    const { state, send_as_json, question_type, instructions, criteria } = context.propsValue;
    const question = buildQuestion({ type: question_type, instructions, criteria });
    const response = await hesperanApi.post<SystemOneResponse>({
      apiKey: context.auth.secret_text,
      path: '/v1/systemone',
      body: {
        state: hesperanProps.toState({ state, sendAsJson: send_as_json }),
        questions: { [QUESTION_NAME]: question },
      },
    });
    const answer = response.body.answers[QUESTION_NAME];
    if (!answer) {
      throw new Error('Hesperan returned no answer for the question.');
    }
    return flattenAnswer({
      answer,
      model: response.body.model,
      inputTokens: response.body.usage.input_tokens,
    });
  },
});

function buildQuestion({
  type,
  instructions,
  criteria,
}: {
  type: string;
  instructions: string;
  criteria: DynamicPropsValue | undefined;
}): Question {
  const text = instructions.trim();
  if (!text) {
    throw new Error('Question must not be empty.');
  }
  const values = criteria ?? {};
  switch (type) {
    case 'choice':
      return { type: 'choice', instructions: text, criteria: choiceCriteria(values['options']) };
    case 'noul':
      return { type: 'noul', instructions: text, criteria: noulCriteria({ yes: values['yes_means'], no: values['no_means'] }) };
    case 'score':
      return { type: 'score', instructions: text, criteria: scoreCriteria(values['levels']) };
    default:
      throw new Error('Question Type must be Choice, Yes / No or Score.');
  }
}

function choiceCriteria(options: unknown): Record<string, string> {
  const rows = Array.isArray(options) ? options.filter(hesperanApi.isRecord) : [];
  const entries = rows
    .map((row) => ({ key: textOf(row['key']), meaning: textOf(row['meaning']) }))
    .filter((row) => row.key.length > 0);
  if (entries.length < 2) {
    throw new Error('Add at least two options, each with a key.');
  }
  const keys = entries.map((row) => row.key);
  if (keys.some((key) => /\s/.test(key))) {
    throw new Error('Option keys must not contain spaces, for example billing or wrong_item.');
  }
  if (new Set(keys).size !== keys.length) {
    throw new Error('Option keys must be unique.');
  }
  if (keys.length > MAX_OPTIONS) {
    throw new Error(`At most ${MAX_OPTIONS} options are allowed.`);
  }
  return Object.fromEntries(entries.map((row) => [row.key, row.meaning]));
}

function noulCriteria({ yes, no }: { yes: unknown; no: unknown }): { true?: string; false?: string } | undefined {
  const yesText = textOf(yes);
  const noText = textOf(no);
  if (!yesText && !noText) {
    return undefined;
  }
  return {
    ...(yesText ? { true: yesText } : {}),
    ...(noText ? { false: noText } : {}),
  };
}

function scoreCriteria(levels: unknown): string[] {
  const list = Array.isArray(levels) ? levels.map(textOf).filter((level) => level.length > 0) : [];
  if (list.length < 2) {
    throw new Error('Add at least two levels, lowest first.');
  }
  if (list.length > MAX_OPTIONS) {
    throw new Error(`At most ${MAX_OPTIONS} levels are allowed.`);
  }
  return list;
}

function textOf(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function round4(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}

function mostLikely(probabilities: Record<string, number>): string | null {
  const best = Object.entries(probabilities).reduce<[string, number] | null>(
    (acc, entry) => (acc === null || entry[1] > acc[1] ? entry : acc),
    null
  );
  return best ? best[0] : null;
}

function flattenAnswer({ answer, model, inputTokens }: { answer: Answer; model: string; inputTokens: number }) {
  switch (answer.type) {
    case 'choice':
      return {
        question_type: 'choice',
        answer: answer.choice,
        probability: answer.probabilities[answer.choice] ?? null,
        probabilities: answer.probabilities,
        model,
        input_tokens: inputTokens,
      };
    case 'noul':
      return {
        question_type: 'yes_no',
        answer: answer.noul >= 0.5 ? 'yes' : 'no',
        probability_yes: answer.noul,
        probability_no: round4(1 - answer.noul),
        model,
        input_tokens: inputTokens,
      };
    case 'score':
      return {
        question_type: 'score',
        score: answer.score,
        most_likely_level: mostLikely(answer.probabilities),
        probabilities: answer.probabilities,
        model,
        input_tokens: inputTokens,
      };
  }
}

const QUESTION_NAME = 'answer';
const MAX_OPTIONS = 255;

type Question =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'noul'; instructions: string; criteria?: { true?: string; false?: string } }
  | { type: 'score'; instructions: string; criteria: string[] };

type Answer =
  | { type: 'choice'; choice: string; probabilities: Record<string, number> }
  | { type: 'noul'; noul: number }
  | { type: 'score'; score: number; probabilities: Record<string, number> };

type SystemOneResponse = {
  model: string;
  answers: Record<string, Answer | undefined>;
  usage: { input_tokens: number };
  timing_ms: number;
};
