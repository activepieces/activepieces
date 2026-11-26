import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { exportFormatOptions, presentationIdProp } from './shared-props';

export const exportPresentation = createAction({
  auth: alaiAuth,
  name: 'exportPresentation',
  classification: 'WRITE',
  displayName: 'Export Presentation',
  description: 'Export a presentation as a link, PDF and/or PowerPoint file.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts an export of an existing Alai presentation to link, pdf and/or ppt by presentation ID. By default returns at once with generation_id; set waitForCompletion to wait (max 480 s) and get link_url, pdf_url and ppt_url (signed, valid about 24 h). Fails if a requested format failed. Not idempotent: each call starts a new export job.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'presentation', display: 'section', label: 'Presentation to Export', icon: 'file', props: ['presentationId'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'send', props: ['exportFormats', 'info', 'waitForCompletion'] },
  ],
  props: {
    presentationId: presentationIdProp('The presentation to export.'),
    exportFormats: Property.StaticMultiSelectDropdown({
      displayName: 'Export Formats',
      description: 'Formats to produce.',
      required: true,
      options: { options: exportFormatOptions },
    }),
    info: Property.MarkDown({
      value: 'Alai exports in the background. Without waiting, pass the returned generation ID to **Get Generation** later.',
      variant: MarkdownVariant.INFO,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Alai finishes; the step fails after Max Wait Time.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time',
      description: 'Seconds to wait when waiting is on. Default 300, max 480.',
      required: false,
      advanced: true,
      defaultValue: 300,
    }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const formats = alaiClient.exportFormats(propsValue.exportFormats);
    if (formats.length === 0) {
      throw new Error('Choose at least one export format.');
    }
    return alaiClient.startGeneration({
      apiKey: auth.props.apiKey,
      path: `/presentations/${presentationId}/exports`,
      body: { formats },
      waitForCompletion: propsValue.waitForCompletion,
      maxWaitTime: propsValue.maxWaitTime,
      requestedFormats: formats,
    });
  },
});
