export type Subproject = {
  id: number;
  projects_id: number;
  name: string;
  number?: string | null;
  active: boolean;
  completed?: boolean;
};

export type SubprojectListFilter = {
  projects_id?: number;
  active?: boolean;
};
