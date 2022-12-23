import KSUID from 'ksuid';
import { User } from 'shared';
import { userRepo } from './user-repo';
import { passwordHasher } from '../authentication/lib/password-hasher';

type GetOneQuery = {
    email?: string;
}

export const userService = {
    async create(user: Partial<User>): Promise<User> {
        const hashedPassword = await passwordHasher.hash(user.password);
        user.password = hashedPassword;
        user.id = await KSUID.random();
        return userRepo.save(user);
    },

    async getOne(query: GetOneQuery = {}): Promise<User | null> {
        return userRepo.findOneBy(query);
    }
};
