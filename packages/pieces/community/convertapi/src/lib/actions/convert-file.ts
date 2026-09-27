import { createAction, Property } from '@activepieces/pieces-framework';
import { convertApiAuth } from '../auth';
import { convertApi } from '../common/client';
import { converterInfo } from '../common/converters';
import { inputFiles } from '../common/input-files';
import { convertFileOutputSchema } from '../output-schemas';

export const convertFileAction = createAction({
    auth: convertApiAuth,
    name: 'convert_file',
    classification: 'WRITE',
    displayName: 'Convert File',
    description: 'Convert a file to another format with any of ConvertAPI\'s converters, such as Word to PDF or PDF to JPG.',
    audience: 'both',
    aiMetadata: {
        description:
            'Converts a file between formats with any ConvertAPI converter (Office, PDF, images, HTML, CAD, email and more) and returns a list with one stored file per output, since some conversions produce several files (for example one image per PDF page). Prefer Merge PDF Files or Split PDF File for those PDF jobs. Each call uses ConvertAPI conversions and creates new output files.',
        idempotent: false,
    },
    props: {
        from: Property.Dropdown({
            auth: convertApiAuth,
            displayName: 'From Format',
            description: 'The format of the file you are converting.',
            required: true,
            refreshers: [],
            options: async () => {
                const converters = await converterInfo.fetchConverters();
                const options = converterInfo.sourceOptions(converters);
                if (options.length === 0) {
                    return { disabled: true, options: [], placeholder: 'Could not load formats from ConvertAPI' };
                }
                return { disabled: false, options };
            },
        }),
        to: Property.Dropdown({
            auth: convertApiAuth,
            displayName: 'To Format',
            description: 'What to convert the file into.',
            required: true,
            refreshers: ['from'],
            options: async ({ from }) => {
                if (typeof from !== 'string' || from.length === 0) {
                    return { disabled: true, options: [], placeholder: 'Select a From Format first' };
                }
                const converters = await converterInfo.fetchConverters({ from });
                const options = converterInfo.destinationOptions({ converters, from });
                if (options.length === 0) {
                    return { disabled: true, options: [], placeholder: 'No conversions available for this format' };
                }
                return { disabled: false, options };
            },
        }),
        file: Property.File({
            displayName: 'File',
            description: 'The file to convert.',
            required: true,
        }),
        additionalFiles: Property.Array({
            displayName: 'Additional Files',
            description: 'Files to add after the main one, for converters that combine files.',
            required: false,
            properties: {
                file: Property.File({
                    displayName: 'File',
                    required: true,
                }),
            },
        }),
        options: Property.DynamicProperties({
            auth: convertApiAuth,
            displayName: 'Conversion Options',
            description: 'Options of the chosen converter. Leave empty for the defaults.',
            required: false,
            refreshers: ['from', 'to'],
            props: async ({ from, to }) => {
                if (typeof from !== 'string' || typeof to !== 'string' || from.length === 0 || to.length === 0) {
                    return {};
                }
                const converter = await converterInfo.fetchConverter({ from, to });
                return converterInfo.optionProps(converter);
            },
        }),
    },
    outputSchema: convertFileOutputSchema,
    async run({ auth, propsValue, files }) {
        const converter = await converterInfo.fetchConverter({ from: propsValue.from, to: propsValue.to });
        const mainInput = converterInfo.mainInputOf(converter);
        if (mainInput === undefined) {
            throw new Error(`The ${propsValue.from} to ${propsValue.to} converter does not take a file as input.`);
        }
        const additional = inputFiles.fromArrayItems({ items: propsValue.additionalFiles, key: 'file' });
        if (!mainInput.multiple && additional.length > 0) {
            throw new Error(`The ${propsValue.from} to ${propsValue.to} converter takes a single file. Remove the Additional Files.`);
        }

        const result = await convertApi.convertFiles({
            apiKey: auth.secret_text,
            from: propsValue.from,
            to: propsValue.to,
            fileInputs: [
                { name: mainInput.name, files: [propsValue.file, ...additional], multiple: mainInput.multiple },
            ],
            parameters: convertApi.toValueParameters(
                withDefaultFileName({ options: propsValue.options ?? {}, inputName: propsValue.file.filename }),
            ),
            files,
        });

        return result.files;
    },
});

function withDefaultFileName({
    options,
    inputName,
}: {
    options: Record<string, unknown>;
    inputName: string;
}): Record<string, unknown> {
    const current = options['FileName'];
    const hasFileName = typeof current === 'string' && current.trim() !== '';
    if (hasFileName || !inputName.startsWith('unknown.')) {
        return options;
    }
    return { ...options, FileName: 'converted' };
}
