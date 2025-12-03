import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { griptapeAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  assistantIdDropdown,
  knowledgeBaseIdsDropdown,
  rulesetIdsDropdown,
  structuresIdsDropdown,
  threadIdsDropdown,
  toolsIdsDropdown,
} from '../common/props';

export const createAssistantRun = createAction({
  auth: griptapeAuth,
  name: 'createAssistantRun',
  displayName: 'Create Assistant Run',
  description:
    'Create a run for an assistant with optional additional resources',
  props: {
    assistant_id: assistantIdDropdown,
    input: Property.LongText({
      displayName: 'Input',
      description: 'Input to provide to the assistant',
      required: true,
    }),
    knowledgeBaseIds: knowledgeBaseIdsDropdown,
    rulesets: rulesetIdsDropdown,
    structures: structuresIdsDropdown,
    tools: toolsIdsDropdown,
    thread: threadIdsDropdown,
    create_new_thread: Property.Checkbox({
      displayName: 'Create New Thread',
      description: 'Create a new thread for this run',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      assistant_id,
      input,
      knowledgeBaseIds,
      rulesets,
      structures,
      tools,
      thread,
      create_new_thread,
    } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      input,
    };

    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      requestBody['additional_knowledge_base_ids'] = knowledgeBaseIds;
    }

    if (rulesets && rulesets.length > 0) {
      requestBody['additional_ruleset_ids'] = rulesets;
    }

    if (structures && structures.length > 0) {
      requestBody['additional_structure_ids'] = structures;
    }

    if (tools && tools.length > 0) {
      requestBody['additional_tool_ids'] = tools;
    }

    requestBody['create_new_thread'] = create_new_thread;

    if (thread && thread.length > 0) {
      requestBody['thread_id'] = Array.isArray(thread) ? thread[0] : thread;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/assistants/${assistant_id}/runs`,
      requestBody
    );

    const assistantRunId = response.assistant_run_id;

    let runStatus = response.status;
    let runData = response;

    while (runStatus !== 'SUCCEEDED') {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      runData = await makeRequest(
        context.auth.secret_text,
        HttpMethod.GET,
        `/assistant-runs/${assistantRunId}`
      );

      runStatus = runData.status;
    }

    return runData;
  },
});
