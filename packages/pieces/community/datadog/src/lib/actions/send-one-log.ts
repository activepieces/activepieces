import { createAction, Property } from '@activepieces/pieces-framework';
import { v2 } from '@datadog/datadog-api-client';
import { datadogAuth } from '../..';
import { getDatadogConfiguration } from '../common';

export const sendOneLog = createAction({
  name: 'sendOneLog',
  displayName: 'Send One log',
  description: 'Send one log to your Datadog platform over HTTP.',
  auth: datadogAuth,
  requireAuth: true,
  props: {
    message: Property.ShortText({
      displayName: 'Message',
      description: 'The message to send to Datadog',
      required: true,
    }),
    ddsource: Property.ShortText({
      displayName: 'DD Source',
      description: 'The DD source to send to Datadog',
      required: false,
    }),
    ddtags: Property.ShortText({
      displayName: 'DD Tags',
      description: 'The DD tags to send to Datadog, comma separated',
      required: false,
    }),
    hostname: Property.ShortText({
      displayName: 'Hostname',
      description: 'The hostname to send to Datadog',
      required: false,
    }),
    service: Property.ShortText({
      displayName: 'Service',
      description: 'The service to send to Datadog',
      required: false,
    }),
    additionalProperties: Property.Json({
      displayName: 'Additional Properties',
      description: 'Additional properties to send to Datadog, in key-value pairs like status, level, etc.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    /**
     * Documentation: https://docs.datadoghq.com/api/latest/logs/?code-lang=typescript
     */
    const apiInstance = new v2.LogsApi(getDatadogConfiguration(auth));

    const params: v2.LogsApiSubmitLogRequest = {
      body: [{
        message: propsValue.message,
        ddsource: propsValue.ddsource,
        ddtags: propsValue.ddtags,
        hostname: propsValue.hostname,
        service: propsValue.service,
        additionalProperties: propsValue.additionalProperties,
      }],
    };

    await apiInstance.submitLog(params)
    return {
      success: true,
      message: 'Logs sent successfully',
    };
  },
});
