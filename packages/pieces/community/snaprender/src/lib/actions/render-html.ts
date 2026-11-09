import { Property, createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderCapture } from '../common/capture';
import { ALL_FORMATS, snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const renderHtml = createAction({
    auth: snaprenderAuth,
    name: 'render_html',
    classification: 'READ',
    displayName: 'Render HTML or Markdown',
    description: 'Turn your own HTML or Markdown into an image or PDF, for example a social card, a certificate or a report.',
    audience: 'both',
    aiMetadata: {
        description:
            'Renders HTML or Markdown that you supply (not a URL) in a real browser and saves the result as a PNG, JPEG, WebP or PDF file. Use it to generate images such as social cards or receipts from a template; to capture an existing web page use Take Screenshot. HTML is limited to 2 MB and Markdown to 500 KB. Each call uses one capture from the monthly quota.',
        idempotent: false,
    },
    props: {
        contentType: Property.StaticDropdown({
            displayName: 'Content Type',
            description: 'Markdown is shown with a clean built-in style. HTML is rendered as is, including your own CSS.',
            required: true,
            defaultValue: 'html',
            options: {
                options: [
                    { label: 'HTML', value: 'html' },
                    { label: 'Markdown', value: 'markdown' },
                ],
            },
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The HTML or Markdown to render. Images and fonts from public URLs load normally.',
            required: true,
        }),
        format: snaprenderProps.imageFormat({ includePdf: true, description: 'File type of the result.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: true }),
        darkMode: snaprenderProps.darkMode(),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        delay: snaprenderProps.delay(),
        quality: snaprenderProps.quality({ description: 'Image quality for JPEG, WebP and PDF, 1 to 100. Default 90. PNG ignores it.' }),
        embedDetails: snaprenderProps.embedDetails(),
        fileName: snaprenderProps.fileName({ placeholder: 'social-card' }),
    },
    outputSchema: snaprenderOutputSchemas.capture,
    async run(context) {
        const props = context.propsValue;
        const type = props.contentType === 'markdown' ? 'markdown' : 'html';
        if (!snaprenderBody.nonEmpty(props.content)) {
            throw new Error('Content is required.');
        }
        const format = snaprenderBody.format({ value: props.format ?? 'png', allowed: ALL_FORMATS });
        return snaprenderCapture.run({
            apiKey: context.auth.secret_text,
            files: context.files,
            source: { type, value: props.content },
            format,
            options: snaprenderBody.renderOptions({
                ...props,
                blockAds: false,
                blockCookieBanners: false,
                quality: format === 'png' ? undefined : props.quality,
            }),
            embedDetails: props.embedDetails,
            requestedFileName: props.fileName,
        });
    },
});

