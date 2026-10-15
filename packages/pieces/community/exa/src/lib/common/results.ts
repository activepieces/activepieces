export const exaResults = { flattenResult, flattenPage, flattenStatus };

function flattenResult(result: ExaResult): FlatResult {
  return {
    id: result.id ?? null,
    title: result.title ?? null,
    url: result.url ?? null,
    published_date: result.publishedDate ?? null,
    author: result.author ?? null,
    text: result.text ?? null,
    highlights: Array.isArray(result.highlights) ? result.highlights.join('\n') : null,
    summary: result.summary ?? null,
    image: result.image ?? null,
  };
}

function flattenPage(result: ExaResult): FlatPage {
  return {
    ...flattenResult(result),
    links: Array.isArray(result.extras?.links) ? result.extras.links : null,
    subpages: Array.isArray(result.subpages) ? result.subpages.map(flattenResult) : [],
  };
}

function flattenStatus(status: ExaStatus): FlatStatus {
  return {
    url: status.id,
    status: status.status,
    source: status.source ?? null,
    error_tag: status.error?.tag ?? null,
    error_http_status: status.error?.httpStatusCode ?? null,
  };
}

export type ExaResult = {
  id?: string;
  title?: string | null;
  url?: string;
  publishedDate?: string | null;
  author?: string | null;
  text?: string;
  highlights?: string[];
  summary?: string;
  image?: string;
  extras?: { links?: string[] };
  subpages?: ExaResult[];
};

export type ExaStatus = {
  id: string;
  status: string;
  source?: string;
  error?: { tag?: string; httpStatusCode?: number | null } | null;
};

export type ExaCost = { total?: number };

export type FlatResult = {
  id: string | null;
  title: string | null;
  url: string | null;
  published_date: string | null;
  author: string | null;
  text: string | null;
  highlights: string | null;
  summary: string | null;
  image: string | null;
};

export type FlatPage = FlatResult & {
  links: string[] | null;
  subpages: FlatResult[];
};

export type FlatStatus = {
  url: string;
  status: string;
  source: string | null;
  error_tag: string | null;
  error_http_status: number | null;
};
