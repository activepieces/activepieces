
export interface User {
  email: string;
  firstName: string;
  trackEvents: boolean;
  lastName: string;
  status: UserStatus;
}

export enum UserStatus{
  VERIFIED = "VERIFIED"
}
