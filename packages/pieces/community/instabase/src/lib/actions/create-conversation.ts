import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { instabaseAuth } from '../../index';
import FormData from 'form-data';

interface FileObject {
  file: ApFile;
}

interface CreateConversationResponse {
  id: string;
  name: string;
  upload_status?: {
    success?: Array<{ name: string }>;
    failure?: Array<{ name: string }>;
  };
}

export const createConversationAction = createAction({
  auth: instabaseAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation and Upload Files',
  description: 'Create a new conversation and upload files to it',
  props: {
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'Name of the conversation',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the conversation',
      required: false,
    }),
    files: Property.Array({
      displayName: 'Files',
      description: 'Files to upload to the conversation',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'File to upload',
          required: true,
        }),
      },
    }),
    org: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization ID (for organization accounts)',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace',
      description: 'Workspace name where the conversation is created',
      required: false,
    }),
    enable_object_detection: Property.Checkbox({
      displayName: 'Enable Object Detection',
      description: 'Enable object detection for extracting tables and checkboxes',
      required: false,
      defaultValue: false,
    }),
    enable_entity_detection: Property.Checkbox({
      displayName: 'Enable Entity Detection',
      description: 'Enable entity detection for signatures and barcodes',
      required: false,
      defaultValue: true,
    }),
    write_converted_image: Property.Checkbox({
      displayName: 'Write Converted Images',
      description: 'Save image files generated when processing documents',
      required: false,
      defaultValue: true,
    }),
    write_thumbnail: Property.Checkbox({
      displayName: 'Write Thumbnails',
      description: 'Generate and save thumbnails of processed documents',
      required: false,
      defaultValue: true,
    }),
    fast_mode: Property.Checkbox({
      displayName: 'Fast Mode',
      description: 'Skip preprocessing steps for faster processing',
      required: false,
      defaultValue: false,
    }),
    enable_multilanguage_support: Property.Checkbox({
      displayName: 'Enable Multilanguage Support',
      description: 'Enable support for non-Latin languages',
      required: false,
      defaultValue: false,
    }),
    enable_multilanguage_advanced_mode: Property.Checkbox({
      displayName: 'Enable Advanced Multilanguage Mode',
      description: 'Enable advanced support for complex non-Latin languages',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      name,
      description,
      files,
      org,
      workspace,
      enable_object_detection = false,
      enable_entity_detection = true,
      write_converted_image = true,
      write_thumbnail = true,
      fast_mode = false,
      enable_multilanguage_support = false,
      enable_multilanguage_advanced_mode = false,
    } = propsValue;

    const fileObjects = (files as FileObject[]) || [];

    if (!fileObjects || fileObjects.length === 0) {
      throw new Error('At least one file is required');
    }

    const formData = new FormData();

    if (name) {
      formData.append('name', name);
    }
    if (description) {
      formData.append('description', description);
    }
    if (org) {
      formData.append('org', org);
    }
    if (workspace) {
      formData.append('workspace', workspace);
    }

    formData.append('enable_object_detection', enable_object_detection.toString());
    formData.append('enable_entity_detection', enable_entity_detection.toString());
    formData.append('write_converted_image', write_converted_image.toString());
    formData.append('write_thumbnail', write_thumbnail.toString());
    formData.append('fast_mode', fast_mode.toString());
    formData.append('enable_multilanguage_support', enable_multilanguage_support.toString());
    formData.append('enable_multilanguage_advanced_mode', enable_multilanguage_advanced_mode.toString());

    fileObjects.forEach((fileObj) => {
      const file = fileObj.file;
      const fileBuffer = file.base64 ? Buffer.from(file.base64, 'base64') : file.data;
      formData.append('files', fileBuffer, file.filename);
    });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${auth.props.apiToken}`,
    };

    const ibContext = auth.props.ibContext;
    if (ibContext) {
      headers['IB-Context'] = ibContext;
    }

    const response = await httpClient.sendRequest<CreateConversationResponse>({
      method: HttpMethod.POST,
      url: `${auth.props.apiRoot}/v2/conversations`,
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    return response.body;
  },
});
