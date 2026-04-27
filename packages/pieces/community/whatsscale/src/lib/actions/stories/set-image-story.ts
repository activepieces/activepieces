import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const setImageStoryAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_set_image_story',
  displayName: 'Set an Image Story',
  description: 'Post an image to your WhatsApp story',
  props: {
    session: whatsscaleProps.session,
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      required: true,
      description:
        'URL to the image. Supports Google Drive, Dropbox, and direct URLs.',
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      required: false,
      description: 'Optional caption for the image story',
    }),
  },
  async run(context) {
    const { session, imageUrl, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, imageUrl);

    const response = await whatsscaleClient(
      apiKey,
      HttpMethod.POST,
      '/api/status/image',
      {
        session,
        file: preparedUrl,
        caption: caption ?? '',
        platform: 'activepieces',
      },
    );

    const { jobId } = response.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
