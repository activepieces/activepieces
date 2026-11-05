import { Property } from '@activepieces/pieces-framework';

function query<R extends boolean>({
  required,
  displayName = 'Query',
  description = 'What to search for. Supports Google operators such as site:, inurl: and intitle:.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function country<R extends boolean>({
  required,
  displayName = 'Country',
  description = 'Two-letter country code the search runs from, e.g. "us", "uk", "fr". Defaults to "us".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function language<R extends boolean>({
  required,
  displayName = 'Language',
  description = 'Two-letter interface language code, e.g. "en", "es", "fr". Defaults to "en".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function googleDomain<R extends boolean>({
  required,
  displayName = 'Google Domain',
  description = 'Google domain to search, e.g. "google.com", "google.co.uk". Defaults to google.com.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function location<R extends boolean>({
  required,
  displayName = 'Location',
  description = 'Place the search originates from, e.g. "Austin, Texas, United States".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function start<R extends boolean>({
  required,
  displayName = 'Offset',
  description = 'Number of results to skip, for paging: 0 is the first page, 10 the second (with 10 per page). Defaults to 0.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function num<R extends boolean>({
  required,
  displayName = 'Results Per Page',
  description = 'Maximum number of results to return. Defaults to 10.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function formats<R extends boolean>({
  required,
  displayName = 'Formats',
  description = 'Output formats for each page. Defaults to markdown.',
}: PropParams<R>) {
  return Property.StaticMultiSelectDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Markdown', value: 'markdown' },
        { label: 'HTML (cleaned)', value: 'html' },
        { label: 'Raw HTML', value: 'rawHtml' },
        { label: 'Links', value: 'links' },
        { label: 'Screenshot', value: 'screenshot' },
        { label: 'Full-page screenshot', value: 'screenshot@fullPage' },
      ],
    },
  });
}

function onlyMainContent<R extends boolean>({
  required,
  displayName = 'Only Main Content',
  description = 'Yes (the default) drops headers, navigation and footers; No keeps the whole page.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

function tags<R extends boolean>({
  required,
  displayName = 'Tags',
  description,
}: PropParams<R>) {
  return Property.Array({ displayName, description, required });
}

function waitFor<R extends boolean>({
  required,
  displayName = 'Wait For (ms)',
  description = 'Milliseconds to wait after load before capturing the page. Defaults to 0.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function proxyCountry<R extends boolean>({
  required,
  displayName = 'Proxy Country',
  description = 'Two-letter proxy country code the pages are fetched from, e.g. "US". Defaults to any country.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const scrapelessAiProps = {
  query,
  country,
  language,
  googleDomain,
  location,
  start,
  num,
  formats,
  onlyMainContent,
  tags,
  waitFor,
  proxyCountry,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
