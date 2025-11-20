import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const assistantIdDropdown = Property.Dropdown({
  displayName: 'Assistant',
  description: 'Select the assistant',
  required: true,
  refreshers: [],
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
        auth as string,
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
        auth as string,
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
        auth as string,
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
        auth as string,
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
        auth as string,
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
        auth as string,
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
        auth as string,
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