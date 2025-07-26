export interface Lead {
    id: number;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    position?: string | null;
    company?: string | null;
    company_industry?: string | null;
    company_size?: string | null;
    confidence_score?: number | null;
    website?: string | null;
    country_code?: string | null;
    source?: string | null;
    linkedin_url?: string | null;
    phone_number?: string | null;
    twitter?: string | null;
    sync_status?: string | null;
    notes?: string | null;
    sending_status?: string | null;
    last_activity_at?: string | null;
    last_contacted_at?: string | null;
    verification?: {
        date: string | null;
        status: string | null;
    };
    leads_list?: {
        id: number;
        name: string;
        leads_count: number;
    };
    created_at: string;
}