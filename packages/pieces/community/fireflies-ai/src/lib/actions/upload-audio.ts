import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAuth } from '../..';
import { fireflyService } from '../common/fireflyService';

export const uploadAudio = createAction({
  auth: firefliesAuth,
  name: 'uploadAudio',
  displayName: 'Upload Audio',
  description:
    'Upload an audio file to Fireflies for transcription (e.g., automatically transcribe a recorded customer support call).',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the audio file that you want to upload',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the audio file',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'The language of the audio file',
      required: false,
    }),
    saveVideo: Property.Checkbox({
      displayName: 'Save Video',
      description: 'Whether to save the video of the audio file',
      required: false,
    }),
    referenceId: Property.ShortText({
      displayName: 'Reference ID',
      description: 'Arbitrary ID that can be used to reference the audio file in your own systems',
      required: false,
    }),
  },
  async run({ auth, store, propsValue }) {
    const webhook = (await store.get('webhookUrl')) as string;

    await fireflyService.uploadAudio(auth, {
      url: propsValue.url,
      title: propsValue.title,
      lang: propsValue.lang,
      saveVideo: propsValue.saveVideo,
      referenceId: propsValue.referenceId,
      webhook,
    });
  },
});
