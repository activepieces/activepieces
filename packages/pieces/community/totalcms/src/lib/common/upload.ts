import { Property } from '@activepieces/pieces-framework';
import { totalcmsApi, totalcmsHelpers, TotalCmsConnection } from './client';

export const totalcmsUpload = {
  fileProps,
  altProp,
  save,
};

function fileProps({ fileLabel = 'File' }: { fileLabel?: string } = {}) {
  return {
    file: Property.File({
      displayName: fileLabel,
      description: `The ${fileLabel.toLowerCase()} to upload. Leave empty to use ${fileLabel} URL instead.`,
      required: false,
    }),
    file_url: Property.ShortText({
      displayName: `${fileLabel} URL`,
      description: `A public link to the ${fileLabel.toLowerCase()}, ending in its file name with extension (for example https://example.com/photo.jpg). Your Total CMS site downloads it. Use either this or ${fileLabel}.`,
      required: false,
    }),
  };
}

function altProp() {
  return Property.ShortText({
    displayName: 'Alt Text',
    description: 'Describes the image for screen readers and search engines.',
    required: false,
  });
}

async function save({
  auth,
  collection,
  id,
  property,
  file,
  fileUrl,
  alt,
  folder,
  multiple,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  property: string;
  file: unknown;
  fileUrl: unknown;
  alt?: string;
  folder?: string;
  multiple: boolean;
}): Promise<SaveResult> {
  const source = totalcmsHelpers.parseFileSource({ file, url: fileUrl });
  const uploaded = await totalcmsApi.uploadFile({ auth, collection, id, property, source, folder });
  const altText = alt?.trim();
  if (!altText) {
    return { object: uploaded.object, preview_url: uploaded.preview_url, warning: null };
  }
  const fileName = multiple ? lastItemName({ value: uploaded.object[property] }) : undefined;
  if (multiple && !fileName) {
    return {
      object: uploaded.object,
      preview_url: uploaded.preview_url,
      warning: 'The image was uploaded, but its alt text was not saved because the new image could not be identified.',
    };
  }
  try {
    const object = await totalcmsApi.patchFileMeta({ auth, collection, id, property, fileName, fields: { alt: altText } });
    return { object, preview_url: uploaded.preview_url, warning: null };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      object: uploaded.object,
      preview_url: uploaded.preview_url,
      warning: `The image was uploaded, but its alt text was not saved: ${reason}`,
    };
  }
}

function lastItemName({ value }: { value: unknown }): string | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const last: unknown = value[value.length - 1];
  if (!totalcmsHelpers.isRecord(last) || typeof last['name'] !== 'string' || last['name'].length === 0) {
    return undefined;
  }
  return last['name'];
}

type SaveResult = { object: Record<string, unknown>; preview_url: string | null; warning: string | null };
