import { describe, expect, it } from 'bun:test'
import { prSizeCheck } from './pr-size-check'

const numstatOf = (rows: [number, number, string][]): string =>
    rows.map(([added, deleted, path]) => `${added}\t${deleted}\t${path}`).join('\n')

const linesOf = ({ numstat, area }: { numstat: string, area: string }): number =>
    prSizeCheck.collectSizes({ numstat }).rows.find((row) => row.name === area)?.lines ?? -1

describe('resolveRenamePath', () => {
    it('returns plain paths untouched', () => {
        expect(prSizeCheck.resolveRenamePath({ raw: 'packages/web/src/app.tsx' })).toBe('packages/web/src/app.tsx')
    })

    it('resolves braced renames to the destination path', () => {
        expect(prSizeCheck.resolveRenamePath({ raw: 'packages/{shared => core/shared}/src/index.ts' }))
            .toBe('packages/core/shared/src/index.ts')
    })

    it('collapses the empty side of a braced rename', () => {
        expect(prSizeCheck.resolveRenamePath({ raw: 'packages/web/{ => src}/app.tsx' }))
            .toBe('packages/web/src/app.tsx')
    })

    it('resolves unbraced renames to the destination path', () => {
        expect(prSizeCheck.resolveRenamePath({ raw: 'old/a.ts => packages/core/shared/src/a.ts' }))
            .toBe('packages/core/shared/src/a.ts')
    })
})

describe('diffRange', () => {
    it('diffs the merge commit parents on a PR checkout so stacked PRs only count their own changes', () => {
        expect(prSizeCheck.diffRange({ baseRef: 'feat/base', parentCount: 2 })).toBe('HEAD^1...HEAD^2')
    })

    it('falls back to the base ref on a non-merge (local) checkout', () => {
        expect(prSizeCheck.diffRange({ baseRef: 'main', parentCount: 1 })).toBe('origin/main...HEAD')
    })
})

describe('bucketFor', () => {
    it('folds engine, worker and execution into one bucket', () => {
        const areas = [
            'packages/server/engine/src/main.ts',
            'packages/server/worker/src/main.ts',
            'packages/core/execution/src/main.ts',
        ].map((path) => prSizeCheck.bucketFor({ path }).name)
        expect(new Set(areas)).toEqual(new Set(['engine / worker / execution']))
    })

    it('does not let core/shared swallow core/execution', () => {
        expect(prSizeCheck.bucketFor({ path: 'packages/core/shared/src/index.ts' }).name).toBe('core/shared')
    })

    it('exempts pieces and anything unmatched', () => {
        expect(prSizeCheck.bucketFor({ path: 'packages/pieces/community/slack/src/index.ts' }).budget).toBeNull()
        expect(prSizeCheck.bucketFor({ path: 'docs/install/overview.mdx' }).name).toBe('other (default)')
        expect(prSizeCheck.bucketFor({ path: 'docs/install/overview.mdx' }).budget).toBeNull()
    })
})

