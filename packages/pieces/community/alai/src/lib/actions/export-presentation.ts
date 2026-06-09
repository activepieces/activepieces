import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const exportPresentation = createAction({
  auth: alaiAuth,
  name: 'exportPresentation',
  displayName: 'Export Presentation',
  description: 'Export a presentation in the specified formats.',
  props: {
    presentationId: Property.ShortText({
      displayName: 'Presentation ID',
      description: 'The ID of the presentation to export.',
      required: true,
    }),
    exportFormats: Property.StaticMultiSelectDropdown({
      displayName: 'Export Formats',
      description: 'Formats to export the presentation in.',
      required: true,
      options: {
        options: [
          { label: 'Link', value: 'link' },
          { label: 'PDF', value: 'pdf' },
          { label: 'PowerPoint (PPTX)', value: 'ppt' },
        ],
      },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description:
        'Wait for the presentation generation to complete before returning.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description:
        'Maximum time to wait for completion (default 300 seconds / 5 minutes).',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { presentationId, exportFormats, waitForCompletion, maxWaitTime } =
      context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://slides-api.getalai.com/api/v1/presentations/${presentationId}/exports`,
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        export_formats: exportFormats,
      },
    });
    const generationId = response.body?.generation_id;

    if (!generationId) {
      throw new Error(
        `Failed to get generation_id from response: ${JSON.stringify(
          response.body
        )}`
      );
    }

    if (!waitForCompletion) {
      return response.body;
    }

    await sleep(1000);

    // Poll for completion
    const maxWait = (maxWaitTime || 300) * 1000; // Convert to milliseconds
    const startTime = Date.now();
    const pollInterval = 5000; // Poll every 5 seconds

    while (Date.now() - startTime < maxWait) {
      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://slides-api.getalai.com/api/v1/generations/${generationId}`,
        headers: {
          Authorization: `Bearer ${context.auth.props.apiKey}`,
        },
      });

      const status = statusResponse.body?.status;

      if (status === 'completed') {
        return statusResponse.body;
      } else if (status === 'failed') {
        throw new Error(
          `Generation failed: ${statusResponse.body?.error || 'Unknown error'}`
        );
      }

      // Wait before polling again
      await sleep(pollInterval);
    }

    throw new Error(`Generation timed out after ${maxWaitTime || 300} seconds`);
  },
});
