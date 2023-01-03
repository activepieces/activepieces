import { UserId, UserStatus } from "../../user/user";

export type AuthenticationResponse = {
    token: string;
    id: UserId,
    email: string,
    firstName: string,
    lastName: string,
    status: UserStatus
};
