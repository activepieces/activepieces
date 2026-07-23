import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createParagraphBullets = createAction({
  auth: googleDocsAuth,
  name: 'create_paragraph_bullets',
  displayName: 'Create Paragraph Bullets',
  description: 'Apply a bullet list preset to paragraphs in a character range in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Applies a bullet list style (e.g. BULLET_DISC_CIRCLE_SQUARE) to all paragraphs within a character range in a Google Docs document. Use this to convert existing paragraphs into a bulleted or numbered list. The startIndex and endIndex must span the paragraphs to bullet — obtain valid indices from Get Document End Index or Read Document (cannot be guessed). Not idempotent (re-running with a different preset changes the glyph style).',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to apply bullets to (from the document URL or Search Documents).',
      required: true,
    }),
    startIndex: Property.Number({
      displayName: 'Start Index',
      description:
        'Inclusive start character index of the range of paragraphs to bullet. Obtain from Get Document End Index or Read Document — cannot be guessed.',
      required: true,
    }),
    endIndex: Property.Number({
      displayName: 'End Index',
      description:
        'Exclusive end character index of the range of paragraphs to bullet. Must be greater than Start Index. Obtain from Get Document End Index or Read Document — cannot be guessed.',
      required: true,
    }),
    bulletPreset: Property.StaticDropdown({
      displayName: 'Bullet Preset',
      description: 'The bullet list glyph preset to apply to the paragraphs.',
      required: false,
      defaultValue: 'BULLET_DISC_CIRCLE_SQUARE',
      options: {
        options: [
          { label: 'Disc / Circle / Square (default)', value: 'BULLET_DISC_CIRCLE_SQUARE' },
          { label: 'Diamond / Circle / Square', value: 'BULLET_DIAMONDX_ARROW3D_SQUARE' },
          { label: 'Checkbox', value: 'BULLET_CHECKBOX' },
          { label: 'Arrow / Diamond / Disc', value: 'BULLET_ARROW_DIAMOND_DISC' },
          { label: 'Star / Circle / Square', value: 'BULLET_STAR_CIRCLE_SQUARE' },
          { label: 'Arrow3D / Circle / Square', value: 'BULLET_ARROW3D_CIRCLE_SQUARE' },
          { label: 'Left Triangle / Diamond / Disc', value: 'BULLET_LEFTTRIANGLE_DIAMOND_DISC' },
          { label: 'Diamond / Circle / Disc', value: 'BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE' },
          { label: 'Diamond / Diamond / Square', value: 'BULLET_DIAMOND_DISC_CIRCLE' },
          { label: 'Numbered: Decimal / Alpha Lower / Roman Lower', value: 'NUMBERED_DECIMAL_ALPHA_ROMAN' },
          { label: 'Numbered: Decimal / Alpha Lower / Roman Lower (parenthesis)', value: 'NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS' },
          { label: 'Numbered: Decimal nested', value: 'NUMBERED_DECIMAL_NESTED' },
          { label: 'Numbered: Upper Alpha / Alpha Lower / Roman Lower', value: 'NUMBERED_UPPERALPHA_ALPHA_ROMAN' },
          { label: 'Numbered: Upper Roman / Roman Lower / Alpha Lower', value: 'NUMBERED_UPPERROMAN_UPPERALPHA_DECIMAL' },
          { label: 'Numbered: Zero Decimal / Alpha Lower / Roman Lower', value: 'NUMBERED_ZERODECIMAL_ALPHA_ROMAN' },
        ],
      },
    }),
  },
  async run(context) {
    const { documentId, startIndex, endIndex, bulletPreset } = context.propsValue;
    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      createParagraphBullets: {
        range: { startIndex, endIndex },
        bulletPreset: (bulletPreset ?? 'BULLET_DISC_CIRCLE_SQUARE') as docs_v1.Schema$CreateParagraphBulletsRequest['bulletPreset'],
      },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      return {
        success: true,
        documentId,
        startIndex,
        endIndex,
        bulletPreset: bulletPreset ?? 'BULLET_DISC_CIRCLE_SQUARE',
      };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create paragraph bullets in'));
    }
  },
});
