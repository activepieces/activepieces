import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendPollAction = createAction({
  auth: telegramBotAuth,
  name: 'send_poll',
  displayName: 'Send Poll',
  description: 'Send a native Telegram poll (regular or quiz) to a chat',
  audience: 'both',
  aiMetadata: { description: 'Posts a native Telegram poll (regular or quiz) to a chat with 2–10 answer options. Use to collect votes or run a quiz; quiz polls require a correct_option_id and cannot allow multiple answers, and open_period and close_date are mutually exclusive. Not idempotent: each call creates a new poll.', idempotent: false },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    question: Property.ShortText({
      displayName: 'Question',
      description: 'Poll question, 1–300 characters.',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'List of answer options (2–10 options, each 1–100 characters).',
      required: true,
    }),
    is_anonymous: Property.Checkbox({
      displayName: 'Anonymous',
      description: 'True, if the poll needs to be anonymous. Default true.',
      required: false,
      defaultValue: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Poll Type',
      description: 'Poll type. Defaults to "regular".',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Quiz', value: 'quiz' },
        ],
      },
      defaultValue: 'regular',
    }),
    allows_multiple_answers: Property.Checkbox({
      displayName: 'Allow Multiple Answers',
      description: 'True if the poll allows multiple answers (regular polls only).',
      required: false,
      defaultValue: false,
    }),
    correct_option_id: Property.Number({
      displayName: 'Correct Option Id (Quiz)',
      description: '0-based index of the correct answer option (required for quizzes).',
      required: false,
    }),
    explanation: Property.LongText({
      displayName: 'Explanation (Quiz)',
      description: 'Explanation shown when a user picks an incorrect answer (0–200 chars).',
      required: false,
    }),
    explanation_parse_mode: telegramCommons.parseModeProp(),
    open_period: Property.Number({
      displayName: 'Open Period (seconds)',
      description: 'Amount of time in seconds the poll will be active (5–600).',
      required: false,
    }),
    close_date: Property.DateTime({
      displayName: 'Close Date',
      description: 'Point in time when the poll will be automatically closed.',
      required: false,
    }),
    is_closed: Property.Checkbox({
      displayName: 'Closed',
      description: 'Pass True if the poll should be immediately closed. Useful for previews.',
      required: false,
      defaultValue: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    const options = (ctx.propsValue.options ?? []).map((option) => String(option));
    if (options.length < 2 || options.length > 10) {
      throw new Error('A poll requires between 2 and 10 options.');
    }
    const pollType = ctx.propsValue.type ?? 'regular';
    const correctOptionId = ctx.propsValue.correct_option_id;
    if (pollType === 'quiz') {
      if (correctOptionId === undefined || correctOptionId === null) {
        throw new Error('Quiz polls require "Correct Option Id".');
      }
      if (correctOptionId < 0 || correctOptionId >= options.length) {
        throw new Error(
          `"Correct Option Id" must be between 0 and ${options.length - 1} (the index of an option).`
        );
      }
      if (ctx.propsValue.allows_multiple_answers) {
        throw new Error('Quiz polls cannot allow multiple answers.');
      }
    } else if (correctOptionId !== undefined && correctOptionId !== null) {
      throw new Error('"Correct Option Id" is only valid for quiz polls. Set "Poll Type" to Quiz or clear this field.');
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
