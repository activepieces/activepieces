export type Team = {
  id: number;
  name: string;
  leader?: number | null;
};

export type TeamCreateRequest = {
  name: string;
  leader?: number;
};

export type TeamUpdateRequest = {
  name: string;
  leader?: number;
};
