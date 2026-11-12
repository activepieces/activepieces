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
      body: describeError(error),
    },
    request: {
      body: requestBody,
    },
  };
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const cause = error.cause;
  if (!(cause instanceof Error)) {
    return error.message;
  }
  const code = 'code' in cause && typeof cause.code === 'string' ? `${cause.code}: ` : '';
  return `${error.message} (${code}${cause.message})`;
}

export type HttpErrorParams = {
  status: number;
  responseBody: unknown;
};

export type FailsafeOutputParams = {
  error: unknown;
  requestBody: unknown;
};
