export enum UserType {
  USER,
  ADMIN,
  BLOCKED,
  AWAITING_ACCESS,
}

export interface User {
  name: string;
  avatar?: string;
  displayName: string;
}

export interface DetailedUser extends User {
  id: string;
  color: string;
  profile_picture?: string;
  logged_in: true;
  auth_type: string;
  type: UserType;
}
