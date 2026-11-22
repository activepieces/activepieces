export type Service = {
  id: number;
  name: string;
  number?: string | null;
  active: boolean;
  note?: string | null;
};

export type ServiceCreateRequest = {
  name: string;
  number?: string | null;
  active?: boolean;
  note?: string | null;
};

export type ServiceUpdateRequest = Partial<ServiceCreateRequest>;
