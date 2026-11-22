export type User = {
  id: number;
  name: string;
  number?: string | null;
  email: string;
  role: string;
  active: boolean;
  language: string;
  timezone?: string;
  wage_type?: number;
  teams_id?: number | null;
  can_generally_see_absences?: boolean;
  can_generally_manage_absences?: boolean;
  can_add_customers?: boolean;
};

export type UserCreateRequest = {
  name: string;
  number?: string | null;
  email: string;
  role: string;
  language?: string;
  wage_type?: number;
  can_generally_see_absences?: boolean;
  can_generally_manage_absences?: boolean;
  can_add_customers?: boolean;
  teams_id?: number;
};

export type UserUpdateRequest = Partial<Omit<UserCreateRequest, 'teams_id'>> & {
  active?: boolean;
  teams_id?: number | null;
};
