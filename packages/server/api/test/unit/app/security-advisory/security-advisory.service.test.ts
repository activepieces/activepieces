import { SecurityAdvisory } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetCurrentRelease, mockGithubFetch, mockActivepiecesFetch } = vi.hoisted(() => ({
    mockGetCurrentRelease: vi.fn(),
    mockGithubFetch: vi.fn(),
    mockActivepiecesFetch: vi.fn(),
}))

vi.mock('@activepieces/server-utils', () => ({
    apVersionUtil: { getCurrentRelease: mockGetCurrentRelease },
}))

vi.mock('../../../../src/app/security-advisory/sources/github-advisory-source', () => ({
    githubAdvisorySource: { fetch: mockGithubFetch },
}))

vi.mock('../../../../src/app/security-advisory/sources/activepieces-advisory-source', () => ({
    activepiecesAdvisorySource: { fetch: mockActivepiecesFetch },
}))

import { securityAdvisoryService } from '../../../../src/app/security-advisory/security-advisory.service'

const mockLog: FastifyBaseLogger = {
    info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn(),
    child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const makeAdvisory = (overrides: Partial<SecurityAdvisory> = {}): SecurityAdvisory => ({
    id: 'github:default',
    source: 'github',
    ghsaId: null,
    cveId: null,
    summary: 'A vulnerability',
    description: '',
    severity: 'high',
    cvssScore: null,
    vulnerableVersionRange: '<= 99.99.99',
    patchedVersion: null,
    publishedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    htmlUrl: 'https://example.com',
    ...overrides,
})

describe('securityAdvisoryService.listForCurrentVersion', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('combines advisories from both sources and reports partial=false on full success', async () => {
        mockGetCurrentRelease.mockReturnValue('1.0.0')
        mockGithubFetch.mockResolvedValue([makeAdvisory({ id: 'github:a', vulnerableVersionRange: '<= 2.0.0' })])
        mockActivepiecesFetch.mockResolvedValue([makeAdvisory({ id: 'activepieces:b', source: 'activepieces', vulnerableVersionRange: '<= 2.0.0' })])

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.partial).toBe(false)
        expect(result.currentVersion).toBe('1.0.0')
        expect(result.advisories.map((a) => a.id).sort()).toEqual(['activepieces:b', 'github:a'])
    })

    it('marks partial=true when the GitHub source fails but Activepieces succeeds', async () => {
        mockGetCurrentRelease.mockReturnValue('1.0.1')
        mockGithubFetch.mockResolvedValue(null)
        mockActivepiecesFetch.mockResolvedValue([makeAdvisory({ id: 'activepieces:b', source: 'activepieces', vulnerableVersionRange: '<= 2.0.0' })])

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.partial).toBe(true)
        expect(result.advisories.map((a) => a.id)).toEqual(['activepieces:b'])
    })

    it('marks partial=true when the Activepieces source fails but GitHub succeeds', async () => {
        mockGetCurrentRelease.mockReturnValue('1.0.2')
        mockGithubFetch.mockResolvedValue([makeAdvisory({ id: 'github:a', vulnerableVersionRange: '<= 2.0.0' })])
        mockActivepiecesFetch.mockResolvedValue(null)

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.partial).toBe(true)
        expect(result.advisories.map((a) => a.id)).toEqual(['github:a'])
    })

    it('marks partial=true and returns an empty list when both sources fail', async () => {
        mockGetCurrentRelease.mockReturnValue('1.0.3')
        mockGithubFetch.mockResolvedValue(null)
        mockActivepiecesFetch.mockResolvedValue(null)

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.partial).toBe(true)
        expect(result.advisories).toEqual([])
    })

    it('filters out advisories whose vulnerable_version_range does not match the running version', async () => {
        mockGetCurrentRelease.mockReturnValue('1.5.0')
        mockGithubFetch.mockResolvedValue([
            makeAdvisory({ id: 'github:matches', vulnerableVersionRange: '< 2.0.0' }),
            makeAdvisory({ id: 'github:nomatch', vulnerableVersionRange: '< 1.0.0' }),
        ])
        mockActivepiecesFetch.mockResolvedValue([])

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.advisories.map((a) => a.id)).toEqual(['github:matches'])
    })

    it('skips advisories with an unparseable vulnerable_version_range instead of throwing', async () => {
        mockGetCurrentRelease.mockReturnValue('1.6.0')
        mockGithubFetch.mockResolvedValue([
            makeAdvisory({ id: 'github:bad', vulnerableVersionRange: 'not-a-range' }),
            makeAdvisory({ id: 'github:ok', vulnerableVersionRange: '< 2.0.0' }),
        ])
        mockActivepiecesFetch.mockResolvedValue([])

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.advisories.map((a) => a.id)).toEqual(['github:ok'])
    })

    it('matches prerelease versions when the range includes them', async () => {
        mockGetCurrentRelease.mockReturnValue('2.0.0-beta.1')
        mockGithubFetch.mockResolvedValue([
            makeAdvisory({ id: 'github:pre', vulnerableVersionRange: '< 2.0.0' }),
        ])
        mockActivepiecesFetch.mockResolvedValue([])

        const result = await securityAdvisoryService(mockLog).listForCurrentVersion()

        expect(result.advisories.map((a) => a.id)).toEqual(['github:pre'])
    })
})
