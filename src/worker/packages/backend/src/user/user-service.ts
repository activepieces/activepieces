import {apId, AuthenticationRequest, User, UserStatus} from 'shared';
import { passwordHasher } from '../authentication/lib/password-hasher';
import {databaseConnection} from "../database/database-connection";
import {UserEntity} from "./user-entity";

const userRepo = databaseConnection.getRepository(UserEntity);


type GetOneQuery = {
    email?: string;
}

export const userService = {
    async create(request: AuthenticationRequest): Promise<User> {
        const hashedPassword = await passwordHasher.hash(request.password);
        let user = {
            id: apId(),
            email: request.email,
            password: hashedPassword,
            firstName: '',
            lastName: '',
            status: UserStatus.VERIFIED
        };
        return userRepo.save(user);
    },

    async getOne(query: GetOneQuery = {}): Promise<User | null> {
        return userRepo.findOneBy(query);
    }
};
