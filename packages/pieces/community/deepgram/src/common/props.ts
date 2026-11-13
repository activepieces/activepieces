import { Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from './auth';
import { deepgramModels } from './models';
import { deepgramProjects } from './projects';

function sttModel({ description }: { description?: string } = {}) {
  return Property.Dropdown({
    auth: deepgramAuth,
    displayName: 'Model',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Enter your API key first',
          options: [],
        };
      }
      try {
        const options = await deepgramModels.fetchSttModelOptions({
          apiKey: auth.secret_text,
        });
        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: "Couldn't load models, check your API key or try again.",
        };
      }
    },
  });
}

function ttsVoice({ description }: { description?: string } = {}) {
  return Property.Dropdown({
    auth: deepgramAuth,
    displayName: 'Voice',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Enter your API key first',
          options: [],
        };
      }
      try {
        const options = await deepgramModels.fetchTtsModelOptions({
          apiKey: auth.secret_text,
        });
        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: "Couldn't load voices, check your API key or try again.",
        };
      }
    },
  });
}

function project() {
  return Property.Dropdown({
    auth: deepgramAuth,
    displayName: 'Project',
    description:
      'The Deepgram project to use. Leave empty when your API key belongs to a single project.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Enter your API key first',
          options: [],
        };
      }
      try {
        const projects = await deepgramProjects.listProjects({
          apiKey: auth.secret_text,
        });
        if (projects.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This API key has no projects.',
          };
        }
        return {
          disabled: false,
          options: projects.map((item) => ({
            label: item.name,
            value: item.project_id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            "Couldn't load projects, check your API key or try again.",
        };
      }
    },
  });
}

function projectId() {
  return Property.ShortText({
    displayName: 'Project ID',
    description:
      'The Deepgram project ID, from List Projects (list_projects). Leave empty when the API key belongs to a single project.',
    required: false,
  });
}

export const deepgramProps = { sttModel, ttsVoice, project, projectId };
