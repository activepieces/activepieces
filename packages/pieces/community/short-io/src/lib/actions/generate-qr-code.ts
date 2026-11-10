import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoQr } from '../common/qr';
import { shortIoValues } from '../common/values';

const HEX_COLOR = /^[0-9A-Fa-f]{6,8}$/;

function color({ value, label }: { value: string | undefined; label: string }): string | undefined {
  const text = value?.trim().replace(/^#/, '');
  if (!text) {
    return undefined;
  }
  if (!HEX_COLOR.test(text)) {
    throw new Error(`${label} must be a hex color like 000000 or FF8800.`);
  }
  return text;
}

export const generateQrCodeAction = createAction({
  auth: shortIoAuth,
  name: 'generate_qr_code',
  displayName: 'Generate QR Code',
  description: 'Generate a QR code image (PNG or SVG) for a short link.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Generates a QR code image for a short link (by link ID) and returns it as a file. Optional colors, size (1-99) and PNG or SVG format. Does not change the link.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.qrCode,
  props: {
    linkId: shortIoAiProps.linkId(),
    type: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'png',
      options: {
        disabled: false,
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'SVG', value: 'svg' },
        ],
      },
    }),
    size: Property.Number({
      displayName: 'Size',
      description: 'Scale factor from 1 to 99 (Short.io default when empty).',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color of the code, e.g. 000000.',
      required: false,
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description: 'Hex background color, e.g. FFFFFF.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const format = propsValue.type === 'svg' ? 'svg' : 'png';
    const size = shortIoValues.optionalNumber({ value: propsValue.size, label: 'Size', min: 1, max: 99 });
    const fg = color({ value: propsValue.color, label: 'Color' });
    const bg = color({ value: propsValue.backgroundColor, label: 'Background color' });
    const linkId = propsValue.linkId.trim();
    try {
      const { data } = await shortIoQr.renderQrImage({
        auth,
        linkId,
        options: shortIoValues.compact({ type: format, size, color: fg, backgroundColor: bg, useDomainSettings: fg === undefined && bg === undefined }),
      });
      const fileName = `qr-${linkId.replace(/[^A-Za-z0-9_-]/g, '_')}.${format}`;
      const file = await files.write({ fileName, data });
      return { linkId, format, fileName, file, size: data.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Short link not found. Check the link ID.' } });
    }
  },
});
