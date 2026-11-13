import { Readable } from 'stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

const FORMATS = ['png', 'jpg', 'svg', 'pdf'] as const;
const MAX_NODES = 50;
const MAX_DOWNLOADS = 10;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_DEADLINE_MS = 120_000;

type ImageFormat = (typeof FORMATS)[number];

export const exportNodeImagesAction = createAction({
  auth: figmaAuth,
  name: 'export_node_images',
  classification: 'READ',
  displayName: 'Export Node Images',
  description: 'Renders layers of a Figma file as PNG, JPG, SVG or PDF and returns the image links (optionally downloads the files).',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders the given nodes of a Figma file to images and returns [{nodeId, url, error}]. URLs are public links that expire after 30 days. Format png, jpg, svg or pdf; scale 0.01 to 4 (png/jpg only matter). Leave Download Files off unless a later step needs the file itself. Tier 1 call (about 20 per month on View/Collab seats). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.exportImages,
  props: {
    file_key: figmaProps.fileKey(),
    ids: figmaProps.nodeIds({ required: true, description: `Node IDs to render, like 1:2 (up to ${MAX_NODES}).` }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'png',
      options: { disabled: false, options: FORMATS.map((value) => ({ label: value.toUpperCase(), value })) },
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Image scale from 0.01 to 4. Default 1.',
      required: false,
    }),
    download: Property.Checkbox({
      displayName: 'Download Files',
      description: `Also download the images and store them as files for later steps (up to ${MAX_DOWNLOADS} images, ${MAX_FILE_BYTES / (1024 * 1024)} MB each).`,
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const ids = figmaClient.nodeIds({ value: context.propsValue.ids, required: true });
    if (ids.length > MAX_NODES) throw new Error(`Export at most ${MAX_NODES} nodes per step.`);
    const format = parseFormat(context.propsValue.format);
    const scale = parseScale(context.propsValue.scale);
    const download = context.propsValue.download === true;
    if (download && ids.length > MAX_DOWNLOADS) throw new Error(`Download Files supports at most ${MAX_DOWNLOADS} nodes per step.`);
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/images/${figmaClient.segment({ value: fileKey, label: 'File Key' })}`,
      query: { ids: ids.join(','), format, scale },
      scope: 'file_content:read',
      tier: 1,
      operation: 'export the images',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    if (typeof body['err'] === 'string' && body['err'] !== '') {
      throw new Error(`Figma could not export the images: ${body['err'].slice(0, 300)}`);
    }
    const urls = figmaClient.isRecord(body['images']) ? body['images'] : {};
    const deadline = Date.now() + DOWNLOAD_DEADLINE_MS;
    const images = [];
    for (const nodeId of ids) {
      const url = urls[nodeId];
      if (typeof url !== 'string' || url === '') {
        images.push({ nodeId, url: null, error: 'Figma could not render this node (it may be invisible, empty or not exist).' });
        continue;
      }
      if (!download) {
        images.push({ nodeId, url, error: null });
        continue;
      }
      const data = await downloadImage({ url, deadline });
      const file = await context.files.write({ fileName: `${nodeId.replace(/[^A-Za-z0-9_-]/g, '-')}.${format}`, data });
      images.push({ nodeId, url, error: null, file, size: data.length });
    }
    return { fileKey, format, scale: scale ?? 1, images };
  },
});

function parseFormat(value: unknown): ImageFormat {
  if (value === undefined || value === null || value === '') return 'png';
  const match = FORMATS.find((format) => format === value);
  if (match === undefined) throw new Error('Format must be png, jpg, svg or pdf.');
  return match;
}

function parseScale(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number) || number < 0.01 || number > 4) throw new Error('Scale must be a number from 0.01 to 4.');
  return number;
}

async function downloadImage({ url, deadline }: { url: string; deadline: number }): Promise<Buffer> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Figma returned an image link that is not HTTPS.');
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error(`Downloading the images took longer than ${DOWNLOAD_DEADLINE_MS / 1000} seconds.`);
  const dispatcher = await figmaClient.verifiedTls();
  const response = await httpClient.sendRequest<unknown>(
    { method: HttpMethod.GET, url: parsed.toString(), headers: { Accept: '*/*' }, responseType: 'stream', timeout: remaining, followRedirects: false },
    { dispatcher },
  );
  return readCapped({ stream: response.body, timeoutMs: Math.max(1, deadline - Date.now()) });
}

function readCapped({ stream, timeoutMs }: { stream: unknown; timeoutMs: number }): Promise<Buffer> {
  if (!(stream instanceof Readable)) return Promise.reject(new Error('Figma did not return an image stream.'));
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => stream.destroy(new Error(`Downloading the images took longer than ${DOWNLOAD_DEADLINE_MS / 1000} seconds.`)), timeoutMs);
    stream.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_FILE_BYTES) {
        stream.destroy(new Error(`An exported image is larger than ${MAX_FILE_BYTES / (1024 * 1024)} MB. Lower the scale or turn off Download Files.`));
        return;
      }
      chunks.push(buffer);
    });
    stream.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    stream.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
  });
}
