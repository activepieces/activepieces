import { createAction, Property } from '@activepieces/pieces-framework';
import { projectId } from '../common/props';
import { BASE_URL } from '../common/client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { customgptAuth } from '../common/auth';

export const updateAgent = createAction({
  auth: customgptAuth,
  name: 'update_agent',
  displayName: 'Update Agent',
  description: 'Update an existing agent with specific details',
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
    const body: any = {};

    if (propsValue.project_name !== undefined) {
      body.project_name = propsValue.project_name;
    }
    if (propsValue.is_shared !== undefined) {
      body.is_shared = propsValue.is_shared;
    }
    if (propsValue.sitemap_path !== undefined) {
      body.sitemap_path = propsValue.sitemap_path;
    }
    if (propsValue.file_data_retension !== undefined) {
      body.file_data_retension = propsValue.file_data_retension;
    }
    if (propsValue.is_ocr_enabled !== undefined) {
      body.is_ocr_enabled = propsValue.is_ocr_enabled;
    }
    if (propsValue.is_anonymized !== undefined) {
      body.is_anonymized = propsValue.is_anonymized;
    }
    if (propsValue.file !== undefined) {
      body.file = propsValue.file;
    }
    if (propsValue.are_licenses_allowed !== undefined) {
      body.are_licenses_allowed = propsValue.are_licenses_allowed;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${propsValue.project_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'content-type': 'multipart/form-data',
      },
      body,
    });

    return response.body;
  },
});
