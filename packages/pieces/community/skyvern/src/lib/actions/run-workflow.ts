import { createAction } from '@activepieces/pieces-framework';
import { skyVernAuth } from '../../index';
import { skyVernProps } from '../common/props';
import { makeClient } from '../common/client';
export const runWorkflow = createAction({
  auth: skyVernAuth,
  name: 'runWorkflow',
  displayName: 'Run Workflow',
  description: 'Add supplementary files to a document, such as terms and conditions.',
  props: {
    x_user_agent: skyVernProps.x_user_agent,
    x_max_steps_override:skyVernProps.x_max_steps_override,
    workflow_id: skyVernProps.workflow_id,
    parameters: skyVernProps.parameters,
    title: skyVernProps.title,
    proxy_location: skyVernProps.proxy_location,
    webhook_url: skyVernProps.webhook_url,
    totp_url: skyVernProps.totp_url,
    totp_identifier: skyVernProps.totp_identifier,
    browser_session_id: skyVernProps.browser_session_id,
  },
   async run(context) {
    const { auth, propsValue } = context;
    const client = makeClient(
      auth, 
      propsValue.x_user_agent,
      propsValue.x_max_steps_override
    );
    const requestBody: Record<string, unknown> = {
      workflow_id: propsValue.workflow_id,
      parameters: propsValue.parameters,
      title: propsValue.title,
      proxy_location: propsValue.proxy_location,
      webhook_url: propsValue.webhook_url,
      totp_url: propsValue.totp_url,
      totp_identifier: propsValue.totp_identifier,
      browser_session_id: propsValue.browser_session_id,
    };

    const filteredRequestBody = Object.fromEntries(
      Object.entries(requestBody).filter(([, value]) => value !== undefined && value !== null)
    );
    return await client.workflows.run(filteredRequestBody);
  },
});
