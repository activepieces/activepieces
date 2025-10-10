import { createAction, Property } from '@activepieces/pieces-framework';
import { v2 } from '@datadog/datadog-api-client';
import { datadogAuth } from '../..';
import { getDatadogConfiguration } from '../common';
import { z } from 'zod';

export const sendMultipleLogs = createAction({
  name: 'sendMultipleLogs',
  displayName: 'Send Multiple logs',
  description: 'Send your logs to your Datadog platform over HTTP.',
  auth: datadogAuth,
  requireAuth: true,
  props: {
    body: Property.Json({
      displayName: 'Logs',
      required: true,
      description: `Logs to send to Datadog, must contain a \`logs\` key with an array of objects. Documentation: https://docs.datadoghq.com/api/latest/logs/#send-logs`,
      defaultValue: {logs: [
        {
          ddsource: "source",
          ddtags: "env:test,version:1.0",
          hostname: "hostname",
          message: "message",
          service: "service",
          additionalProperties: {
            status: "info",
          },
        },
      ]}
    }),
  },
  async run({ auth, propsValue }) {
    /**
     * Documentation: https://docs.datadoghq.com/api/latest/logs/?code-lang=typescript
     */
    const apiInstance = new v2.LogsApi(getDatadogConfiguration(auth));

    // Validate the request body
    z.object({
      logs: z.array(
        z.object({
          message: z.string({required_error: "Log message cannot be empty"}),
          ddsource: z.string().optional(),
          ddtags: z.string().optional(),
          hostname: z.string().optional(),
          service: z.string().optional(),
          additionalProperties: z.record(z.string(), z.unknown()).optional(),
        }).strict("Allowed properties are `message`, `ddsource`, `ddtags`, `hostname`, `service`, `additionalProperties`"),
        { invalid_type_error: "Logs must be an array of objects under `logs` key e.g `{'logs': [{'message': 'test'}]}`"}
      ).min(1, "At least one log entry is required")
    }).strict().parse(propsValue.body);

    const params: v2.LogsApiSubmitLogRequest = {
      body: propsValue.body['logs'] as v2.HTTPLogItem[],
    };

    await apiInstance.submitLog(params)
    return {
      success: true,
      message: 'Logs sent successfully',
    };
  },
});
