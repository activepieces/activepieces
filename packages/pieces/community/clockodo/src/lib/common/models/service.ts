export interface Service {
  id: number;
  name: string;
  number?: string;
  active: boolean;
  note?: string;
}

export interface ServiceCreateRequest {
  name: string;
  number?: string | null;
  active?: boolean;
  note?: string | null;
}

export interface ServiceUpdateRequest {
  name?: string;
  number?: string | null;
  active?: boolean;
  note?: string | null;
}

export interface ServiceListResponse {
  services: Service[];
}

export interface ServiceSingleResponse {
  service: Service;
}
