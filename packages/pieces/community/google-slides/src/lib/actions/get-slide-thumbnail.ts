import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { SlideSelector, slidesRequests } from '../commons/requests';
import { getSlideThumbnailOutputSchema } from '../output-schemas';

export const getSlideThumbnail = createAction({
  auth: googleSlidesAuth,
  name: 'get_slide_thumbnail',
  classification: 'READ',
  displayName: 'Get Slide Thumbnail',
  description: 'Get a PNG image of a slide, as a link and optionally as a file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Render one slide as a PNG thumbnail (LARGE 1600 px, MEDIUM 800 px or SMALL 200 px wide), chosen by slide number or object ID, and return its image link; turn on Save as File to also get a file that does not expire. The link expires after about 30 minutes, so save the file when a later step needs the image. Google counts this as an expensive read for quota. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getSlideThumbnailOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'Width of the image.',
      required: false,
      defaultValue: 'LARGE',
      options: {
        options: [
          { label: 'Large (1600 px wide)', value: 'LARGE' },
          { label: 'Medium (800 px wide)', value: 'MEDIUM' },
          { label: 'Small (200 px wide)', value: 'SMALL' },
        ],
      },
    }),
    save_as_file: Property.Checkbox({
      displayName: 'Save as File',
      description: 'Also download the image and return it as a file (the image link expires after about 30 minutes).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const size = context.propsValue.size ?? 'LARGE';
    if (!THUMBNAIL_SIZES.includes(size)) {
      throw new Error(`Size must be one of ${THUMBNAIL_SIZES.join(', ')}.`);
    }
    const accessToken = await getAccessToken(context.auth);
    const { pageObjectId, thumbnail } = await fetchThumbnail({ accessToken, presentationId, selector, size }).catch(
      (error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'get the slide thumbnail' });
      }
    );
    const contentUrl = thumbnail.contentUrl;
    if (!contentUrl) {
      throw new Error('Google returned no thumbnail image link for this slide.');
    }
    const file = context.propsValue.save_as_file
      ? await context.files.write({
          fileName: `slide-${pageObjectId}.png`,
          data: await downloadImage(contentUrl),
        })
      : null;
    return {
      presentationId,
      slideObjectId: pageObjectId,
      width: thumbnail.width ?? null,
      height: thumbnail.height ?? null,
      contentUrl,
      file,
    };
  },
});

async function fetchThumbnail({
  accessToken,
  presentationId,
  selector,
  size,
}: {
  accessToken: string;
  presentationId: string;
  selector: SlideSelector;
  size: string;
}) {
  const { objectId: pageObjectId } = await slidesRequests.lookupSlide({ accessToken, presentationId, selector });
  const thumbnail = await slidesApi.getPageThumbnail({ accessToken, presentationId, pageObjectId, thumbnailSize: size });
  return { pageObjectId, thumbnail };
}

async function downloadImage(contentUrl: string): Promise<Buffer> {
  const response = await httpClient
    .sendRequest<ArrayBuffer>({ method: HttpMethod.GET, url: contentUrl, responseType: 'arraybuffer' })
    .catch((error: unknown) => {
      throw slidesApi.googleApiError({ error, action: 'download the thumbnail image' });
    });
  return Buffer.from(response.body);
}

const THUMBNAIL_SIZES = ['LARGE', 'MEDIUM', 'SMALL'];
