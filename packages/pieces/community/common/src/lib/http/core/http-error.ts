import { AxiosError } from 'axios';


function parseResponseBody(body: unknown): unknown {
  const tryParseJson = (text: string): unknown => {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return text;
      }
    }
    return text;
  };

  if (Buffer.isBuffer(body)) {
    try {
      return tryParseJson(body.toString('utf-8'));
    } catch {
      return body;
    }
  }

  if (body instanceof ArrayBuffer) {
    try {
      return tryParseJson(Buffer.from(body).toString('utf-8'));
    } catch {
      return body;
    }
  }

  if (typeof body === 'object' && body !== null) {
    const bufferLike = body as { type?: string; data?: number[] };
    if (bufferLike.type === 'Buffer' && Array.isArray(bufferLike.data)) {
      try {
        return tryParseJson(Buffer.from(bufferLike.data).toString('utf-8'));
      } catch {
        return body;
      }
    }
  }

  return body;
}

export class HttpError extends Error {
  private readonly status: number;
  private readonly responseBody: unknown;

  constructor(private readonly requestBody: unknown, err: AxiosError) {
    const status = err?.response?.status || 500;
    const responseBody = err?.response?.data;
    const parsedBody = parseResponseBody(responseBody);

    super(
      JSON.stringify({
        response: {
          status: status,
          body: parsedBody,
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
    const parsedBody = parseResponseBody(this.responseBody);
    
    let errorMessage: string | undefined;
    if (typeof parsedBody === 'string') {
      errorMessage = parsedBody;
    } else if (typeof parsedBody === 'object' && parsedBody !== null) {
      const errorObj = parsedBody as Record<string, unknown>;
      const errorField = errorObj['error'];
      errorMessage =
        (errorObj['message'] as string) ||
        (errorObj['error'] as string) ||
        ((errorField && typeof errorField === 'object' && 'message' in errorField)
          ? ((errorField as Record<string, unknown>)['message'] as string)
          : undefined) ||
        (errorObj['description'] as string) ||
        (errorObj['detail'] as string) ||
        (errorObj['msg'] as string);
    }

    return {
      response: {
        status: this.status,
        body: parsedBody,
        ...(errorMessage && { message: errorMessage }),
      },
      request: {
        body: this.requestBody,
      },
    };
  }

  get response() {
    return {
      status: this.status,
      body: parseResponseBody(this.responseBody),
    };
  }

  get request() {
    return {
      body: this.requestBody,
    };
  }
}
