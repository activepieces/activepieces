import KSUID = require("ksuid");
import {BaseModel} from "./base-model";

export type UserId = KSUID;

export class User extends BaseModel<UserId> {

  email: string;
  firstName: string;
  lastName: string;
  password: string;
  status: UserStatus;

}

export enum UserStatus{
  VERIFIED = "VERIFIED"
}
