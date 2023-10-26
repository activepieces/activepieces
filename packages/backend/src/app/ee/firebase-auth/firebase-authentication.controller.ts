import { FastifyInstance, FastifyRequest } from 'fastify'
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import * as crypto from 'crypto'
import { FirebaseSignInRequest, FirebaseSignUpRequest } from '@activepieces/ee-shared'
import { PrincipalType, ActivepiecesError, ErrorCode, UserStatus, isNil } from '@activepieces/shared'


import { AuthenticationResponse } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { userService } from '../../user/user-service'
import { tokenUtils } from '../../authentication/lib/token-utils'
import { authenticationService } from '../../authentication/authentication.service'
import { logger } from '../../helper/logger'
import { referralService } from '../referrals/referral.service'
import { enterpriseProjectService } from '../projects/enterprise-project-service'
import { platformService } from '../platform/platform.service'


const credential = system.get(SystemProp.FIREBASE_ADMIN_CREDENTIALS) ? cert(JSON.parse(system.getOrThrow(SystemProp.FIREBASE_ADMIN_CREDENTIALS))) : undefined
const firebaseAuth = credential ? getAuth(initializeApp({
    credential,
})) : undefined

export const firebaseAuthenticationController = async (app: FastifyInstance) => {

    app.post(
        '/sign-in',
        {
            schema: {
                body: FirebaseSignInRequest,
            },
        },
        async (request: FastifyRequest<{ Body: FirebaseSignInRequest }>) => {
            try {
                const verifiedToken = await firebaseAuth!.verifyIdToken(request.body.token)
                const user = await userService.getOneByEmail({ email: verifiedToken.email! })
                if (!isNil(user) && user.status !== UserStatus.SHADOW) {
                    const project = (await enterpriseProjectService.getAll({
                        ownerId: user.id,
                    }))[0]
                    const token = await tokenUtils.encode({
                        id: user.id,
                        type: PrincipalType.USER,
                        projectId: project.id,
                        projectType: project.type,
                        platformId: await platformService.getPlatformIdByOwner({
                            ownerId: user.id,
                        }),
                    })
                    const response: AuthenticationResponse = {
                        projectId: project.id,
                        token,
                        created: user.created,
                        email: user.email,
                        firstName: user.firstName,
                        id: user.id,
                        lastName: user.lastName,
                        newsLetter: user.newsLetter,
                        status: user.status,
                        trackEvents: user.trackEvents,
                        updated: user.updated,
                    }
                    return response
                }
                else {
                    throw new ActivepiecesError({
                        code: ErrorCode.INVALID_CREDENTIALS,
                        params: { email: verifiedToken.email! },
                    })
                }
            }
            catch (e) {
                logger.error(e)
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {},
                })
            }
        },
    )

    app.post(
        '/users',
        {
            schema: {
                body: FirebaseSignUpRequest,
            },
        },
        async (request: FastifyRequest<{ Body: FirebaseSignUpRequest }>) => {
            try {
                const verifiedToken = await firebaseAuth!.verifyIdToken(request.body.token)
                const user = await userService.getOneByEmail({ email: verifiedToken.email! })
                const referringUserId = request.body.referringUserId
                if (!isNil(user) && user.status !== UserStatus.SHADOW) {
                    const project = (await enterpriseProjectService.getAll({
                        ownerId: user.id,
                    }))[0]
                    const token = await tokenUtils.encode({
                        id: user.id,
                        type: PrincipalType.USER,
                        projectId: project.id,
                        projectType: project.type,
                        platformId: await platformService.getPlatformIdByOwner({
                            ownerId: user.id,
                        }),
                    })
                    const response: AuthenticationResponse = {
                        projectId: project.id,
                        token,
                        created: user.created,
                        email: user.email,
                        firstName: user.firstName,
                        id: user.id,
                        lastName: user.lastName,
                        newsLetter: user.newsLetter,
                        status: user.status,
                        trackEvents: user.trackEvents,
                        updated: user.updated,
                    }
                    if (!isNil(referringUserId)) {
                        await referralService.upsert({
                            referringUserId,
                            referredUserId: user!.id,
                        })
                    }
                    return response
                }
                else {
                    const response = await authenticationService.signUp({
                        ...request.body,
                        email: verifiedToken.email!,
                        password: crypto.randomBytes(32).toString('hex'),
                    })
                    if (!isNil(referringUserId)) {
                        await referralService.upsert({
                            referringUserId,
                            referredUserId: response.id,
                        })
                    }
                    return response
                }
            }
            catch (e) {
                logger.error(e)
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {},
                })
            }
        },
    )

}
