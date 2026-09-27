import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { dateConvertSchemas } from '../../common/output-schemas/date-convert';

export const convertCsvToJsonAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'convert_csv_to_json',
    classification: 'READ',
    displayName: 'Convert CSV to JSON',
    description: 'Turn CSV text into a list of rows you can loop over.',
    audience: 'both',
    aiMetadata: {
        description:
            'Parse CSV text into a list of JSON objects, one per row, keyed by the header row unless the first row is data. Pass the CSV content itself, not a file or URL. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        csv: Property.LongText({
            displayName: 'CSV',
            description: 'The CSV content to convert, including the header row.',
            required: true,
        }),
        delimiter: Property.StaticDropdown({
            displayName: 'Delimiter',
            description: 'The character that separates columns.',
            required: true,
            defaultValue: 'auto',
            options: {
                options: [
                    { label: 'Detect automatically', value: 'auto' },
                    { label: 'Comma (,)', value: ',' },
                    { label: 'Semicolon (;)', value: ';' },
                    { label: 'Tab', value: '\t' },
                    { label: 'Pipe (|)', value: '|' },
                ],
            },
        }),
        noHeader: Property.Checkbox({
            displayName: 'First Row Is Data',
            description: 'Turn on when the CSV has no header row; columns become field1, field2.',
            required: false,
            defaultValue: false,
        }),
        trim: Property.Checkbox({
            displayName: 'Trim Spaces',
            description: 'Remove spaces around each value.',
            required: false,
            defaultValue: true,
        }),
        ignoreEmpty: Property.Checkbox({
            displayName: 'Skip Empty Values',
            description: 'Leave empty cells out of each row instead of returning empty text.',
            required: false,
            defaultValue: false,
        }),
    },
    outputSchema: dateConvertSchemas.csvToJson,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<CsvToJsonResponse>({
            apiKey: auth.secret_text,
            path: '/convert/csv/json',
            body: {
                csv: propsValue.csv,
                delimiter: propsValue.delimiter === 'auto' ? 'auto' : [propsValue.delimiter],
                noheader: propsValue.noHeader ?? false,
                trim: propsValue.trim ?? true,
                ignoreEmpty: propsValue.ignoreEmpty ?? false,
            },
        });
        return response.json ?? [];
    },
});

type CsvToJsonResponse = {
    json?: unknown[];
};
