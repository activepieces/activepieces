import { Property } from '@activepieces/pieces-framework';
import { vlmRunCommon } from '.';

// Action Properties
export const analyzeAudioProperties = {
  audio: Property.File({
    displayName: 'Audio File',
    description: 'The audio file to get the transcription from. Only MP3 supported.',
    required: true,
  }),
};

export const analyzeImageProperties = {
  image: Property.ShortText({
    displayName: 'Image File',
    description: 'The image file to be analyzed.',
    required: true,
  }),
  domain: Property.StaticDropdown({
    displayName: 'Domain',
    description: 'The specific analysis domain for the image.',
    required: true,
    options: {
      options: [
        { label: 'Image Classification', value: 'image.classification' },
        { label: 'Image Caption', value: 'image.caption' },
        { label: 'Image TV News', value: 'image.tv-news' },
        { label: 'Image Q and A', value: 'image.q-and-a' },
      ],
    },
  }),
};

export const analyzeDocumentProperties = {
  document: Property.File({
    displayName: 'Document File',
    description: 'The document file to be analyzed.',
    required: true,
  }),
  domain: Property.StaticDropdown({
    displayName: 'Domain',
    description: 'The specific analysis domain for the document.',
    required: true,
    options: {
      options: [
        { label: 'Bank Statement', value: 'document.bank-statement' },
        { label: 'Document Classification', value: 'document.classification' },
        { label: 'Invoice', value: 'document.invoice' },
        { label: 'Markdown', value: 'document.markdown' },
        { label: 'Q and A', value: 'document.q-and-a' },
        { label: 'Receipt', value: 'document.receipt' },
        { label: 'Resume', value: 'document.resume' },
        { label: "US Driver's License", value: 'document.us-drivers-license' },
        { label: 'Utility Bill', value: 'document.utility-bill' },
      ],
    },
  }),
};

export const analyzeVideoProperties = {
  video: Property.File({
    displayName: 'Video File',
    description: 'The video file to be analyzed.',
    required: true,
  }),
  domain: Property.StaticDropdown({
    displayName: 'Domain',
    description: 'The specific analysis domain for the video.',
    required: true,
    options: {
      options: [
        { label: 'Video Transcription', value: 'video.transcription' },
        {
          label: 'Video Transcription Summary',
          value: 'video.transcription-summary',
        },
        {
          label: 'Video Product Demo Summary',
          value: 'video.product-demo-summary',
        },
        {
          label: 'Video Conferencing Summary',
          value: 'video.conferencing-summary',
        },
        { label: 'Video Podcast Summary', value: 'video.podcast-summary' },
        { label: 'Video Summary', value: 'video.summary' },
        { label: 'Video Dashcam Analytics', value: 'video.dashcam-analytics' },
      ],
    },
  }),
};

export const getFileProperties = {
  fileId: Property.Dropdown({
    displayName: 'File',
    description: 'Select a file to retrieve its details.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your VLM Run account to see files',
          options: [],
        };
      }
      const files = await vlmRunCommon.listFiles(auth as string);
      return {
        disabled: false,
        options: files.map((file) => ({
          label: file.filename,
          value: file.id,
        })),
      };
    },
  }),
};
