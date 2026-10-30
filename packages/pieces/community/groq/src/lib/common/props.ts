import {
  DropdownState,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { groqAuth } from '../auth';
import { groqApi } from './api';

function chatModel<R extends boolean>({
  required,
  displayName = 'Model',
  description = 'Speech models are left out; use the audio actions for them.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: groqAuth,
    displayName,
    required,
    description,
    refreshers: [],
    defaultValue: 'llama-3.1-70b-versatile',
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your Groq account first.',
        });
      }
      const { data: models, error } = await tryCatch(async () => {
        const allModels = await groqApi.listModels({ auth });
        return allModels.data.filter(
          (model) => !model.id.toLowerCase().includes('whisper')
        );
      });
      if (error) {
        return disabledOptions({
          placeholder: "Couldn't load models. Check your API key or try again.",
        });
      }
      return {
        disabled: false,
        options: models.map((model) => ({ label: model.id, value: model.id })),
      };
    },
  });
}

function whisperModel<R extends boolean>({
  required,
  displayName = 'Model',
  description = 'whisper-large-v3 is the most accurate; turbo is faster.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: groqAuth,
    displayName,
    required,
    description,
    refreshers: [],
    defaultValue: 'whisper-large-v3',
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your Groq account first.',
        });
      }
      const { data: models, error } = await tryCatch(async () => {
        const allModels = await groqApi.listModels({ auth });
        return allModels.data.filter((model) =>
          model.id.toLowerCase().includes('whisper')
        );
      });
      if (error) {
        return disabledOptions({
          placeholder: "Couldn't load models. Check your API key or try again.",
        });
      }
      return {
        disabled: false,
        options: models.map((model) => ({ label: model.id, value: model.id })),
      };
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const groqProps = { chatModel, whisperModel };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
