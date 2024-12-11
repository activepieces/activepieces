import { AxiosError } from 'axios';

export class HttpError extends Error {
  private readonly errorString: string;
  private readonly errorCode: string | undefined;
  private readonly status: number;
  private readonly responseBody: unknown;

  constructor(private readonly requestBody: unknown, err: AxiosError) {
    const message = err?.message;
    const code = err?.code;
    const status = err?.response?.status || 500;
    const responseBody = err?.response?.data;

    super(
      JSON.stringify({
        response: {
          status: status,
          body: responseBody,
        },
        request: {
          body: requestBody,
        },
        error: {
          message: message,
          code: code,
        },
      })
    );

    this.errorString = message;
    this.errorCode = code;
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
      error: {
        message: this.errorString,
        code: this.errorCode,
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

  get error() {
    return {
      message: this.errorString,
      code: this.errorCode,
    };
  }
}
