import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { griptapeAuth } from './auth';

export const assistantIdDropdown = Property.Dropdown({
  displayName: 'Assistant',
  description: 'Select the assistant',
  required: true,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/assistants'
      );
      return {
        disabled: false,
        options: response.assistants.map((assistant: any) => ({
          label: assistant.name,
          value: assistant.assistant_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch assistants',
      };
    }
  },
});

export const knowledgeBaseIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Knowledge Bases',
  description: 'Select knowledge bases to use',
  required: false,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/knowledge-bases'
      );
      return {
        disabled: false,
        options: response.knowledge_bases.map((kb: any) => ({
          label: kb.name,
          value: kb.knowledge_base_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch knowledge bases',
      };
    }
  },
});

export const rulesetIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Rulesets',
  description: 'Select rulesets to apply',
  required: false,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/rulesets'
      );
      return {
        disabled: false,
        options: response.rulesets.map((rs: any) => ({
          label: rs.name,
          value: rs.ruleset_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch rulesets',
      };
    }
  },
});

export const structuresIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Structures',
  description: 'Select structures to use',
  required: false,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/structures'
      );
      return {
        disabled: false,
        options: response.structures.map((structure: any) => ({
          label: structure.name,
          value: structure.structure_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch structures',
      };
    }
  },
});

export const toolsIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Tools',
  description: 'Select tools to use',
  required: false,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/tools'
      );
      return {
        disabled: false,
        options: response.tools.map((tool: any) => ({
          label: tool.name,
          value: tool.tool_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch tools',
      };
    }
  },
});

export const threadIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Thread',
  description: 'Select the thread',
  required: false,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/threads`
      );
      return {
        disabled: false,
        options: response.threads.map((thread: any) => ({
          label: thread.name,
          value: thread.thread_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch threads',
      };
    }
  },
});

export const structureIdDropdown = Property.Dropdown({
  displayName: 'Structure',
  description: 'Select the structure',
  required: true,
  refreshers: [],
  auth: griptapeAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/structures`
      );
      return {
        disabled: false,
        options: response.structures.map((structure: any) => ({
          label: structure.name,
          value: structure.structure_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch structures',
      };
    }
  },
});

export const assistantRunsDropdown = Property.Dropdown({
  displayName: 'Assistant Run',
  description: 'Select the assistant run',
  required: true,
  refreshers: ['assistant_id'],
  auth: griptapeAuth,
  options: async ({ auth, assistant_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    if (!assistant_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select an assistant first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/assistants/${assistant_id}/runs`
      );
      return {
        disabled: false,
        options: response.assistant_runs.map((run: any) => ({
          label: `${run.assistant_run_id} - ${run.status}`,
          value: run.assistant_run_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch assistant runs',
      };
    }
  },
});

export const structureRunsDropdown = Property.Dropdown({
  displayName: 'Structure Run',
  description: 'Select the structure run',
  required: true,
  refreshers: ['structure_id'],
  auth: griptapeAuth,
      options: async ({ auth, structure_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    if (!structure_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a structure first',
      };
    }

    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/structures/${structure_id}/runs`
      );
      return {
        disabled: false,
        options: response.runs.map((run: any) => ({
          label: `${run.structure_run_id} - ${run.status}`,
          value: run.structure_run_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch structure runs',
      };
    }
  },
});
