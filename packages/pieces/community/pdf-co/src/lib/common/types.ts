
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

 // Interface for the image object needed by /pdf/edit/add
export interface PdfCoImageAnnotation {
    url: string;
    x: number;
    y: number;
    pages?: string;
    width?: number;
    height?: number;
    link?: string;
    keepAspectRatio?: boolean;
}

// Interface for the /pdf/edit/add request body (when adding images)
export interface PdfCoAddImagesRequestBody {
    url: string; // Source PDF URL
    images: PdfCoImageAnnotation[];
    async: boolean;
    inline: boolean; // Should be false to get final PDF url
    name?: string;
    password?: string;
    expiration?: number;
    profiles?: Record<string, unknown>;
    httpusername?: string;
    httppassword?: string;
}