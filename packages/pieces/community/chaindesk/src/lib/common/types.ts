export type ChaindeskNamedEntity = {
  id: string;
  name: string;
  description?: string | null;
};

export type ChaindeskDatasource = {
  id: string;
  type?: string;
  name?: string;
  status?: string;
  groupId?: string | null;
  datastoreId?: string;
  config?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  lastSynch?: string | null;
};

export type ChaindeskRecord = Record<string, unknown> & { id?: string };
