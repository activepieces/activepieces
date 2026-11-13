import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const usageFields: OutputSchemaField[] = [
  { key: 'credits', label: 'Credits Used', format: 'number', description: 'Credits this call spent.' },
  { key: 'remaining', label: 'Credits Remaining', format: 'number' },
];

const captureFields: OutputSchemaField[] = [
  { key: 'file', label: 'File', description: 'The rendered image or PDF, stored for later steps.' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'url', label: 'Source', description: 'The captured page URL, or html:inline / markdown:inline for inline content.' },
  { key: 'httpStatus', label: 'Page HTTP Status', format: 'number', description: 'Only for URL sources.' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'format', label: 'Format' },
  { key: 'bytesSize', label: 'Size', format: 'filesize' },
  { key: 'capturedAt', label: 'Captured At', format: 'datetime' },
  { key: 'quality', label: 'Capture Quality', description: 'full, degraded or best_attempt.' },
  { key: 'waitStrategy', label: 'Wait Strategy' },
  { key: 'loadTimeMs', label: 'Load Time (ms)', format: 'number' },
  { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when a full-page capture was cut at 16,384 px.' },
  { key: 'autoScrolled', label: 'Auto Scrolled', format: 'boolean' },
  { key: 'watermarked', label: 'Watermarked', format: 'boolean', description: 'True on the Free plan.' },
  { key: 'renderingEngine', label: 'Rendering Engine' },
  { key: 'usage', label: 'Usage', children: usageFields },
];

const watchRenderFields: OutputSchemaField[] = [
  { key: 'format', label: 'Format' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'deviceScaleFactor', label: 'Device Scale Factor', format: 'number' },
  { key: 'timeout', label: 'Timeout (seconds)', format: 'number' },
  { key: 'blockAds', label: 'Block Ads', format: 'boolean' },
  { key: 'blockCookieBanners', label: 'Hide Cookie Banners', format: 'boolean' },
  { key: 'fullPage', label: 'Full Page', format: 'boolean' },
  { key: 'selector', label: 'Element Selector' },
  { key: 'device', label: 'Device' },
  { key: 'darkMode', label: 'Dark Mode', format: 'boolean' },
  { key: 'waitUntil', label: 'Wait Until' },
  { key: 'delay', label: 'Delay (ms)', format: 'number' },
];

const watchFields: OutputSchemaField[] = [
  { key: 'id', label: 'Watch ID', description: 'Use it with Get Watch, Update Watch, Run Watch Check Now, List Watch Runs or Delete Watch.' },
  { key: 'url', label: 'Page URL', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', description: 'active or paused.' },
  { key: 'intervalMinutes', label: 'Check Interval (minutes)', format: 'number' },
  { key: 'diffMode', label: 'Change Detection', description: 'visual, text or both.' },
  { key: 'threshold', label: 'Threshold', format: 'number' },
  { key: 'renderParams', label: 'Render Settings', children: watchRenderFields },
  { key: 'aiSummary', label: 'AI Summary', format: 'boolean' },
  { key: 'webhookUrl', label: 'Webhook URL', format: 'url', description: 'Starter plan and up; not returned on Free.' },
  { key: 'notifyEmail', label: 'Alert Email', format: 'email' },
  { key: 'baselineImageUrl', label: 'Baseline Image', format: 'url' },
  { key: 'baselineCapturedAt', label: 'Baseline Captured At', format: 'datetime' },
  { key: 'lastRunAt', label: 'Last Check At', format: 'datetime' },
  { key: 'nextRunAt', label: 'Next Check At', format: 'datetime' },
  { key: 'lastChangedAt', label: 'Last Changed At', format: 'datetime' },
  { key: 'lastStatus', label: 'Last Check Status' },
  { key: 'consecutiveFailures', label: 'Consecutive Failures', format: 'number' },
  { key: 'uaBlockedAt', label: 'Bot Blocked At', format: 'datetime', description: 'When the site last blocked the Rendex user agent, if ever.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'lastChange', label: 'Last Change', description: 'Details of the most recent detected change, or null.' },
];

const runFields: OutputSchemaField[] = [
  { key: 'id', label: 'Run ID' },
  { key: 'watchId', label: 'Watch ID' },
  { key: 'status', label: 'Status', description: 'queued, processing, completed or failed.' },
  { key: 'changed', label: 'Changed', format: 'boolean' },
  { key: 'diffScore', label: 'Diff Score', format: 'number', description: 'Null in text-only mode, like Changed Pixels, Before Image, Diff Overlay, Changed Region Image and Changed Region.' },
  { key: 'diffPixels', label: 'Changed Pixels', format: 'number' },
  { key: 'beforeUrl', label: 'Before Image', format: 'url' },
  { key: 'afterUrl', label: 'After Image', format: 'url' },
  { key: 'diffOverlayUrl', label: 'Diff Overlay Image', format: 'url' },
  { key: 'cropUrl', label: 'Changed Region Image', format: 'url' },
  {
    key: 'changedRegion',
    label: 'Changed Region',
    description: 'Position of the change, as fractions of the page from 0 to 1.',
    children: [
      { key: 'x', label: 'X', format: 'number' },
      { key: 'y', label: 'Y', format: 'number' },
      { key: 'width', label: 'Width', format: 'number' },
      { key: 'height', label: 'Height', format: 'number' },
    ],
  },
  { key: 'aiSummary', label: 'AI Summary' },
  {
    key: 'textDiff',
    label: 'Text Changes',
    children: [
      { key: 'summary', label: 'Summary', description: 'Line counts, like +1/-1.' },
      { key: 'added', label: 'Added Lines', description: 'List of added lines.' },
      { key: 'removed', label: 'Removed Lines', description: 'List of removed lines.' },
    ],
  },
  { key: 'creditsCharged', label: 'Credits Charged', format: 'number' },
  { key: 'error', label: 'Error' },
  { key: 'errorCode', label: 'Error Code' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'completedAt', label: 'Completed At', format: 'datetime' },
];

export const renderToImageOutputSchema: OutputSchema = {
  fields: captureFields,
};

export const renderScreenshotOutputSchema: OutputSchema = {
  fields: [
    ...captureFields,
    {
      key: 'extracted',
      label: 'Extracted Content',
      description: 'Present when Extract Text was yes.',
      children: [
        { key: 'format', label: 'Format' },
        { key: 'content', label: 'Content' },
        { key: 'excerpt', label: 'Excerpt' },
        { key: 'length', label: 'Length (characters)', format: 'number' },
      ],
    },
  ],
};

export const createRenderLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'Render Link', format: 'url', description: 'Signed link that renders on first open and is cached afterwards.' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
    { key: 'format', label: 'Format' },
    { key: 'cacheTtl', label: 'Cache Lifetime (seconds)', format: 'number' },
  ],
};

export const extractContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'Page URL', format: 'url' },
    { key: 'format', label: 'Format' },
    { key: 'content', label: 'Content' },
    { key: 'title', label: 'Title' },
    { key: 'byline', label: 'Byline' },
    { key: 'excerpt', label: 'Excerpt' },
    { key: 'siteName', label: 'Site Name' },
    { key: 'length', label: 'Length (characters)', format: 'number' },
    { key: 'loadTimeMs', label: 'Load Time (ms)', format: 'number' },
    { key: 'usage', label: 'Usage', children: usageFields },
  ],
};

