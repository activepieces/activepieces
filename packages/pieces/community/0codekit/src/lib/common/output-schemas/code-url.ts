import { OutputSchema } from '@activepieces/pieces-framework';

export const zeroCodeKitCodeUrlOutputSchemas = {
    codeResult: {
        fields: [
            {
                key: 'result',
                label: 'Result',
                description: 'Whatever your code returned. Empty when the code returned nothing.',
            },
        ],
    },
    cryptoEncrypt: {
        fields: [
            {
                key: 'encrypted_text',
                label: 'Encrypted Text',
                description: 'Decrypt it with the same algorithm and secret key.',
            },
        ],
    },
    cryptoDecrypt: {
        fields: [{ key: 'decrypted_text', label: 'Decrypted Text' }],
    },
    cryptoHash: {
        fields: [
            { key: 'hashed_text', label: 'Hash', description: 'The hash or HMAC signature, hex encoded.' },
            { key: 'algorithm', label: 'Algorithm' },
        ],
    },
    createScheduler: {
        fields: [
            { key: 'task_id', label: 'Scheduler ID', description: 'Use it to delete the scheduler.' },
            { key: 'next_execution', label: 'Next Run', format: 'datetime' },
            {
                key: 'end_date',
                label: 'End Date',
                format: 'datetime',
                description: 'When the scheduler stops. Empty when it runs until deleted.',
            },
        ],
    },
    listSchedulers: {
        fields: [
            { key: 'count', label: 'Count', format: 'number' },
            { key: 'schedulers', label: 'Schedulers', labelKey: 'task_id', listItems: schedulerFields() },
        ],
    },
    deleteScheduler: {
        fields: [
            { key: 'deleted', label: 'Deleted', format: 'boolean' },
            { key: 'task_id', label: 'Scheduler ID' },
            { key: 'message', label: 'Message' },
        ],
    },
    shortenedUrl: {
        fields: shortenedUrlFields(),
    },
    listShortenedUrls: {
        fields: [
            { key: 'count', label: 'Count', format: 'number' },
            {
                key: 'shortened_urls',
                label: 'Shortened URLs',
                labelKey: 'identifier',
                listItems: [...shortenedUrlFields(), { key: 'created_at', label: 'Created At', format: 'datetime' }],
            },
        ],
    },
    deleteShortenedUrl: {
        fields: [
            { key: 'deleted', label: 'Deleted', format: 'boolean' },
            { key: 'identifier', label: 'Identifier' },
            { key: 'short_url', label: 'Short URL', format: 'url' },
            { key: 'message', label: 'Message' },
        ],
    },
    urlExpander: {
        fields: [
            { key: 'short_url', label: 'Short URL', format: 'url' },
            {
                key: 'expanded_url',
                label: 'Expanded URL',
                format: 'url',
                description: 'The final URL after following every redirect. Empty when it could not be resolved.',
            },
        ],
    },
    utmBuild: {
        fields: [{ key: 'url', label: 'URL', format: 'url', description: 'The URL with the UTM parameters added.' }],
    },
    utmParse: {
        fields: [
            { key: 'utm_source', label: 'UTM Source' },
            { key: 'utm_medium', label: 'UTM Medium' },
            { key: 'utm_campaign', label: 'UTM Campaign' },
            { key: 'utm_content', label: 'UTM Content' },
            { key: 'utm_term', label: 'UTM Term' },
        ],
    },
    advancedSwitch: {
        fields: [
            { key: 'found', label: 'Found', format: 'boolean', description: 'True when at least one key matched.' },
            { key: 'count', label: 'Count', format: 'number' },
            {
                key: 'first_value',
                label: 'First Value',
                description: 'The value of the first matching key. Empty when nothing matched.',
            },
            { key: 'values', label: 'Values', description: 'The values of every matching key.' },
        ],
    },
} satisfies Record<string, OutputSchema>;

function shortenedUrlFields(): OutputSchema['fields'] {
    return [
        {
            key: 'identifier',
            label: 'Identifier',
            description: 'The ending of the short link after lyl.ai/. Use it to get, update or delete the link.',
        },
        { key: 'short_url', label: 'Short URL', format: 'url' },
        { key: 'destination', label: 'Destination', format: 'url', description: 'Where the short link redirects to.' },
    ];
}

function schedulerFields(): OutputSchema['fields'] {
    return [
        {
            key: 'task_id',
            label: 'Scheduler ID',
            description: 'Use it to delete the scheduler.',
        },
        { key: 'webhook', label: 'Webhook', format: 'url', description: 'The URL 0CodeKit calls on each run.' },
        { key: 'next_execution', label: 'Next Run', format: 'datetime' },
        { key: 'data', label: 'Data', description: 'The data sent to the webhook, as a JSON string.' },
    ];
}
