import { OutputSchema } from '@activepieces/pieces-framework';

const storedFileFields: OutputSchema['fields'] = [
    {
        key: 'file',
        label: 'File',
        format: 'url',
        description: 'The converted file, stored in Activepieces. Pass this to any step that takes a file input.',
    },
    {
        key: 'file_name',
        label: 'File Name',
        description: 'Name of the output file, including its extension.',
    },
    {
        key: 'file_extension',
        label: 'File Extension',
        description: 'Extension of the output file without the dot, such as pdf or jpg. Empty when ConvertAPI does not report one.',
    },
    {
        key: 'file_size',
        label: 'File Size',
        format: 'filesize',
        description: 'Size of the output file in bytes.',
    },
];

export const mergePdfOutputSchema: OutputSchema = {
    fields: [
        ...storedFileFields,
        {
            key: 'conversion_cost',
            label: 'Conversion Cost',
            format: 'number',
            description: 'How many ConvertAPI conversions this merge used. Empty when ConvertAPI does not report it.',
        },
    ],
};

export const splitPdfOutputSchema: OutputSchema = {
    itemLabel: '{file_name}',
    fields: [
        {
            key: 'parts',
            label: 'PDF Parts',
            value: '',
            labelKey: 'file_name',
            description: 'One stored PDF per part, in page order.',
            listItems: storedFileFields,
        },
    ],
};

export const convertFileOutputSchema: OutputSchema = {
    itemLabel: '{file_name}',
    fields: [
        {
            key: 'files',
            label: 'Converted Files',
            value: '',
            labelKey: 'file_name',
            description: 'One stored file per output. Most conversions produce a single file; some, like PDF to JPG, produce one per page.',
            listItems: storedFileFields,
        },
    ],
};
