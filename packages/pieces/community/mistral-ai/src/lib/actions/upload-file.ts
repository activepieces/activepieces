import { createAction, Property } from '@activepieces/pieces-framework';
import { mistralAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadFile = createAction({
  auth: mistralAiAuth,
  name: 'uploadFile',
  displayName: 'Upload File',
  description: 'Upload a file to Mistral AI (e.g., for fine-tuning or context storage).',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Fine-tuning only supports .jsonl files. Maximum file size: 512 MB. Supported formats: JSONL, JSON, TXT, CSV, TSV, XLSX, XLS, DOCX, DOC, PDF, PNG, JPG, JPEG, WEBP',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description: 'The purpose of the file upload',
      required: true,
      options: {
        options: [
          { label: 'Fine-tuning', value: 'fine-tune' },
          { label: 'Batch', value: 'batch' },
          { label: 'ocr', value: 'ocr' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { file, purpose } = propsValue;

    // Validate file for fine-tuning
    if (purpose === 'fine-tune') {
      // Check file extension
      if (!file.filename.toLowerCase().endsWith('.jsonl')) {
        throw new Error('Fine-tuning only supports .jsonl files');
      }
      
      // Check file size (512 MB = 512 * 1024 * 1024 bytes)
      const maxSize = 512 * 1024 * 1024;
      if (file.data.length > maxSize) {
        throw new Error('File size exceeds the maximum limit of 512 MB');
      }
    }

    // Create form data for file upload
    const formData = new FormData();
    const blob = new Blob([file.data], { type: 'application/octet-stream' });
    formData.append('file', blob, file.filename);
    formData.append('purpose', purpose);

    const response = await makeRequest(auth as string, HttpMethod.POST, '/files', formData, {
      'Content-Type': 'multipart/form-data',
    });

    return response;
  },
});
