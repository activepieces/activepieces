import { AxiosError } from 'axios';
export declare class HttpError extends Error {
    private readonly requestBody;
    private readonly status;
    private readonly responseBody;
    constructor(requestBody: unknown, err: AxiosError);
    errorMessage(): {
        response: {
            status: number;
            body: unknown;
        };
        request: {
            body: unknown;
        };
    };
    get response(): {
        status: number;
        body: unknown;
    };
    get request(): {
        body: unknown;
    };
}
