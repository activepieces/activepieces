import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { sendPollActionOutputSchema } from '../output-schemas';

export const telegramSendPollAction = createAction({
  auth: telegramBotAuth,
  name: 'send_poll',
  classification: 'WRITE',
  displayName: 'Send Poll',
  description: 'Send a poll or a quiz to a chat.',
  audience: 'human',
  aiMetadata: { description: 'Posts a native Telegram poll (regular or quiz) to a chat with 2–10 answer options. Use to collect votes or run a quiz; quiz polls require a correct_option_id and cannot allow multiple answers, and open_period and close_date are mutually exclusive. Not idempotent: each call creates a new poll.', idempotent: false },
  propertyGroups: [
    { key: 'send_to', display: 'section', label: 'Send to', icon: 'send', props: ['instructions', 'chat_id'] },
    {
      key: 'poll',
      display: 'section',
      label: 'Poll',
      icon: 'text',
      props: ['question', 'options', 'type', 'is_anonymous', 'allows_multiple_answers'],
    },
    {
      key: 'quiz',
      display: 'section',
      label: 'Quiz',
      icon: 'tag',
      props: ['quiz_info', 'correct_option_id', 'explanation', 'explanation_parse_mode'],
    },
    {
      key: 'closing',
      display: 'section',
      label: 'Closing',
      icon: 'calendar',
      props: ['closing_info', 'open_period', 'close_date', 'is_closed'],
    },
  ],
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    question: Property.ShortText({
      displayName: 'Question',
      description: 'Up to 300 characters.',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: '2 to 10 answers, each up to 100 characters.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Poll Type',
      required: false,
      display: 'cards',
      options: {
        options: [
          { label: 'Regular', value: 'regular', description: 'Voters pick any answer' },
          { label: 'Quiz', value: 'quiz', description: 'One answer is correct' },
        ],
      },
      defaultValue: 'regular',
    }),
    is_anonymous: Property.Checkbox({
      displayName: 'Anonymous',
      description: 'Hide who voted for what.',
      required: false,
      defaultValue: true,
    }),
    allows_multiple_answers: Property.Checkbox({
      displayName: 'Allow Multiple Answers',
      description: 'Regular polls only.',
      required: false,
      defaultValue: false,
    }),
    quiz_info: Property.MarkDown({
      value: 'Only used when Poll Type is Quiz.',
      variant: MarkdownVariant.INFO,
    }),
    correct_option_id: Property.Number({
      displayName: 'Correct Option',
      description: 'Position of the right answer, counting from 0.',
      required: false,
    }),
    explanation: Property.LongText({
      displayName: 'Explanation',
      description: 'Shown after a wrong answer, up to 200 characters.',
      required: false,
    }),
    explanation_parse_mode: telegramCommons.form.parseModeProp({
      displayName: 'Explanation Format',
      description: 'How Telegram styles the explanation.',
    }),
    closing_info: Property.MarkDown({
      value: 'Set an open period or a close date, not both.',
      variant: MarkdownVariant.INFO,
    }),
    open_period: Property.Number({
      displayName: 'Open Period',
      description: 'Seconds the poll stays open, 5 to 600.',
      required: false,
      width: 'half',
    }),
    close_date: Property.DateTime({
      displayName: 'Close Date',
      description: 'When the poll closes, 5 to 600 seconds from now.',
      required: false,
      width: 'half',
    }),
    is_closed: Property.Checkbox({
      displayName: 'Closed',
      description: 'Post the poll already closed, to show results.',
      required: false,
      defaultValue: false,
    }),
    message_thread_id: telegramCommons.form.messageThreadIdProp(),
    disable_notification: telegramCommons.form.disableNotificationProp(),
    protect_content: telegramCommons.form.protectContentProp(),
    reply_to_message_id: telegramCommons.form.replyToMessageIdProp(),
    reply_markup: telegramCommons.form.replyMarkupProp(),
  },
  outputSchema: sendPollActionOutputSchema,
  async run(ctx) {
    const options = (ctx.propsValue.options ?? []).map((option) => String(option));
    if (options.length < 2 || options.length > 10) {
      throw new Error('A poll requires between 2 and 10 options.');
    }
    const pollType = ctx.propsValue.type ?? 'regular';
    const correctOptionId = ctx.propsValue.correct_option_id;
    if (pollType === 'quiz') {
      if (correctOptionId === undefined || correctOptionId === null) {
        throw new Error('Quiz polls require "Correct Option".');
      }
      if (correctOptionId < 0 || correctOptionId >= options.length) {
        throw new Error(
          `"Correct Option" must be between 0 and ${options.length - 1} (the index of an option).`
        );
      }
      if (ctx.propsValue.allows_multiple_answers) {
        throw new Error('Quiz polls cannot allow multiple answers.');
      }
    } else if (correctOptionId !== undefined && correctOptionId !== null) {
      throw new Error('"Correct Option" is only valid for quiz polls. Set "Poll Type" to Quiz or clear this field.');
    }
    if (ctx.propsValue.open_period && ctx.propsValue.close_date) {
      throw new Error('"Open Period" and "Close Date" are mutually exclusive — set at most one.');
    }
    const explanationParseMode = telegramCommons.resolveParseMode(
      ctx.propsValue.explanation_parse_mode
    );

    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendPoll'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        question: ctx.propsValue.question,
        options,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        is_anonymous: ctx.propsValue.is_anonymous ?? true,
        type: ctx.propsValue.type ?? 'regular',
        allows_multiple_answers: ctx.propsValue.allows_multiple_answers ?? false,
        correct_option_id: ctx.propsValue.correct_option_id ?? undefined,
        explanation: ctx.propsValue.explanation ?? undefined,
        explanation_parse_mode: explanationParseMode,
        open_period: ctx.propsValue.open_period ?? undefined,
        close_date: ctx.propsValue.close_date
          ? Math.floor(new Date(ctx.propsValue.close_date).getTime() / 1000)
          : undefined,
        is_closed: ctx.propsValue.is_closed ?? false,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
        reply_to_message_id: ctx.propsValue.reply_to_message_id ?? undefined,
        reply_markup: ctx.propsValue.reply_markup ?? undefined,
      },
    });
  },
});
