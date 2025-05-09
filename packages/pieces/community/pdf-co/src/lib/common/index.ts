
// Define a type for the expected successful response body (shared structure)
export interface PdfCoSuccessResponse {
    url: string;
    pageCount: number;
    error: false;
    status: number;
    name: string;
    remainingCredits: number;
    credits: number;
}

// Define a type for the expected error response body (shared structure)
export interface PdfCoErrorResponse {
    error: true;
    status: number;
    message?: string;
    [key: string]: unknown;
}
