import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth'
import * as crypto from "crypto";
import { FirebaseSignInRequest, FirebaseSignUpRequest } from "@activepieces/ee/shared";
import { PrincipalType, ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { userService } from "@backend/user/user-service";
import { authenticationService } from "@backend/authentication/authentication.service";
import { projectService } from "@backend/project/project.service";
import { tokenUtils } from "@backend/authentication/lib/token-utils";

import { AuthenticationResponse } from "@activepieces/shared";


const firebaseAdminApp = initializeApp();
const firebaseAuth = getAuth(firebaseAdminApp);

export const firebaseAuthenticationController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {

    app.post(
        "/sign-in",
        {
            schema: {
                body: FirebaseSignInRequest,
            },
        },
        async (request: FastifyRequest<{ Body: FirebaseSignInRequest }>, reply: FastifyReply) => {
           try {
                const verifiedToken = await firebaseAuth.verifyIdToken(request.body.token);
                const user = await userService.getOneByEmail({ email: verifiedToken.email });
                if (user !== null) {
                    const projects = await projectService.getAll(user.id);
                    const token = await tokenUtils.encode({
                        id: user.id,
                        type: PrincipalType.USER,
                        projectId: projects[0].id
                    });
                    const response: AuthenticationResponse = {
                        projectId: projects[0].id,
                        token: token,
                        ...user
                    }
                    return response;
                } else {
                    throw new ActivepiecesError({
                        code: ErrorCode.INVALID_CREDENTIALS,
                        params: { email: verifiedToken.email },
                    })
                }
            } catch (e) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {},
                })
            }
        }
    );

    app.post(
        "/users",
        {
            schema: {
                body: FirebaseSignUpRequest,
            },
        },
        async (request: FastifyRequest<{ Body: FirebaseSignUpRequest }>, reply: FastifyReply) => {
            try {
                const verifiedToken = await firebaseAuth.verifyIdToken(request.body.token);
                const user = await userService.getOneByEmail({ email: verifiedToken.email });
                if (user !== null) {
                    const projects = await projectService.getAll(user.id);
                    const token = await tokenUtils.encode({
                        id: user.id,
                        type: PrincipalType.USER,
                        projectId: projects[0].id
                    });
                    const response: AuthenticationResponse = {
                        projectId: projects[0].id,
                        token: token,
                        ...user
                    }
                    return response;
                } else {
                    const response = await authenticationService.signUp({
                        ...request.body,
                        email: verifiedToken.email,
                        password: crypto.randomBytes(32).toString("hex")
                    })
                    return response;
                }
            } catch (e) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {},
                })
            }
        }
    );

};