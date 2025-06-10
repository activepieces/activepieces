import { createAction } from '@activepieces/pieces-framework';
import { skyVernAuth } from '../../index';
import { skyVernProps } from '../common/props';
import { makeClient } from '../common/client';
export const runAgentTask = createAction({
  auth: skyVernAuth,
  name: 'runAgentTask',
  displayName: 'Run Agent Task',
  description: 'Trigger an agent to process new customer data when a form is submitted.',
  props: {
    x_user_agent:skyVernProps.x_user_agent,
    prompt : skyVernProps.prompt,
    url: skyVernProps.url,
    engine: skyVernProps.engine,
    title: skyVernProps.title,
    proxy_location: skyVernProps.proxy_location,
    data_extraction_schema: skyVernProps.data_extraction_schema,
    error_code_mapping: skyVernProps.error_code_mapping,
    max_steps: skyVernProps.max_steps,
    webhook_url: skyVernProps.webhook_url,
    totp_identifier: skyVernProps.totp_identifier,
    totp_url: skyVernProps.totp_url,
    browser_session_id: skyVernProps.browser_session_id,
    model: skyVernProps.model,
    publish_workflow: skyVernProps.publish_workflow,
    include_action_history_in_verification: skyVernProps.include_action_history_in_verification,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const client = makeClient(
      auth,
      propsValue.x_user_agent,
    );
    const requestBody: Record<string, unknown> = {
      prompt: propsValue.prompt,
      url: propsValue.url,
      engine: propsValue.engine,
      title: propsValue.title,
      proxy_location: propsValue.proxy_location,
      data_extraction_schema: propsValue.data_extraction_schema,
      error_code_mapping: propsValue.error_code_mapping,
      max_steps: propsValue.max_steps,
      webhook_url: propsValue.webhook_url,
      totp_identifier: propsValue.totp_identifier,
      totp_url: propsValue.totp_url,
      browser_session_id: propsValue.browser_session_id,
      model: propsValue.model,
      publish_workflow: propsValue.publish_workflow,
      include_action_history_in_verification: propsValue.include_action_history_in_verification,
    };
    const filteredRequestBody = Object.fromEntries(
        Object.entries(requestBody).filter(([, value]) => value !== undefined && value !== null)
    );
    return await client.tasks.create(filteredRequestBody);
  },
});
