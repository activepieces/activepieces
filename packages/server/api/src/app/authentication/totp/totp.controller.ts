import {
    AuthenticationResponse,
    DisableTotpRequest,
    EnableTotpRequest,
    EnableTotpResponse,
    ForcedSetupCompleteResponse,
    InitMfaResponse,
    PrincipalType,
    RegenerateBackupCodesRequest,
    SetupTotpRequest,
    SetupTotpResponse,
    TotpStatusResponse,
    VerifyTotpRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { userService } from '../../user/user-service'
import { totpService } from './totp.service'

export const totpController: FastifyPluginAsyncZod = async (app) => {
    app.post('/init', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
        schema: {
            response: {
                200: InitMfaResponse,
            },
        },
    }, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return totpService(request.log).generateMfaToken({ identityId: user.identityId, platformId: request.principal.platform.id })
    })

    app.post('/setup', {
        config: {
            security: securityAccess.public(),
        },
        schema: {
            body: SetupTotpRequest,
            response: {
                200: SetupTotpResponse,
            },
        },
    }, async (request) => {
        return totpService(request.log).setup({ mfaToken: request.body.mfaToken })
    })

    app.post('/enable', {
        config: {
            security: securityAccess.public(),
        },
        schema: {
            body: EnableTotpRequest,
            response: {
                200: z.union([ForcedSetupCompleteResponse, EnableTotpResponse]),
            },
        },
    }, async (request) => {
        return totpService(request.log).enable({ mfaToken: request.body.mfaToken, code: request.body.code })
    })

    app.post('/disable', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
        schema: {
            body: DisableTotpRequest,
        },
    }, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        await totpService(request.log).disable({ identityId: user.identityId, code: request.body.code })
    })

    app.post('/verify', {
        config: {
            security: securityAccess.public(),
        },
        schema: {
            body: VerifyTotpRequest,
            response: {
                200: AuthenticationResponse,
            },
        },
    }, async (request) => {
        return totpService(request.log).verify({
            mfaToken: request.body.mfaToken,
            code: request.body.code,
        })
    })

    app.get('/status', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
        schema: {
            response: {
                200: TotpStatusResponse,
            },
        },
    }, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return totpService(request.log).getStatus({ identityId: user.identityId })
    })

    app.post('/backup-codes/regenerate', {
        config: {
            security: securityAccess.publicPlatform([PrincipalType.USER]),
        },
        schema: {
            body: RegenerateBackupCodesRequest,
            response: {
                200: EnableTotpResponse,
            },
        },
    }, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return totpService(request.log).regenerateBackupCodes({
            identityId: user.identityId,
            code: request.body.code,
        })
    })

}
