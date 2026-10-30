import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { projectId } from '../common/props';
import { BASE_URL } from '../common/client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { customgptAuth } from '../common/auth';

export const updateAgent = createAction({
  auth: customgptAuth,
  name: 'update_agent',
  displayName: 'Update Agent',
  description: 'Update an existing agent with specific details',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing CustomGPT agent identified by its project id, changing fields such as the agent name, sharing/public visibility, sitemap source, OCR, anonymization, license, and data-retention options, or attaching a file. Use to reconfigure an already-created agent; only the fields you provide are changed. Treat as not idempotent: it can re-upload an attached file and re-trigger sitemap crawling on each call.',
    idempotent: false,
  },
  props: {
    project_id: projectId,
    project_name: Property.ShortText({
      displayName: 'Agent Name',
      description: 'The name of the agent',
      required: false,
    }),
    is_shared: Property.Checkbox({
      displayName: 'Is Shared',
      description: 'Whether the agent is public or not',
      required: false,
    }),
    sitemap_path: Property.ShortText({
      displayName: 'Sitemap Path',
      description: 'URL of the sitemap to crawl',
      required: false,
    }),
    file_data_retension: Property.Checkbox({
      displayName: 'File Data Retention',
      description: 'Enable file data retention',
      required: false,
    }),
    is_ocr_enabled: Property.Checkbox({
      displayName: 'OCR Enabled',
      description: 'Enable Optical Character Recognition for images',
      required: false,
    }),
    is_anonymized: Property.Checkbox({
      displayName: 'Anonymized',
      description: 'Enable anonymization of data',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'Upload a file to the agent',
      required: false,
    }),
    are_licenses_allowed: Property.Checkbox({
      displayName: 'Are Licenses Allowed',
      description: 'Whether project licenses are allowed',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, file, ...fields } = propsValue;
    const formData = new FormData();

    Object.entries(fields)
      .filter(([, value]) => !isNil(value))
      .forEach(([key, value]) => formData.append(key, String(value)));
    if (!isNil(file)) {
      formData.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: formData,
    });

    return response.body;
  },
});
