export interface CanvaDesign {
    id: string;
    title: string;
    owner_id: string;
    create_at: number;
    updated_at: number;
    thumbnail?: {
        url: string;
        width: number;
        height: number;
    };
    urls: {
        edit: string;
        view: string;
    };
}

export interface CanvaListDesignsResponse {
    items: CanvaDesign[];
    continuation?: string;
}

// HubSpot-style strict error mapping
export interface CanvaApiError {
    code: string;
    message: string;
}
