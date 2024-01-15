export interface Team {
  id: number;
  name: string;
}

export interface TeamCreateRequest {
  name: string;
}

export interface TeamUpdateRequest {
  name: string;
}

export interface TeamListResponse {
  teams: Team[];
}

export interface TeamSingleResponse {
  team: Team;
}
