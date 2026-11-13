import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../common/ai-props';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { retellOptions } from '../common/options';
import { retellMap } from '../common/mappers';
import { retellSchemas } from '../common/schemas';
export const createBatchCallAction = createAction({
  auth: retellAiAuth,
  name: 'create_batch_call',
  classification: 'WRITE',
  displayName: 'Create Batch Call',
  description: 'Schedules outbound calls to a list of numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Schedules one outbound call per listed number from a Retell number, now or at a set time (mass dialing, billed per minute per call). Use Create Phone Call for a single call. Each run creates a new batch and dials everyone again; only use with numbers that agreed to be called.',
    idempotent: false,
  },
  props: {
    from_number: retellAiProps.e164Number({ displayName: 'From Number', description: 'A number bought from or imported to Retell.' }),
    tasks: Property.Array({
      displayName: 'Calls',
      description: `One entry per person to call, at most ${retellOptions.MAX_BATCH_TASKS}.`,
      required: true,
      properties: {
        to_number: Property.ShortText({ displayName: 'To Number', description: 'E.164 number to call.', required: true }),
        dynamic_variables: Property.Json({
          displayName: 'Dynamic Variables',
          description: 'Optional JSON object of prompt variables for this call.',
          required: false,
        }),
        metadata: Property.Json({ displayName: 'Metadata', description: 'Optional JSON object stored with this call.', required: false }),
      },
    }),
    name: Property.ShortText({ displayName: 'Batch Name', description: 'Optional name for your reference.', required: false }),
    agent_id: retellAiProps.id({
      displayName: 'Agent ID',
      description: 'Optional voice agent ID for every call. Empty = the outbound agent bound to From Number.',
      required: false,
    }),
    scheduled_time: Property.ShortText({
      displayName: 'Scheduled Time',
      description: 'Optional ISO date or Unix time to start. Empty = start now.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.batchCall,
  async run({ auth, propsValue }) {
    const entries = Array.isArray(propsValue.tasks) ? propsValue.tasks : [];
    if (entries.length === 0) {
      throw new Error('Add at least one call.');
    }
    if (entries.length > retellOptions.MAX_BATCH_TASKS) {
      throw new Error(`A batch can hold at most ${retellOptions.MAX_BATCH_TASKS} calls; split the list.`);
    }
    const agentId = retellInput.optionalText(propsValue.agent_id);
    const tasks = entries.map((entry, index) => {
      const record = retellMap.rec(entry);
      const label = `Call ${index + 1}`;
      const task: Record<string, unknown> = {
        to_number: retellInput.e164({ value: record['to_number'], label: `${label} To Number` }),
      };
      const variables = retellInput.stringMap({ value: record['dynamic_variables'], label: `${label} Dynamic Variables` });
      if (variables !== undefined) {
        task['retell_llm_dynamic_variables'] = variables;
      }
      const metadata = retellInput.objectValue({ value: record['metadata'], label: `${label} Metadata` });
      if (metadata !== undefined) {
        task['metadata'] = metadata;
      }
      if (agentId !== undefined) {
        task['override_agent_id'] = agentId;
      }
      return task;
    });
    const body: Record<string, unknown> = {
      from_number: retellInput.e164({ value: propsValue.from_number, label: 'From Number' }),
      tasks,
    };
    const name = retellInput.optionalText(propsValue.name);
    if (name !== undefined) {
      body['name'] = name;
    }
    const scheduled = retellInput.timestampMs({ value: propsValue.scheduled_time, label: 'Scheduled Time' });
    if (scheduled !== undefined) {
      body['trigger_timestamp'] = scheduled;
    }
    const batch = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/create-batch-call', body });
    return retellMap.batchCall(batch);
  },
});

