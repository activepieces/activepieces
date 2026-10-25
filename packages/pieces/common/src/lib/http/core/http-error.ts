export class HttpError extends Error {
  private readonly status: number;
  private readonly responseBody: unknown;

  constructor(private readonly requestBody: unknown, params: HttpErrorParams) {
    const status = params.status || 500;
    const responseBody = Buffer.isBuffer(params.responseBody) ? params.responseBody.toString() : params.responseBody;

    super(
      JSON.stringify({
        response: {
          status: status,
          body: responseBody,
        },
        request: {
          body: requestBody,
        },
      })
    );

    this.status = status;
    this.responseBody = responseBody;
  }

  public errorMessage() {
    return {
      response: {
        status: this.status,
        body: this.responseBody,
      },
      request: {
        body: this.requestBody,
      },
    };
  }

  get response() {
    return {
      status: this.status,
      body: this.responseBody,
    };
  }

  get request() {
    return {
      body: this.requestBody,
    };
  }
}

export function toFailsafeOutput({ error, requestBody }: FailsafeOutputParams) {
  if (error instanceof HttpError) {
    return error.errorMessage();
  }
  return {
    response: {
      status: 0,
      body: formatFailsafeErrorBody(error),
    },
    request: {
      body: requestBody,
    },
  };
}

function formatFailsafeErrorBody(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const causeDetail = formatErrorCause(error.cause);
  return causeDetail ? `${error.message} (${causeDetail})` : error.message;
}

function formatErrorCause(cause: unknown): string | undefined {
  if (cause === null || cause === undefined) {
    return undefined;
  }
  if (typeof cause === 'object') {
    const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : undefined;
    const message = 'message' in cause && typeof cause.message === 'string' ? cause.message : undefined;
    if (code && message && !message.includes(code)) {
      return `${code}: ${message}`;
    }
    if (message) {
      return message;
    }
    if (code) {
      return code;
    }
  }
  return String(cause);
}

export type HttpErrorParams = {
  status: number;
  responseBody: unknown;
};

export type FailsafeOutputParams = {
  error: unknown;
  requestBody: unknown;
};
