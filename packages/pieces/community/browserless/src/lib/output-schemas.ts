import { OutputSchema } from '@activepieces/pieces-framework';

const siteFields: Fields = [
    { key: 'site_status_code', label: 'Site Status Code', format: 'number', description: 'HTTP status the target site answered with (from X-Response-Code).' },
    { key: 'site_status_text', label: 'Site Status Text' },
    { key: 'final_url', label: 'Final URL', format: 'url', description: 'The page address after redirects.' },
];

const metricFields: Fields = [
    { key: 'value', label: 'Value' },
    { key: 'numericValue', label: 'Numeric Value', format: 'number' },
    { key: 'score', label: 'Score (0-100)', format: 'number' },
];

const crawlPageFields: Fields = [
    { key: 'url', label: 'Page URL', format: 'url' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Page Status' },
    { key: 'status_code', label: 'HTTP Status', format: 'number' },
    { key: 'language', label: 'Language' },
    { key: 'scraped_at', label: 'Scraped At', format: 'datetime' },
    { key: 'error', label: 'Error' },
    { key: 'content_url', label: 'Content Link', format: 'url', description: 'Temporary link to the scraped content JSON; it expires with the crawl.' },
];

const crawlSummaryFields: Fields = [
    { key: 'id', label: 'Crawl ID' },
    { key: 'url', label: 'Start URL', format: 'url' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Pages Found', format: 'number' },
    { key: 'completed', label: 'Pages Completed', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completed_at', label: 'Completed At', format: 'datetime' },
];

const captureScreenshot: OutputSchema = {
    fields: [
        { key: 'file', label: 'Screenshot File', format: 'url', description: 'Pass this to steps that take a file.' },
        { key: 'success', label: 'Success', format: 'boolean' },
        {
            key: 'metadata',
            label: 'Details',
            children: [
                { key: 'url', label: 'Page URL', format: 'url' },
                { key: 'type', label: 'Image Type' },
                { key: 'fullPage', label: 'Full Page', format: 'boolean' },
                { key: 'fileName', label: 'File Name' },
                { key: 'contentType', label: 'Content Type' },
                { key: 'sizeBytes', label: 'Size', format: 'filesize' },
                { key: 'siteStatusCode', label: 'Site Status Code', format: 'number' },
                { key: 'finalUrl', label: 'Final URL', format: 'url' },
                { key: 'timestamp', label: 'Captured At', format: 'datetime' },
            ],
        },
        { key: 'screenshotBase64', label: 'Screenshot (Base64)', description: 'The image as base64 text. Prefer the file for large images.' },
    ],
};

const generatePdf: OutputSchema = {
    fields: [
        { key: 'file', label: 'PDF File', format: 'url', description: 'Pass this to steps that take a file.' },
        { key: 'success', label: 'Success', format: 'boolean' },
        {
            key: 'metadata',
            label: 'Details',
            children: [
                { key: 'source', label: 'Source (url or html)' },
                { key: 'url', label: 'Page URL', format: 'url' },
                { key: 'format', label: 'Paper Format' },
                { key: 'landscape', label: 'Landscape', format: 'boolean' },
                { key: 'fileName', label: 'File Name' },
                { key: 'sizeBytes', label: 'Size', format: 'filesize' },
                { key: 'siteStatusCode', label: 'Site Status Code', format: 'number' },
                { key: 'timestamp', label: 'Generated At', format: 'datetime' },
            ],
        },
        { key: 'pdfBase64', label: 'PDF (Base64)', description: 'The PDF as base64 text. Prefer the file for large documents.' },
    ],
};

const scrapeUrl: OutputSchema = {
    fields: [
        {
            key: 'elements',
            label: 'Elements',
            value: 'data.data',
            labelKey: 'selector',
            listItems: [
                { key: 'selector', label: 'Selector' },
                {
                    key: 'results',
                    label: 'Matches',
                    labelKey: 'text',
                    listItems: [
                        { key: 'text', label: 'Text' },
                        { key: 'html', label: 'HTML', format: 'html' },
                        {
                            key: 'attributes',
                            label: 'Attributes',
                            labelKey: 'name',
                            listItems: [
                                { key: 'name', label: 'Name' },
                                { key: 'value', label: 'Value' },
                            ],
                        },
                        { key: 'width', label: 'Width', format: 'number' },
                        { key: 'height', label: 'Height', format: 'number' },
                        { key: 'top', label: 'Top', format: 'number' },
                        { key: 'left', label: 'Left', format: 'number' },
                    ],
                },
            ],
        },
        {
            key: 'metadata',
            label: 'Details',
            children: [
                { key: 'url', label: 'Page URL', format: 'url' },
                { key: 'elementsCount', label: 'Selectors Requested', format: 'number' },
                ...siteFields,
                { key: 'timestamp', label: 'Scraped At', format: 'datetime' },
            ],
        },
        { key: 'success', label: 'Success', format: 'boolean' },
    ],
};

const runBqlQuery: OutputSchema = {
    fields: [
        { key: 'data', label: 'Query Data', description: 'The data returned by the BQL query, shaped by your query fields.' },
        {
            key: 'errors',
            label: 'Errors',
            labelKey: 'message',
            listItems: [{ key: 'message', label: 'Message' }],
        },
        {
            key: 'metadata',
            label: 'Details',
            children: [
                { key: 'executionTime', label: 'Execution Time' },
                { key: 'stealth', label: 'Stealth', format: 'boolean' },
                { key: 'timestamp', label: 'Ran At', format: 'datetime' },
            ],
        },
        { key: 'success', label: 'Success', format: 'boolean' },
    ],
};

const getWebsitePerformance: OutputSchema = {
    fields: [
        {
            key: 'scores',
            label: 'Scores (0-100)',
            value: 'summary.scores',
            children: [
                { key: 'performance', label: 'Performance', format: 'number' },
                { key: 'accessibility', label: 'Accessibility', format: 'number' },
                { key: 'bestPractices', label: 'Best Practices', format: 'number' },
                { key: 'seo', label: 'SEO', format: 'number' },
            ],
        },
        {
            key: 'metrics',
            label: 'Metrics',
            value: 'summary.metrics',
            children: [
                { key: 'firstContentfulPaint', label: 'First Contentful Paint', children: metricFields },
                { key: 'largestContentfulPaint', label: 'Largest Contentful Paint', children: metricFields },
                { key: 'speedIndex', label: 'Speed Index', children: metricFields },
                { key: 'timeToInteractive', label: 'Time to Interactive', children: metricFields },
                { key: 'totalBlockingTime', label: 'Total Blocking Time', children: metricFields },
                { key: 'cumulativeLayoutShift', label: 'Cumulative Layout Shift', children: metricFields },
            ],
        },
        {
            key: 'opportunities',
            label: 'Opportunities',
            value: 'summary.opportunities',
            labelKey: 'title',
            listItems: [
                { key: 'type', label: 'Type' },
                { key: 'title', label: 'Title' },
                { key: 'potentialSavings', label: 'Potential Savings' },
            ],
        },
        { key: 'url', label: 'URL', value: 'summary.url', format: 'url' },
        { key: 'finalUrl', label: 'Final URL', value: 'summary.finalUrl', format: 'url' },
        { key: 'formFactor', label: 'Device', value: 'summary.formFactor' },
        { key: 'runtimeError', label: 'Lighthouse Error', value: 'summary.runtimeError' },
        { key: 'lighthouseVersion', label: 'Lighthouse Version', value: 'metadata.lighthouseVersion' },
        { key: 'timestamp', label: 'Audited At', value: 'summary.timestamp', format: 'datetime' },
        { key: 'success', label: 'Success', format: 'boolean' },
    ],
};

const getPageContent: OutputSchema = {
    fields: [
        { key: 'html', label: 'HTML', format: 'html' },
        { key: 'html_length', label: 'Full HTML Length (characters)', format: 'number' },
        { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the HTML was cut to Maximum Characters.' },
        { key: 'url', label: 'Requested URL', format: 'url' },
        ...siteFields,
    ],
};

const smartScrape: OutputSchema = {
    fields: [
        { key: 'markdown', label: 'Markdown' },
        { key: 'raw_text', label: 'Plain Text' },
        { key: 'html', label: 'HTML', format: 'html' },
        { key: 'content', label: 'Other Content', description: 'Parsed JSON or extracted PDF text when the URL is not an HTML page.' },
        { key: 'title', label: 'Page Title' },
        { key: 'description', label: 'Page Description' },
        { key: 'language', label: 'Language' },
        { key: 'source_url', label: 'Source URL', format: 'url' },
        { key: 'status_code', label: 'HTTP Status', format: 'number' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'strategy', label: 'Strategy Used', description: 'http-fetch, http-proxy, browser or browser-captcha.' },
        { key: 'attempted_strategies', label: 'Strategies Tried' },
        { key: 'links', label: 'Links' },
        { key: 'links_count', label: 'Links Count', format: 'number' },
        { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when a text field was cut to Maximum Characters.' },
        { key: 'screenshot_file', label: 'Screenshot File', format: 'url' },
        { key: 'pdf_file', label: 'PDF File', format: 'url' },
        { key: 'url', label: 'Requested URL', format: 'url' },
    ],
};

const searchWeb: OutputSchema = {
    fields: [
        {
            key: 'results',
            label: 'Results',
            labelKey: 'title',
            listItems: [
                { key: 'title', label: 'Title' },
                { key: 'url', label: 'URL', format: 'url' },
                { key: 'description', label: 'Snippet' },
                { key: 'source', label: 'Source (web, news, images)' },
                { key: 'position', label: 'Position', format: 'number' },
                { key: 'date', label: 'Date' },
                { key: 'image_url', label: 'Image', format: 'image' },
                { key: 'markdown', label: 'Page Markdown' },
                { key: 'html', label: 'Page HTML', format: 'html' },
                { key: 'links', label: 'Page Links' },
                { key: 'page_status_code', label: 'Page HTTP Status', format: 'number' },
                { key: 'page_error', label: 'Page Error' },
                { key: 'truncated', label: 'Page Content Truncated', format: 'boolean' },
            ],
        },
        { key: 'result_count', label: 'Results Returned', format: 'number' },
        { key: 'total_results', label: 'Total Results', format: 'number' },
        { key: 'no_results', label: 'No Results', format: 'boolean' },
        { key: 'query', label: 'Query' },
    ],
};

const mapWebsite: OutputSchema = {
    fields: [
        {
            key: 'links',
            label: 'URLs',
            labelKey: 'url',
            listItems: [
                { key: 'url', label: 'URL', format: 'url' },
                { key: 'title', label: 'Title' },
                { key: 'description', label: 'Description' },
            ],
        },
        { key: 'count', label: 'URL Count', format: 'number' },
        { key: 'url', label: 'Website', format: 'url' },
    ],
};

const startCrawl: OutputSchema = {
    fields: [
        { key: 'crawl_id', label: 'Crawl ID', description: 'Pass this to Get Crawl Results or Cancel Crawl.' },
        { key: 'status', label: 'Status' },
        { key: 'url', label: 'Start URL', format: 'url' },
    ],
};

const getCrawl: OutputSchema = {
    fields: [
        { key: 'status', label: 'Status', description: 'in-progress, completed, failed or cancelled.' },
        { key: 'total', label: 'Pages Found', format: 'number' },
        { key: 'completed', label: 'Pages Completed', format: 'number' },
        { key: 'failed', label: 'Pages Failed', format: 'number' },
        {
            key: 'pages',
            label: 'Pages',
            labelKey: 'url',
            listItems: crawlPageFields,
        },
        { key: 'page_count', label: 'Pages in This Batch', format: 'number' },
        { key: 'has_more', label: 'Has More', format: 'boolean' },
        { key: 'next_skip', label: 'Next Skip', format: 'number', description: 'Pass as Skip to read the next batch.' },
        { key: 'skip', label: 'Skipped Pages', format: 'number' },
        { key: 'expires_at', label: 'Results Expire At', format: 'datetime' },
        { key: 'crawl_id', label: 'Crawl ID' },
    ],
};

const listCrawls: OutputSchema = {
    fields: [
        {
            key: 'crawls',
            label: 'Crawls',
            labelKey: 'url',
            listItems: crawlSummaryFields,
        },
        { key: 'count', label: 'Count', format: 'number' },
        { key: 'has_more', label: 'Has More', format: 'boolean' },
        { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to read the next batch.' },
    ],
};

const cancelCrawl: OutputSchema = {
    fields: [
        { key: 'crawl_id', label: 'Crawl ID' },
        { key: 'cancelled', label: 'Cancelled', format: 'boolean', description: 'False when the crawl had already finished.' },
        { key: 'status', label: 'Status' },
        { key: 'message', label: 'Message' },
    ],
};

const unblockPage: OutputSchema = {
    fields: [
        { key: 'html', label: 'HTML', format: 'html' },
        { key: 'html_length', label: 'Full HTML Length (characters)', format: 'number' },
        { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the HTML was cut to Maximum Characters.' },
        { key: 'solved', label: 'Challenge Solved', format: 'boolean' },
        {
            key: 'cookies',
            label: 'Cookies',
            labelKey: 'name',
            listItems: [
                { key: 'name', label: 'Name' },
                { key: 'value', label: 'Value' },
                { key: 'domain', label: 'Domain' },
                { key: 'path', label: 'Path' },
                { key: 'expires', label: 'Expires (Unix seconds)', format: 'number' },
                { key: 'http_only', label: 'HTTP Only', format: 'boolean' },
                { key: 'secure', label: 'Secure', format: 'boolean' },
                { key: 'same_site', label: 'SameSite' },
            ],
        },
        { key: 'cookie_count', label: 'Cookie Count', format: 'number' },
        { key: 'cookie_header', label: 'Cookie Header', description: 'All cookies as one name=value; string for a Cookie header.' },
        { key: 'screenshot_file', label: 'Screenshot File', format: 'url' },
        { key: 'url', label: 'URL', format: 'url' },
    ],
};

const auditPagePerformance: OutputSchema = {
    fields: [
        {
            key: 'scores',
            label: 'Scores (0-100)',
            children: [
                { key: 'performance', label: 'Performance', format: 'number' },
                { key: 'accessibility', label: 'Accessibility', format: 'number' },
                { key: 'bestPractices', label: 'Best Practices', format: 'number' },
                { key: 'seo', label: 'SEO', format: 'number' },
            ],
        },
        {
            key: 'metrics',
            label: 'Metrics',
            children: [
                { key: 'firstContentfulPaint', label: 'First Contentful Paint', children: metricFields },
                { key: 'largestContentfulPaint', label: 'Largest Contentful Paint', children: metricFields },
                { key: 'speedIndex', label: 'Speed Index', children: metricFields },
                { key: 'timeToInteractive', label: 'Time to Interactive', children: metricFields },
                { key: 'totalBlockingTime', label: 'Total Blocking Time', children: metricFields },
                { key: 'cumulativeLayoutShift', label: 'Cumulative Layout Shift', children: metricFields },
            ],
        },
        {
            key: 'opportunities',
            label: 'Opportunities',
            labelKey: 'title',
            listItems: [
                { key: 'type', label: 'Type' },
                { key: 'title', label: 'Title' },
                { key: 'potentialSavings', label: 'Potential Savings' },
            ],
        },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'finalUrl', label: 'Final URL', format: 'url' },
        { key: 'formFactor', label: 'Device' },
        { key: 'runtimeError', label: 'Lighthouse Error' },
        { key: 'lighthouseVersion', label: 'Lighthouse Version' },
        { key: 'timestamp', label: 'Audited At', format: 'datetime' },
    ],
};

const fileOnly: OutputSchema = {
    fields: [
        { key: 'file', label: 'File', format: 'url', description: 'Pass this to steps that take a file.' },
        { key: 'file_name', label: 'File Name' },
        { key: 'size_bytes', label: 'Size', format: 'filesize' },
        { key: 'mime_type', label: 'MIME Type' },
        { key: 'source', label: 'Source (URL or html)' },
        { key: 'site_status_code', label: 'Site Status Code', format: 'number' },
    ],
};

const runFunction: OutputSchema = {
    fields: [
        { key: 'result', label: 'Result', description: 'What your function returned (JSON or text).' },
        { key: 'file', label: 'Result File', format: 'url', description: 'Set when the function returned binary data such as a PDF or image.' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'size_bytes', label: 'Size', format: 'filesize' },
    ],
};

export const browserlessOutputSchemas = {
    captureScreenshot,
    generatePdf,
    scrapeUrl,
    runBqlQuery,
    getWebsitePerformance,
    getPageContent,
    smartScrape,
    searchWeb,
    mapWebsite,
    startCrawl,
    getCrawl,
    listCrawls,
    cancelCrawl,
    unblockPage,
    runFunction,
    fileOnly,
    auditPagePerformance,
};

type Fields = OutputSchema['fields'];
