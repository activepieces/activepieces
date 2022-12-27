import {AuthenticationRequest, AuthenticationResponse, PrincipalType, UserStatus} from 'shared';
import {userService} from '../user/user-service';
import {passwordHasher} from './lib/password-hasher';
import {tokenUtils} from './lib/token-utils';
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";
import {projectService} from "../project/project.service";

export const authenticationService = {
    signUp: async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
        const existingUser = await userService.getOne();

        if (existingUser !== null) {
            throw new ActivepiecesError({code: ErrorCode.EXISTING_USER, params: {}});
        }

        const user = await userService.create(request);

        const project = await projectService.create({
            displayName: "Project",
            ownerId: user.id
        })

        const token = await tokenUtils.encode({
            id: user.id,
            type: PrincipalType.USER
        });

        return {
            token,
        };
    },

    signIn: async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
        const user = await userService.getOne({
            email: request.email
        });

        if (user === null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS, params: {
                    email: request.email
                }
            });
        }

        const passwordMatches = await passwordHasher.compare(
            request.password,
            user.password,
        );

        if (!passwordMatches) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS, params: {
                    email: request.email
                }
            });
        }

        const token = await tokenUtils.encode({
            id: user.id,
            type: PrincipalType.USER
        });

        return {
            token,
        };
    }
};
