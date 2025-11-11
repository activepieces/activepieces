import { EnginePrincipal, PrincipalType } from '@activepieces/shared'
import jwt from 'jsonwebtoken'
import { workerMachine } from './machine'

const ONE_WEEK = 7 * 24 * 3600
const ISSUER = 'activepieces'
const ALGORITHM = 'HS256'

export const tokenUtls = {
    async generateEngineToken({ jobId, projectId, platformId }: GenerateEngineTokenParams): Promise<string> {
        const settings = workerMachine.getSettings()
        const secret = settings.JWT_SECRET
        const enginePrincipal: EnginePrincipal = {
            id: jobId,
            type: PrincipalType.ENGINE,
            projectId,
            platform: {
                id: platformId,
            },
        }
        const signOptions: jwt.SignOptions = {
            algorithm: ALGORITHM,
            expiresIn: ONE_WEEK,
            issuer: ISSUER,
        }
        return new Promise<string>((resolve, reject) => {
            jwt.sign(enginePrincipal, secret, signOptions, (err, token) => {
                if (err || !token) {
                    return reject(err || new Error('Failed to generate token'))
                }
                return resolve(token)
            })
        })
    },
}

type GenerateEngineTokenParams = {
    jobId: string
    projectId: string
    platformId: string
}