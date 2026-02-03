import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

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
  },
  async run(context) {
    const { presentationId, exportFormats } = context.propsValue;
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
    return response.body;
  },
});
