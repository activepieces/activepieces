import { AuthenticationRequest, AuthenticationResponse } from 'shared';
import { SignUpError } from './sign-up-error';
import { userService } from '../user/user-service';
import { SignInError } from './sign-in-error';
import { passwordHasher } from './lib/password-hasher';
import { UserStatus } from 'shared';
import { tokenUtils } from './lib/token-utils';

export const authenticationService = {
    signUp: async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
        const existingUser = await userService.getOne();

        if (existingUser !== null) {
            throw new SignUpError('error=user_already_exists');
        }

        const user = await userService.create({
            email: request.email,
            password: request.password,
            firstName: '',
            lastName: '',
            status: UserStatus.VERIFIED
        });

        const token = await tokenUtils.encode(user);

        return {
            token,
        };
    },

    signIn: async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
        const user = await userService.getOne({
            email: request.email
        });

        if (user === null) {
            throw new SignInError(`error=user_not_found email=${request.email}`);
        }

        const passwordMatches = await passwordHasher.compare(
            request.password,
            user.password,
        );

        if (!passwordMatches) {
            throw new SignInError(`error=password_mismatch email=${request.email}`);
        }

        const token = await tokenUtils.encode(user);

        return {
            token,
        };
    }
};
