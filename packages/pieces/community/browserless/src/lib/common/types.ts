export interface AuthenticationRequiredParams {
  token: string;
}

type Viewport = {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  hasTouch?: boolean;
  isLandscape?: boolean;
  isMobile?: boolean;
};

interface queryParams {
  blockAds?: boolean;
  launch?: {
    args?: string[];
    defaultViewPort?: Viewport;
    devtools?: boolean;
    dumpio?: boolean;
    headless?: false | 'shell' | true;
    ignoreDefaultArgs?: boolean;
    ignoreHTTPSErrors?: boolean;
    slowMo?: number;
    stealth?: boolean;
    timeout?: number;
    userDataDir?: string;
    waitForInitialPage?: boolean;
  };
  timeout?: number;
  trackingId?: string;
}

interface BaseBody {
  addScriptTag?: {
    url?: string;
    path?: string;
    content?: string;
    type?: string;
    id?: string;
  }[];
  addStyleTag?: {
    url?: string;
    path?: string;
    content?: string;
  };
  authenticate?: {
    username?: string;
    password?: string;
  };
  bestAttempt?: boolean;
  cookies?: {
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    expires?: number;
    priority?: 'Low' | 'Medium' | 'High';
    sameParty?: boolean;
    sourceScheme?: 'Unset' | 'NonSecure' | 'Secure';
    partitionKey?: {
      sourceOrigin: string;
      hasCrossSiteAncestor?: boolean;
    };
  }[];
  emulateMediaType?: string;
  gotoOptions?: {
    referer?: string;
    referrerPolicy?: string;
    timeout?: number;
    waitUntil?: string | string[];
    signal?: {
      aborted: boolean;
      onabort: object | null;
      reason: unknown;
    };
  };
  html?: string;
  rejectRequestPattern?: string[];
  rejectResourceTypes?: rejectResourceTypes[];
  requestInterceptors?: {
    pattern: string;
    response: {
      headers: object;
      status: number;
      contentType: string;
      body: string;
    };
  }[];
  setExtraHTTPHeaders?: object;
  setJavaScriptEnabled?: boolean;
  url?: string;
  userAgent?: string;
  viewport?: Viewport;
  waitForEvent?: {
    event: string;
    timeout?: number;
  };
  waitForFunction?: {
    fn: string;
    pooling?: string | number;
    timeout?: number;
  };
  waitForSelector?: {
    hidden?: boolean;
    selector: string;
    timeout?: number;
    visible?: boolean;
  };
  waitForTimeout?: number;
}

enum rejectResourceTypes {
  CSPVIOLATIONREPORT = 'cspviolationreport',
  DOCUMENT = 'document',
  EVENTSOURCE = 'eventsource',
  FEDCM = 'fedcm',
  FETCH = 'fetch',
  FONT = 'font',
  IMAGE = 'image',
  MANIFEST = 'manifest',
  MEDIA = 'media',
  OTHER = 'other',
  PING = 'ping',
  PREFETCH = 'prefetch',
  PREFLIGHT = 'preflight',
  SCRIPT = 'script',
  SIGNEDEXCHANGE = 'signedexchange',
  STYLESHEET = 'stylesheet',
  TEXTTRACK = 'texttrack',
  WEBSOCKET = 'websocket',
  XHR = 'xhr',
}

export enum PaperFormats {
  A0 = 'A0',
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6',
  LEDGER = 'LEDGER',
  LEGAL = 'LEGAL',
  LETTER = 'LETTER',
  Ledger = 'Ledger',
  Legal = 'Legal',
  Letter = 'Letter',
  TABLOID = 'TABLOID',
  Tabloid = 'Tabloid',
  a0 = 'a0',
  a1 = 'a1',
  a2 = 'a2',
  a3 = 'a3',
  a4 = 'a4',
  a5 = 'a5',
  a6 = 'a6',
  ledger = 'ledger',
  legal = 'legal',
  letter = 'letter',
  tabloid = 'tabloid',
}

//
// Screenshot
//
interface ScreenshotOptions {
  optimizeForSeed?: boolean;
  type?: 'jpeg' | 'png' | 'webp';
  fromSurface?: boolean;
  fullPage?: boolean;
  omitBackground?: boolean;
  path?: string;
  clip?: {
    scale?: number;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  encoding?: 'base64' | 'binary';
  captureBeyondViewport?: boolean;
}

interface bodyParamsScreenshot extends BaseBody {
  options?: ScreenshotOptions;
  scrollPage?: boolean;
  selector?: string;
}

export interface captureScreenshotParams extends AuthenticationRequiredParams {
  queryParams?: queryParams;
  body: bodyParamsScreenshot;
}

//
// Generate PDF
//

interface PdfOptions {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: PaperFormats;
  width?: number;
  height?: number;
  preferCSSPageSize?: boolean;
  margin?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  path?: string;
  omitBackground?: boolean;
  tagged?: boolean;
  outline?: boolean;
  timeout?: number;
  waitForFonts?: boolean;
}

interface bodyParamsGeneratePdf extends BaseBody {
  options?: PdfOptions;
}

export interface generatePdfParams extends AuthenticationRequiredParams {
  queryParams?: queryParams;
  body: bodyParamsGeneratePdf;
}

//
// Scrape URL
//
interface bodyParamsScrapeUrl extends BaseBody {
  debugOpts?: {
    console?: boolean;
    cookies?: boolean;
    html?: boolean;
    network?: boolean;
    screenshot?: boolean;
  };
  elements?: {
    selector: string;
    timeout?: number;
  }[];
}

export interface ScrapeUrlParams extends AuthenticationRequiredParams {
  queryParams?: queryParams;
  body: bodyParamsScrapeUrl;
}

//
// Run BQL
//
export interface RunBqlQueryParams extends AuthenticationRequiredParams {
  query: string;
}

//
// Get Website Performance
//
export interface getWebsitePerformanceParams
  extends AuthenticationRequiredParams {
  queryParams?: queryParams;
  body: {
    budgets?: object[];
    config?: object;
    url?: string;
  };
}
