import { OutputSchema } from '@activepieces/pieces-framework';

export const addRowsOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'row_count',
            label: 'Rows Added',
            format: 'number',
            description: 'How many rows Floqer accepted and wrote. Equals the length of Row IDs.',
        },
        {
            key: 'row_ids',
            label: 'Row IDs',
            description:
                'IDs of the newly created rows, in request order. Rejected rows are not included. Pass these to Run Rows to execute them.',
        },
        {
            key: 'rows_queued_for_run',
            label: 'Rows Queued For Run',
            format: 'number',
            description:
                'How many of the new rows were queued to run. 0 when Run After Adding is "Do not run".',
        },
        {
            key: 'rejected',
            label: 'Rejected Rows',
            description:
                'Rows Floqer could not accept. The valid rows in the same batch were still written, so a non-empty list means the batch was only partly imported — branch on this if that matters.',
            listItems: [
                {
                    key: 'row',
                    label: 'Original Row',
                    description: 'The row exactly as it was sent, so it can be fixed and resent.',
                },
                {
                    key: 'errors',
                    label: 'Errors',
                    description:
                        'Why the row was rejected. Codes include malformed_row and unknown_field.',
                },
            ],
        },
        {
            key: 'warnings',
            label: 'Warnings',
            description:
                'Non-fatal issues across the batch, such as duplicate_row or value_normalized. The rows were still written.',
            listItems: [
                { key: 'field', label: 'Field' },
                { key: 'code', label: 'Code' },
                { key: 'message', label: 'Message' },
            ],
        },
    ],
};

export const runRowsOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'rows_queued',
            label: 'Rows Queued',
            format: 'number',
            description:
                'How many rows were queued through the sheet\'s action chain. Queued means accepted for execution, not finished.',
        },
    ],
};
