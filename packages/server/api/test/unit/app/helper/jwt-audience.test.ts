import { describe, expect, it } from 'vitest'
import { JwtAudience, JwtSignAlgorithm, jwtUtils } from '../../../../src/app/helper/jwt-utils'

const SECRET = 'test-secret-for-jwt-audience-tests'

type TestPayload = {
    userId: string
}

const samplePayload = (): TestPayload => ({ userId: 'user-1' })

describe('jwtUtils audience', () => {
    it('verifies a token signed with matching audience', async () => {
        const token = await jwtUtils.sign({
            payload: samplePayload(),
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            audience: JwtAudience.FLOW_RUN_LOG,
            expiresInSeconds: 60,
        })

        const decoded = await jwtUtils.decodeAndVerify<TestPayload & { aud: string }>({
            jwt: token,
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            audience: JwtAudience.FLOW_RUN_LOG,
        })

        expect(decoded.userId).toBe('user-1')
        expect(decoded.aud).toBe(JwtAudience.FLOW_RUN_LOG)
    })

    it('rejects a token signed with a different audience', async () => {
        const token = await jwtUtils.sign({
            payload: samplePayload(),
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            audience: JwtAudience.USER_INVITATION,
            expiresInSeconds: 60,
        })

        await expect(
            jwtUtils.decodeAndVerify<TestPayload>({
                jwt: token,
                key: SECRET,
                algorithm: JwtSignAlgorithm.HS256,
                audience: JwtAudience.FLOW_RUN_LOG,
            }),
        ).rejects.toThrowError(/audience/i)
    })

    it('rejects a token signed without audience when verifier requires one', async () => {
        const token = await jwtUtils.sign({
            payload: samplePayload(),
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            expiresInSeconds: 60,
        })

        await expect(
            jwtUtils.decodeAndVerify<TestPayload>({
                jwt: token,
                key: SECRET,
                algorithm: JwtSignAlgorithm.HS256,
                audience: JwtAudience.FLOW_RUN_LOG,
            }),
        ).rejects.toThrowError(/audience/i)
    })

    it('accepts a token without audience when verifier does not require one', async () => {
        const token = await jwtUtils.sign({
            payload: samplePayload(),
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            expiresInSeconds: 60,
        })

        const decoded = await jwtUtils.decodeAndVerify<TestPayload>({
            jwt: token,
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
        })

        expect(decoded.userId).toBe('user-1')
    })

    it('rejects an MCP access token when verified as an MCP auth request', async () => {
        const token = await jwtUtils.sign({
            payload: samplePayload(),
            key: SECRET,
            algorithm: JwtSignAlgorithm.HS256,
            audience: JwtAudience.MCP_OAUTH_ACCESS,
            expiresInSeconds: 60,
        })

        await expect(
            jwtUtils.decodeAndVerify<TestPayload>({
                jwt: token,
                key: SECRET,
                algorithm: JwtSignAlgorithm.HS256,
                audience: JwtAudience.MCP_OAUTH_AUTH_REQUEST,
            }),
        ).rejects.toThrowError(/audience/i)
    })
})
