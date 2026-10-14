import { OutputSchema } from '@activepieces/pieces-framework';

export const filesStorageOutputSchemas = {
    pdfPageCount: {
        fields: [{ key: 'page_count', label: 'Page Count', format: 'number' }],
    },
    createdPdf: {
        fields: savedFileFields(),
    },
    mergedPdf: {
        fields: [
            ...savedFileFields(),
            { key: 'merged_count', label: 'PDFs Merged', format: 'number', description: 'How many PDFs were combined into the file.' },
        ],
    },
    splitPdf: {
        itemLabel: '{file_name}',
        fields: [
            {
                key: 'parts',
                label: 'PDF Parts',
                value: '',
                description: 'One saved PDF per part, in page order.',
                listItems: savedFileFields(),
            },
        ],
    },
    generatedQrCode: {
        fields: [
            ...savedFileFields(),
            {
                key: 'image_url',
                label: 'Hosted Image URL',
                format: 'image',
                description: 'Public link to the QR code image when 0CodeKit hosts it. Empty when the image was returned directly.',
            },
        ],
    },
    decodedQrCode: {
        fields: [{ key: 'data', label: 'Decoded Data', description: 'The text or link stored in the QR code.' }],
    },
    imageExif: {
        fields: [
            {
                key: 'exif_data',
                label: 'EXIF Data',
                description:
                    'Metadata read from the image, grouped by section (such as image, EXIF and GPS). The sections and tags depend on the camera and file type, so every tag found is shown. Empty when the image has no EXIF data.',
            },
        ],
    },
    temporaryFile: {
        fields: [
            { key: 'url', label: 'Temporary File URL', format: 'url', description: 'Public link to the uploaded file. It expires after 24 hours.' },
            { key: 'file_name', label: 'File Name' },
        ],
    },
    globalVariable: {
        fields: variableFields(),
    },
    globalVariableList: {
        fields: [
            { key: 'count', label: 'Variable Count', format: 'number' },
            { key: 'variables', label: 'Variables', labelKey: 'variable_name', listItems: variableFields() },
        ],
    },
    deletedGlobalVariable: {
        fields: [
            { key: 'deleted', label: 'Deleted', format: 'boolean' },
            { key: 'variable_name', label: 'Variable Name' },
            { key: 'message', label: 'Message' },
        ],
    },
    addedPermFile: {
        fields: [
            { key: 'file_id', label: 'File ID' },
            { key: 'url', label: 'File URL', format: 'url' },
            { key: 'file_name', label: 'File Name' },
        ],
    },
    permFile: {
        fields: [
            { key: 'file_id', label: 'File ID' },
            { key: 'url', label: 'File URL', format: 'url' },
            {
                key: 'file',
                label: 'File',
                format: 'url',
                description: 'Reference to the downloaded file saved in Activepieces. Empty when Link Only is turned on.',
            },
            { key: 'file_name', label: 'File Name', description: 'Empty when Link Only is turned on.' },
            { key: 'size_bytes', label: 'File Size', format: 'filesize', description: 'Empty when Link Only is turned on.' },
        ],
    },
    deletedPermFile: {
        fields: [
            { key: 'deleted', label: 'Deleted', format: 'boolean' },
            { key: 'file_id', label: 'File ID' },
            { key: 'message', label: 'Message' },
        ],
    },
    permFileList: {
        fields: [
            { key: 'count', label: 'File Count', format: 'number' },
            {
                key: 'available_storage_kib',
                label: 'Available Storage (KiB)',
                format: 'number',
                description: 'Remaining perm storage on the account, in kibibytes.',
            },
            {
                key: 'files',
                label: 'Files',
                labelKey: 'file_name',
                listItems: [
                    { key: 'file_id', label: 'File ID' },
                    { key: 'file_name', label: 'File Name' },
                    { key: 'url', label: 'File URL', format: 'url' },
                    { key: 'size_kib', label: 'Size (KiB)', format: 'number' },
                ],
            },
        ],
    },
} satisfies Record<string, OutputSchema>;

function savedFileFields(): OutputSchema['fields'] {
    return [
        {
            key: 'file',
            label: 'File',
            format: 'url',
            description: 'Reference to the file saved in Activepieces. Pass it to any step that accepts a file.',
        },
        { key: 'file_name', label: 'File Name' },
        { key: 'size_bytes', label: 'File Size', format: 'filesize' },
    ];
}

function variableFields(): OutputSchema['fields'] {
    return [
        { key: 'variable_name', label: 'Variable Name' },
        { key: 'variable_value', label: 'Variable Value' },
    ];
}