export const createArtifactOutputSchema: OutputSchema = {
  fields: [
    { key: 'pdfUrl', label: 'PDF URL', format: 'url' },
    { key: 'pngUrl', label: 'PNG URL', format: 'url' },
    { key: 'shareUrl', label: 'Share URL', format: 'url' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
  ],
};

export const getAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'plan', label: 'Plan', description: 'free, basic, starter, pro or enterprise.' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'used', label: 'Credits Used', format: 'number' },
        { key: 'limit', label: 'Monthly Limit', format: 'number' },
        { key: 'remaining', label: 'Credits Remaining', format: 'number' },
        { key: 'unlimited', label: 'Unlimited', format: 'boolean' },
        { key: 'resetsAt', label: 'Resets At', format: 'datetime' },
        { key: 'topupCredits', label: 'Top-up Credits', format: 'number' },
        { key: 'totalRemaining', label: 'Total Remaining', format: 'number', description: 'Plan credits plus top-up credits left.' },
      ],
    },
    { key: 'rateLimitPerMinute', label: 'Requests per Minute', format: 'number' },
    {
      key: 'upgrade',
      label: 'Upgrade',
      children: [
        { key: 'recommendedPlan', label: 'Recommended Plan' },
        { key: 'recommendedPlanCredits', label: 'Recommended Plan Credits', format: 'number' },
        { key: 'upgradeUrl', label: 'Upgrade URL', format: 'url' },
        { key: 'manageBillingUrl', label: 'Manage Billing URL', format: 'url' },
      ],
    },
  ],
};

export const watchOutputSchema: OutputSchema = { fields: watchFields };

export const listWatchesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Watches', labelKey: 'url', listItems: watchFields },
    { key: 'nextCursor', label: 'Next Cursor', description: 'Pass it as Cursor to get the next page.' },
    { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True whenever a page is full, even if the next page turns out empty.' },
  ],
};

export const testWatchOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', format: 'boolean' },
    { key: 'reachable', label: 'Reachable', format: 'boolean' },
    { key: 'format', label: 'Format' },
    { key: 'httpStatus', label: 'HTTP Status', format: 'number' },
    { key: 'usedGeo', label: 'Used Geo', format: 'boolean' },
    { key: 'screenshotUrl', label: 'Screenshot', format: 'url' },
    { key: 'extractedText', label: 'Extracted Text' },
    { key: 'capturedAt', label: 'Captured At', format: 'datetime' },
    { key: 'reason', label: 'Reason', description: 'Why the page could not be monitored, when OK is false.' },
  ],
};

export const deleteWatchOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'Watch ID' },
  ],
};

export const runWatchNowOutputSchema: OutputSchema = {
  fields: [
    { key: 'runId', label: 'Run ID' },
    { key: 'watchId', label: 'Watch ID' },
    { key: 'status', label: 'Status', description: 'queued. Read the result later with List Watch Runs.' },
  ],
};

export const listWatchRunsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Runs', labelKey: 'createdAt', listItems: runFields },
    { key: 'nextCursor', label: 'Next Cursor', description: 'Pass it as Cursor to get the next page.' },
    { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True whenever a page is full, even if the next page turns out empty.' },
  ],
};

export const newWatchChangeOutputSchema: OutputSchema = {
  fields: [
    ...runFields,
    {
      key: 'watch',
      label: 'Watch',
      children: [
        { key: 'id', label: 'Watch ID' },
        { key: 'url', label: 'Page URL', format: 'url' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};
