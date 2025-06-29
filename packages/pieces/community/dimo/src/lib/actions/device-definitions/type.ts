export interface DeviceDefinitionResponse {
  deviceDefinitionId: string;
  newTransactionHash: string;
}

export interface DeviceDefinitionsSearchResponse {
  deviceDefinitions: Array<{
    id: string;
    legacy_ksuid: string;
    name: string;
    make: string;
    model: string;
    year: number;
    imageUrl: string;
  }>;
  facets: {
    makes: Array<{ name: string; count: number }>;
    models: Array<{ name: string; count: number }>;
    years: Array<{ name: string; count: number }>;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
