import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesText } from '../commons/presentation-text';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { generateFromTemplateOutputSchema } from '../output-schemas';

export const generateFromTemplate = createAction({
  name: 'generate_from_template',
  classification: 'WRITE',
  displayName: 'Generate from template',
  description: 'Generate a new slide from a template',
  audience: 'both',
  aiMetadata: {
    description:
      "Create a new Google Slides presentation by copying a template presentation, then substituting its placeholder tokens with supplied values. Use this for mail-merge style document generation from a reusable deck; to copy without replacing text use Copy Presentation. The template's placeholder syntax must be selected (curly braces {{}} or square brackets [[]]); placeholders are discovered in slide text, grouped shapes, table cells and speaker notes, and matching is case-sensitive. The Presentation Title value also fills a {{title}} placeholder. A service account needs a Shared Drive folder to write the copy into. Not idempotent: each call copies the template into a brand-new presentation file.",
    idempotent: false,
  },
  auth: googleSlidesAuth,
  outputSchema: generateFromTemplateOutputSchema,
  props: {
    template_presentation_id: Property.ShortText({
      displayName: 'Template presentation ID',
      description: 'The template presentation ID (between /d/ and /edit in its URL), or the full URL.',
      required: true,
    }),
    placeholder_format: Property.StaticDropdown({
      displayName: 'Placeholder Format',
      description: 'Choose the format of placeholders in your template',
      required: true,
      defaultValue: '{{}}',
      options: {
        disabled: false,
        options: [
          { label: 'Curly Braces {{}}', value: '{{}}' },
          { label: 'Square Brackets [[]]', value: '[[]]' },
        ],
      },
    }),
    table_data: Property.DynamicProperties({
      auth: googleSlidesAuth,
      displayName: 'Table Data',
      required: true,
      refreshers: ['template_presentation_id', 'placeholder_format'],
      props: async ({ auth, template_presentation_id, placeholder_format }) => {
        if (!template_presentation_id || !auth) return {};

        const accessToken = await getAccessToken(auth);
        const presentation = await slidesApi.getPresentation({
          accessToken,
          presentationId: slidesIds.parsePresentationId(template_presentation_id),
        });
        if (!presentation) return {};

        const format = String(placeholder_format) === '[[]]' ? '[[]]' : '{{}}';
        const placeholderFields = slidesText
          .discoverPlaceholders({ presentation, format })
          .filter((name) => name !== 'title')
          .map((name): [string, DynamicPropsValue[string]] => [
            name,
            Property.ShortText({
              displayName: name.trim().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
              description: `Value for "${slidesRequests.toPlaceholder({ name: name.trim(), format })}"`,
              required: false,
            }),
          ]);
        return {
          title: Property.ShortText({
            displayName: 'Presentation Title',
            description: `Title of the new presentation. It also fills a ${slidesRequests.toPlaceholder({ name: 'title', format })} placeholder if the template has one.`,
            defaultValue: `Copy of: ${presentation.title}`,
            required: true,
          }),
          ...Object.fromEntries(placeholderFields),
        };
      },
    }),
    folder_id: slidesProps.folderIdProp(
      'Optional Drive folder for the new presentation: its ID or URL (https://drive.google.com/drive/folders/<id>). Leave empty to use the default location. A service account needs a folder in a Shared Drive here.'
    ),
  },
  async run(context) {
    const { placeholder_format, table_data } = context.propsValue;
    const templateId = slidesIds.parsePresentationId(context.propsValue.template_presentation_id);
    const folderId = slidesIds.parseFolderId(context.propsValue.folder_id);
    const tableData: Record<string, unknown> = table_data ?? {};
    const title = typeof tableData['title'] === 'string' ? tableData['title'] : '';

    const drive = googleDrive({ version: 'v3', auth: await createGoogleClient(context.auth) });
    const copyResponse = await drive.files
      .copy({
        fileId: templateId,
        requestBody: {
          name: title || 'New Presentation',
          ...(folderId ? { parents: [folderId] } : {}),
        },
        supportsAllDrives: true,
        fields: 'id',
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'copy the template' });
      });
    const newPresentationId = copyResponse.data.id;
    if (!newPresentationId) {
      throw new Error('Google Drive copied the template but returned no file ID, so no placeholders were replaced.');
    }

    const requests = slidesRequests.buildTemplateRequests({ tableData, format: placeholder_format });
    if (requests.length > 0) {
      await slidesApi
        .batchUpdate({ accessToken: await getAccessToken(context.auth), presentationId: newPresentationId, requests })
        .catch((error: unknown) => {
          const reason = slidesApi.googleApiError({ error, action: 'replace the placeholders' }).message;
          throw new Error(
            `${reason} The copy was created (${slidesApi.presentationUrl(newPresentationId)}) but its placeholders were not replaced.`
          );
        });
    }

    return {
      presentationId: newPresentationId,
      presentationUrl: slidesApi.presentationUrl(newPresentationId),
    };
  },
});
