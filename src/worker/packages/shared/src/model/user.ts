import {BaseModel} from "./base-model";
import {ApId} from "../helper/id-generator";

export type UserId = ApId;

export interface User extends BaseModel<UserId> {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: UserStatus;
}

export enum UserStatus{
  VERIFIED = "VERIFIED"
}
