import { OutputSchema } from '@activepieces/pieces-framework';

const capture: OutputSchema = {
    fields: [
        { key: 'file', label: 'File', format: 'url', description: 'Pass this to any step that takes a file, such as an email attachment or a cloud storage upload.' },
        { key: 'file_name', label: 'File Name' },
        { key: 'format', label: 'Format' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'size_bytes', label: 'Size', format: 'filesize' },
        { key: 'source', label: 'Source', description: 'url, html or markdown.' },
        { key: 'page_url', label: 'Page URL', format: 'url' },
        { key: 'served_from_cache', label: 'Served From Stored Copy', format: 'boolean', description: 'True when a stored copy was returned, which does not use a capture.' },
        { key: 'captures_remaining', label: 'Captures Remaining', format: 'number', description: 'Captures left this month after this one.' },
        { key: 'render_time_ms', label: 'Render Time (ms)', format: 'number' },
        { key: 'request_id', label: 'Request ID', description: 'Quote this when contacting SnapRender support.' },
    ],
};

const extract: OutputSchema = {
    fields: [
        { key: 'content', label: 'Content', description: 'Markdown, text or HTML of the page, or the body of the main article as Markdown. Empty for Links and Metadata.' },
        { key: 'url', label: 'Page URL', format: 'url' },
        { key: 'type', label: 'Extracted' },
        { key: 'word_count', label: 'Word Count', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'excerpt', label: 'Excerpt' },
        { key: 'description', label: 'Meta Description' },
        { key: 'canonical_url', label: 'Canonical URL', format: 'url' },
        { key: 'og_title', label: 'Open Graph Title' },
        { key: 'og_description', label: 'Open Graph Description' },
        { key: 'og_image', label: 'Open Graph Image', format: 'image' },
        { key: 'og_url', label: 'Open Graph URL', format: 'url' },
        { key: 'og_type', label: 'Open Graph Type' },
        { key: 'twitter_card', label: 'Twitter Card' },
        { key: 'twitter_title', label: 'Twitter Title' },
        { key: 'twitter_description', label: 'Twitter Description' },
        { key: 'twitter_image', label: 'Twitter Image', format: 'image' },
        {
            key: 'links',
            label: 'Links',
            labelKey: 'text',
            listItems: [
                { key: 'url', label: 'URL', format: 'url' },
                { key: 'text', label: 'Link Text' },
            ],
        },
        { key: 'link_count', label: 'Link Count', format: 'number' },
        { key: 'processing_time_ms', label: 'Processing Time (ms)', format: 'number' },
    ],
};

const batch: OutputSchema = {
    fields: [
        { key: 'job_id', label: 'Job ID', description: 'Use it in Get Batch Status.' },
        { key: 'status', label: 'Status', description: 'pending, processing, completed or failed.' },
        { key: 'finished', label: 'Finished', format: 'boolean' },
        { key: 'total', label: 'Total Pages', format: 'number' },
        { key: 'completed', label: 'Captured', format: 'number' },
        { key: 'failed', label: 'Failed', format: 'number' },
        { key: 'estimated_seconds', label: 'Estimated Seconds', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'completed_at', label: 'Completed At', format: 'datetime' },
        { key: 'download_urls', label: 'Download Links', description: 'Links of all finished captures. They expire after 24 hours.' },
        {
            key: 'items',
            label: 'Pages',
            labelKey: 'url',
            listItems: [
                { key: 'url', label: 'Page URL', format: 'url' },
                { key: 'status', label: 'Status' },
                { key: 'download_url', label: 'Download Link', format: 'url' },
                { key: 'error', label: 'Error' },
            ],
        },
    ],
};

const cache: OutputSchema = {
    fields: [
        { key: 'cached', label: 'Stored Copy Exists', format: 'boolean' },
        { key: 'url', label: 'Page URL', format: 'url' },
        { key: 'cached_at', label: 'Stored At', format: 'datetime' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
        { key: 'content_type', label: 'Content Type' },
    ],
};

const usage: OutputSchema = {
    fields: [
        { key: 'plan', label: 'Plan' },
        { key: 'captures_used', label: 'Captures Used', format: 'number' },
        { key: 'captures_limit', label: 'Monthly Limit', format: 'number' },
        { key: 'captures_remaining', label: 'Captures Remaining', format: 'number' },
        { key: 'extra_credits', label: 'Extra Credits', format: 'number' },
        { key: 'period_start', label: 'Period Start', format: 'datetime' },
        { key: 'period_end', label: 'Period End', format: 'datetime' },
    ],
};

const signedUrl: OutputSchema = {
    fields: [
        { key: 'signed_url', label: 'Screenshot Link', format: 'url' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
        { key: 'expires_in_seconds', label: 'Valid For (seconds)', format: 'number' },
    ],
};

export const snaprenderOutputSchemas = {
    capture,
    extract,
    batch,
    cache,
    usage,
    signedUrl,
};
