import { describe, expect, it } from 'bun:test'
import { BreakingChangeEntry, BreakingChangeImpact } from '../../packages/core/shared/src/lib/core/breaking-change'
import { breakingChangesRender } from './breaking-changes-render'

const entry = ({ meta, body }: { meta: Partial<BreakingChangeEntry> & { id: string }, body?: string }) => ({
    meta: { title: `${meta.id} changed`, added: '2026-11-20', ...meta },
    body: body ?? `Body of ${meta.id}.`,
})

const file = ({ fileName, frontMatter }: { fileName: string, frontMatter: string }) =>
    breakingChangesRender.parseEntryFile({ fileName, text: `---\n${frontMatter}\n---\n\nBody.\n` })

describe('parseEntryFile', () => {
    it('reads front-matter and body', () => {
        const parsed = file({ fileName: 'alpha.md', frontMatter: 'id: alpha\ntitle: "`AP_X`: removed"\nadded: \'2026-11-20\'\nimpact: flows-fail\naffects:\n  editions: [ce, ee]\n  installMethods: [helm]' })
        expect(parsed.meta.title).toBe('`AP_X`: removed')
        expect(parsed.meta.impact).toBe(BreakingChangeImpact.FLOWS_FAIL)
        expect(parsed.meta.affects?.installMethods).toEqual(['helm'])
        expect(parsed.body).toBe('Body.')
    })

    it('rejects an id that does not match the file name', () => {
        expect(() => file({ fileName: 'beta.md', frontMatter: 'id: alpha\ntitle: "x"\nadded: \'2026-11-20\'' })).toThrow('must match the file name')
    })

    it('rejects unknown fields, including check before the check engine exists', () => {
        expect(() => file({ fileName: 'alpha.md', frontMatter: 'id: alpha\ntitle: "x"\nadded: \'2026-11-20\'\ncheck: { kind: env }' })).toThrow()
    })

    it('rejects an unknown impact', () => {
        expect(() => file({ fileName: 'alpha.md', frontMatter: 'id: alpha\ntitle: "x"\nadded: \'2026-11-20\'\nimpact: catastrophic' })).toThrow('impact')
    })

    it('rejects an entry with an empty body', () => {
        expect(() => breakingChangesRender.parseEntryFile({ fileName: 'alpha.md', text: '---\nid: alpha\ntitle: "x"\nadded: \'2026-11-20\'\n---\n\n' })).toThrow('body')
    })

    it('rejects a file without front-matter', () => {
        expect(() => breakingChangesRender.parseEntryFile({ fileName: 'alpha.md', text: '#### Alpha\n\nBody.\n' })).toThrow('front-matter')
    })
})

describe('renderPages', () => {
    it('puts released entries under their release, newest release first, and the rest on the unreleased page', () => {
        const pages = breakingChangesRender.renderPages({
            entries: [
                entry({ meta: { id: 'old', release: '0.92.0' } }),
                entry({ meta: { id: 'new', release: '0.93.0' } }),
                entry({ meta: { id: 'hotfix', release: '0.93.0-hotfix.1' } }),
                entry({ meta: { id: 'pending' } }),
            ],
        })
        const headings = [...pages.published.matchAll(/^## (\S+)$/gm)].map((match) => match[1])
        expect(headings).toEqual(['0.93.0-hotfix.1', '0.93.0', '0.92.0'])
        expect(pages.published).toContain('## 0.93.0\n\n### What has changed?\n\n#### new changed\n\nBody of new.')
        expect(pages.published).not.toContain('pending changed')
        expect(pages.unreleased).toContain('## What has changed?\n\n#### pending changed\n\nBody of pending.\n')
    })

    it('sorts within a release by order, then impact, then newest first', () => {
        const pages = breakingChangesRender.renderPages({
            entries: [
                entry({ meta: { id: 'no-impact', release: '0.94.0', added: '2026-11-25' } }),
                entry({ meta: { id: 'older-blocker', release: '0.94.0', impact: BreakingChangeImpact.BLOCKS_UPGRADE, added: '2026-11-01' } }),
                entry({ meta: { id: 'newer-blocker', release: '0.94.0', impact: BreakingChangeImpact.BLOCKS_UPGRADE, added: '2026-11-10' } }),
                entry({ meta: { id: 'removed', release: '0.94.0', impact: BreakingChangeImpact.FEATURE_REMOVED } }),
                entry({ meta: { id: 'pinned', release: '0.94.0', order: 1, impact: BreakingChangeImpact.BEHAVIOR_CHANGES } }),
            ],
        })
        const ids = [...pages.published.matchAll(/^#### (\S+) changed$/gm)].map((match) => match[1])
        expect(ids).toEqual(['pinned', 'newer-blocker', 'older-blocker', 'removed', 'no-impact'])
    })

    it('renders a legacy release verbatim and refuses a legacy release with other entries', () => {
        const legacy = entry({ meta: { id: 'release-0-87-0', title: '0.87.0', release: '0.87.0', legacy: true }, body: '### What has changed?\n\n- Old bullet.' })
        expect(breakingChangesRender.renderPages({ entries: [legacy] }).published).toContain('## 0.87.0\n\n### What has changed?\n\n- Old bullet.\n')
        expect(() => breakingChangesRender.renderPages({ entries: [legacy, entry({ meta: { id: 'extra', release: '0.87.0' } })] })).toThrow('legacy')
    })
})

describe('setRelease', () => {
    it('adds the release, or replaces an existing one, inside the front-matter', () => {
        const text = '---\nid: alpha\ntitle: "x"\nadded: \'2026-11-20\'\n---\n\nBody with release: inside.\n'
        const once = breakingChangesRender.setRelease({ text, release: '0.94.0' })
        expect(once).toBe('---\nid: alpha\ntitle: "x"\nadded: \'2026-11-20\'\nrelease: 0.94.0\n---\n\nBody with release: inside.\n')
        expect(breakingChangesRender.setRelease({ text: once, release: '0.95.0' })).toContain('\nrelease: 0.95.0\n---')
    })
})
