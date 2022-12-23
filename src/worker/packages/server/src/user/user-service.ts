import { User } from 'shared';
import { passwordHasher } from '../authentication/lib/password-hasher';
import {databaseConnection} from "../database/database-connection";
import {UserEntity} from "./user-entity";
import { nanoid } from 'nanoid'

const userRepo = databaseConnection.getRepository(UserEntity);


type GetOneQuery = {
    email?: string;
}

export const userService = {
    async create(user: Partial<User>): Promise<User> {
        const hashedPassword = await passwordHasher.hash(user.password);
        user.password = hashedPassword;
        user.id = nanoid();
        return userRepo.save(user);
    },

    async getOne(query: GetOneQuery = {}): Promise<User | null> {
        return userRepo.findOneBy(query);
    }
};
