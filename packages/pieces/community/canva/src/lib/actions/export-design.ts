import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const exportDesignAction = createAction({
    auth: canvaAuth,
    name: 'export_design',
    displayName: 'Export Design',
    description: 'Exports a Canva design to PDF, JPG, PNG, GIF, PPTX, or MP4 format.',
    props: {
        designId: Property.ShortText({
            displayName: 'Design ID',
            description: 'The ID of the design you want to export.',
            required: true,
        }),
        format: Property.StaticDropdown({
            displayName: 'Export Format',
            description: 'Select the file format for export.',
            required: true,
            options: {
                options: [
                    { label: 'PDF', value: 'pdf' },
                    { label: 'JPG', value: 'jpg' },
                    { label: 'PNG', value: 'png' },
                    { label: 'GIF', value: 'gif' },
                    { label: 'PPTX', value: 'pptx' },
                    { label: 'MP4', value: 'mp4' },
                ],
            },
        }),
        quality: Property.ShortText({
            displayName: 'Quality',
            description: 'Required for JPG and MP4 formats. For JPG: 1-100. For MP4: horizontal_480p, vertical_720p, etc.',
            required: false,
        }),
        exportQuality: Property.StaticDropdown({
            displayName: 'Export Quality',
            description: 'Export quality. Pro quality requires Canva Pro.',
            required: false,
            options: {
                options: [
                    { label: 'Regular', value: 'regular' },
                    { label: 'Pro', value: 'pro' },
                ],
            },
        }),
        size: Property.StaticDropdown({
            displayName: 'PDF Paper Size',
            description: 'Applies to PDF exports. Paper size to use.',
            required: false,
            options: {
                options: [
                    { label: 'A4', value: 'a4' },
                    { label: 'A3', value: 'a3' },
                    { label: 'Letter', value: 'letter' },
                    { label: 'Legal', value: 'legal' },
                ],
            },
        }),
        pages: Property.Array({
            displayName: 'Pages to Export',
            description: 'Optional. Specify which pages to export. Leave empty to export all pages.',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Export Height (px)',
            description: 'Optional. Height of exported image (Min: 40, Max: 25000).',
            required: false
        }),
        width: Property.Number({
            displayName: 'Export Width (px)',
            description: 'Optional. Width of exported image (Min: 40, Max: 25000).',
            required: false
        }),
        lossless: Property.Checkbox({
            displayName: 'Lossless (PNG Only)',
            description: 'Export PNG with lossless quality. Only for Canva Pro users.',
            required: false,
            defaultValue: true,
        }),
        transparentBackground: Property.Checkbox({
            displayName: 'Transparent Background (PNG Only)',
            description: 'Export PNG with a transparent background. Only for Canva Pro users.',
            required: false,
            defaultValue: false,
        }),
        asSingleImage: Property.Checkbox({
            displayName: 'As Single Image (PNG Only)',
            description: 'Merge multi-page design into a single image.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const props = context.propsValue;

        const body: Record<string, unknown> = {
            design_id: props.designId,
            format: {
                type: props.format,
            },
        };

        if (props.quality) {
            body['quality'] = props.quality;
        }

        if (props.exportQuality) {
            body['export_quality'] = props.exportQuality;
        }

        if (props.size) {
            body['size'] = props.size;
        }

        if (props.pages && props.pages.length > 0) {
            body['pages'] = props.pages;
        }

        if (props.height) {
            body['height'] = props.height;
        }

        if (props.width) {
            body['width'] = props.width;
        }

        if (props.format === 'png') {
            body['lossless'] = props.lossless ?? true;
            body['transparent_background'] = props.transparentBackground ?? false;
            body['as_single_image'] = props.asSingleImage ?? false;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/rest/v1/exports`,
            body,
            headers: {
                'Content-Type': 'application/json',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
