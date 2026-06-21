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

export type HttpErrorParams = {
  status: number;
  responseBody: unknown;
};
