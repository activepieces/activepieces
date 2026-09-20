import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const runResearchAction = createAction({
  auth: neuralvergeAuth,
  name: 'run_research',
  classification: 'READ',
  displayName: 'Run AI Research',
  description: 'Run a multi-step AI web research task and return the report. Cost: 20-400 points depending on depth (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Run a multi-step web research task on any topic (company risk, market, person background) and return a markdown report plus structured JSON. Starts an async job and waits for it by polling; each call starts a new paid task, so retries cost points again.',
    idempotent: false,
  },
  props: {
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'What to research, in plain language. Example: Analyze the company Example Inc. and identify the main business risks.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code used for search localisation, for example us.',
      required: false,
      defaultValue: "us",
    }),
    search_enabled: Property.Checkbox({
      displayName: 'Enable Web Search',
      description: 'Let the research task search the web.',
      required: false,
      defaultValue: true,
    }),
    deepsearch_model: Property.ShortText({
      displayName: 'Research Depth Model',
      description: 'Model tier for the deep research step, for example base. Higher tiers cost more points.',
      required: false,
      defaultValue: "base",
    }),
    finalizer_model: Property.ShortText({
      displayName: 'Finalizer Model',
      description: 'Model that writes the final report. Leave empty for the default.',
      required: false,
    }),
    extract_schema_json: Property.LongText({
      displayName: 'Output JSON Schema',
      description: 'Optional JSON Schema that pins the shape of the structured result (machine).',
      required: false,
    }),
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Poll every 3 seconds until the research task is complete. Turn off to return the session ID immediately and fetch the result later with Get Research Status.',
      required: false,
      defaultValue: true,
    }),
    timeout_seconds: Property.Number({
      displayName: 'Max Wait (seconds)',
      description: 'How long to wait for the result before returning the current status. Keep it below your flow step timeout.',
      required: false,
      defaultValue: 540,
    }),
  },
  async run({ auth, propsValue }) {
    const started = await neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-research',
      requiredKeys: ['settings'],
      body: {
        instructions: propsValue.instructions,
        settings: {
          country_code: propsValue.country_code,
          search_enabled: propsValue.search_enabled,
          deepsearch_model: propsValue.deepsearch_model,
          finalizer_model: propsValue.finalizer_model,
          extract_schema_json: neuralvergeClient.toSchemaString(propsValue.extract_schema_json),
        },
      },
    });
    if (propsValue.wait_for_completion === false) {
      return started;
    }
    return neuralvergeClient.waitForSession({
      apiKey: auth.secret_text,
      sessionId: started.session_id,
      timeoutSeconds: propsValue.timeout_seconds ?? 540,
    });
  },
});
