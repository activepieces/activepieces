import { User, UserId, UserStatus } from "../../user/user";

export type AuthenticationResponse = Omit<User, "password"> & {
    token: string;
};
