import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";

export type UserId = ApId;

export interface User extends BaseModel<UserId> {
  email: string;
  firstName: string;
  lastName: string;
  trackEvents: boolean;
  newsLetter: boolean;
  password: string;
  status: UserStatus;
}

export type UserMeta = Pick<User, "id" | "email" | "firstName" | "lastName">;

export enum UserStatus{
  VERIFIED = "VERIFIED",
  SHADOW = "SHADOW",
}