describe('collectSizes', () => {
    it('counts additions plus deletions into the matching area', () => {
        const numstat = numstatOf([
            [10, 5, 'packages/server/api/src/app/flow/flow.service.ts'],
            [3, 2, 'packages/web/src/app/routes.tsx'],
        ])
        const report = prSizeCheck.collectSizes({ numstat })
        expect(report.meaningfulTotal).toBe(20)
        expect(linesOf({ numstat, area: 'server/api' })).toBe(15)
        expect(linesOf({ numstat, area: 'packages/web' })).toBe(5)
    })

    it('excludes generated files from the meaningful total', () => {
        const numstat = numstatOf([
            [900, 100, 'bun.lock'],
            [50, 0, 'package-lock.json'],
            [40, 0, 'packages/web/public/locales/de/translation.json'],
            [30, 0, 'packages/pieces/community/slack/src/i18n/translation.json'],
            [20, 0, 'packages/web/src/__snapshots__/app.test.tsx.snap'],
            [10, 0, 'packages/web/dist/main.js'],
            [7, 3, 'packages/web/src/app/routes.tsx'],
        ])
        const report = prSizeCheck.collectSizes({ numstat })
        expect(report.meaningfulTotal).toBe(10)
        expect(report.excludedTotal).toBe(1150)
        expect(linesOf({ numstat, area: 'packages/web' })).toBe(10)
    })

    it('skips binary files, which numstat reports as "-"', () => {
        const report = prSizeCheck.collectSizes({ numstat: '-\t-\tpackages/web/src/assets/logo.png\n5\t5\tpackages/web/src/app.tsx' })
        expect(report.meaningfulTotal).toBe(10)
    })

    it('counts renamed files under their destination area', () => {
        const numstat = numstatOf([[40, 0, 'packages/{shared => core/shared}/src/index.ts']])
        expect(linesOf({ numstat, area: 'core/shared' })).toBe(40)
        expect(linesOf({ numstat, area: 'other (default)' })).toBe(0)
    })

    it('flags an area only once it exceeds its budget', () => {
        const atBudget = prSizeCheck.collectSizes({ numstat: numstatOf([[250, 0, 'packages/core/shared/src/index.ts']]) })
        const overBudget = prSizeCheck.collectSizes({ numstat: numstatOf([[250, 1, 'packages/core/shared/src/index.ts']]) })
        expect(atBudget.rows.some((row) => row.over)).toBe(false)
        expect(overBudget.rows.filter((row) => row.over).map((row) => row.name)).toEqual(['core/shared'])
    })

    it('never flags exempt areas, however large', () => {
        const report = prSizeCheck.collectSizes({
            numstat: numstatOf([
                [50_000, 0, 'packages/pieces/community/slack/src/index.ts'],
                [50_000, 0, 'docs/install/overview.mdx'],
            ]),
        })
        expect(report.rows.some((row) => row.over)).toBe(false)
    })
})

describe('isBlocked', () => {
    const overBudget = prSizeCheck.collectSizes({ numstat: numstatOf([[400, 0, 'packages/server/engine/src/main.ts']]) })
    const withinBudget = prSizeCheck.collectSizes({ numstat: numstatOf([[10, 0, 'packages/server/engine/src/main.ts']]) })

    it('blocks an over-budget PR with no bypass', () => {
        expect(prSizeCheck.isBlocked({ report: overBudget, bypassReason: null })).toBe(true)
    })

    it('does not block when a bypass reason is present', () => {
        expect(prSizeCheck.isBlocked({ report: overBudget, bypassReason: 'revert PR' })).toBe(false)
    })

    it('does not block a PR within budget', () => {
        expect(prSizeCheck.isBlocked({ report: withinBudget, bypassReason: null })).toBe(false)
    })
})

describe('renderSummary', () => {
    const overBudget = prSizeCheck.collectSizes({ numstat: numstatOf([[400, 0, 'packages/server/engine/src/main.ts']]) })

    it('names the over-budget areas when blocking', () => {
        const summary = prSizeCheck.renderSummary({ report: overBudget, bypassReason: null })
        expect(summary).toContain('**Blocked:** engine / worker / execution')
        expect(summary).toContain('large-pr-ok')
    })

    it('reports the bypass instead of blocking', () => {
        const summary = prSizeCheck.renderSummary({ report: overBudget, bypassReason: 'revert PR' })
        expect(summary).toContain('bypassed (revert PR)')
        expect(summary).not.toContain('Blocked')
    })

    it('reports success when every gated area is within budget', () => {
        const report = prSizeCheck.collectSizes({ numstat: numstatOf([[10, 0, 'packages/web/src/app.tsx']]) })
        expect(prSizeCheck.renderSummary({ report, bypassReason: null })).toContain('All gated areas are within budget.')
    })
})
