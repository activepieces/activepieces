import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';

export const createTask = createAction({
  auth: lokaliseAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new task in your Lokalise project',
  props: {
    projectId: projectDropdown,
    taskTitle: Property.ShortText({
      displayName: 'Task Title',
      description: 'Title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Brief task description. Used as instructions for AI in automatic_translation and lqa_by_ai task types',
      required: false,
    }),
    taskType: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Type of the task',
      required: false,
      options: {
        options: [
          { label: 'Translation', value: 'translation' },
          { label: 'Automatic Translation', value: 'automatic_translation' },
          { label: 'LQA by AI', value: 'lqa_by_ai' },
          { label: 'Review', value: 'review' },
        ],
      },
    }),
    keys: Property.Array({
      displayName: 'Key',
      description:
        'Comma-separated list of key IDs to include in the task (required unless parent_task_id is specified)',
      required: false,
    }),
    languages: Property.Array({
      displayName: 'Languages',
      description:
        'Comma-separated language ISO codes for the task (e.g., "fr,de,es")',
      required: false,
      properties: {
        languageIso: Property.ShortText({
          displayName: 'Language ISO',
          description: 'Language ISO code (e.g., "fr", "de")',
          required: true,
        }),
      },
    }),
    sourceLanguageIso: Property.ShortText({
      displayName: 'Source Language ISO',
      description: 'Source language code for the task',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description:
        'Due date in format: Y-m-d H:i:s (e.g., "2024-12-31 23:59:59")',
      required: false,
    }),
    autoCloseLanguages: Property.Checkbox({
      displayName: 'Auto Close Languages',
      description:
        'Whether languages should be closed automatically upon completion. Default is true',
      required: false,
      defaultValue: true,
    }),
    autoCloseTask: Property.Checkbox({
      displayName: 'Auto Close Task',
      description:
        'Whether the task should be automatically closed upon all language completion. Default is true',
      required: false,
      defaultValue: true,
    }),
    closingTags: Property.Array({
      displayName: 'Closing Tags',
      description:
        'Comma-separated tags to be added to keys when task is closed',
      required: false,
    }),
    doLockTranslations: Property.Checkbox({
      displayName: 'Lock Translations',
      description:
        'If set to true, will lock translations for non-assigned project members',
      required: false,
      defaultValue: false,
    }),
    markVerified: Property.Checkbox({
      displayName: 'Mark Verified',
      description:
        'Mark translations as verified. Only for automatic_translation tasks. Default is true',
      required: false,
      defaultValue: true,
    }),
    saveAiTranslationToTm: Property.Checkbox({
      displayName: 'Save AI Translation to TM',
      description:
        'Save AI translations to Translation Memory. Only for automatic_translation tasks',
      required: false,
      defaultValue: false,
    }),
    applyAiTm100Matches: Property.Checkbox({
      displayName: 'Apply AI TM 100% Matches',
      description:
        'Apply 100% translation memory matches. Only for automatic_translation tasks',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      taskTitle,
      description,
      taskType,
      keys,
      languages,
      sourceLanguageIso,
      dueDate,
      autoCloseLanguages,
      autoCloseTask,
      closingTags,
      doLockTranslations,
      markVerified,
      saveAiTranslationToTm,
      applyAiTm100Matches,
    } = context.propsValue;

    const body: any = {
      title: taskTitle,
      ...(description && { description }),
      ...(taskType && { task_type: taskType }),
      ...(keys && { keys }),
      ...(languages && { languages }),
      ...(sourceLanguageIso && { source_language_iso: sourceLanguageIso }),
      ...(dueDate && { due_date: dueDate }),
      ...(autoCloseLanguages !== undefined && {
        auto_close_languages: autoCloseLanguages,
      }),
      ...(autoCloseTask !== undefined && {
        auto_close_task: autoCloseTask,
      }),
      ...(closingTags && { closing_tags: closingTags }),
      ...(doLockTranslations && { do_lock_translations: true }),
      ...(markVerified !== undefined && { mark_verified: markVerified }),
      ...(saveAiTranslationToTm && {
        save_ai_translation_to_tm: true,
      }),
      ...(applyAiTm100Matches && {
        apply_ai_tm100_matches: true,
      }),
    };

    const path = `/projects/${projectId}/tasks`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      path,
      body
    );

    return response;
  },
});
