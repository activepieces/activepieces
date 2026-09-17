import { describe, expect, it } from 'bun:test'
import { breakingChangesRollover } from './breaking-changes-rollover'

const entry = ({ title, body }: { title: string, body: string }): string =>
    `#### ${title}\n\n${body}\n\n#### What you need to do\n\nNothing for ${title}.`

const hiddenPage = ({ entries }: { entries: string[] }): string =>
    `---\ntitle: "Unreleased breaking changes"\nhidden: true\n---\n\nIntro sentence.\n\n## What has changed?\n\n${entries.join('\n\n')}\n`

const publishedPage = ({ sections }: { sections: string }): string =>
    `---\ntitle: "Breaking Changes"\n---\n\n${sections}`

const alpha = entry({ title: 'Alpha changes', body: 'Alpha body.' })
const beta = entry({ title: '`AP_BETA` is removed', body: 'Beta body.' })
const gamma = entry({ title: 'Gamma changes', body: 'Gamma body.' })

describe('rollover', () => {
    it('moves entries present at the tag into a new version section right after the frontmatter', () => {
        const result = breakingChangesRollover.rollover({
            hidden: hiddenPage({ entries: [gamma, alpha] }),
            snapshot: hiddenPage({ entries: [alpha] }),
            published: publishedPage({ sections: '## 0.91.0\n\n### What has changed?\n\n#### Old\n\nOld body.\n' }),
            tag: '0.92.0',
        })
        expect(result.moved).toEqual(['Alpha changes'])
        expect(result.published.startsWith('---\ntitle: "Breaking Changes"\n---\n\n## 0.92.0\n\n### What has changed?\n\n#### Alpha changes\n')).toBe(true)
        expect(result.published).toContain('\n\n## 0.91.0\n\n### What has changed?\n\n#### Old\n')
        expect(result.hidden).toContain('#### Gamma changes')
        expect(result.hidden).not.toContain('#### Alpha changes')
    })

    it('appends into an existing version section on a re-run', () => {
        const result = breakingChangesRollover.rollover({
            hidden: hiddenPage({ entries: [beta] }),
            snapshot: hiddenPage({ entries: [beta, alpha] }),
            published: publishedPage({ sections: '## 0.92.0\n\n### What has changed?\n\n#### Alpha changes\n\nAlpha body.\n\n## 0.91.0\n' }),
            tag: '0.92.0',
        })
        expect(result.moved).toEqual(['`AP_BETA` is removed'])
        expect(result.published.split('## 0.92.0').length).toBe(2)
        expect(result.published).toContain('### What has changed?\n\n#### `AP_BETA` is removed\n')
        expect(result.published.indexOf('#### `AP_BETA` is removed')).toBeLessThan(result.published.indexOf('#### Alpha changes'))
    })

    it('leaves entries merged after the tag on the hidden page', () => {
        const result = breakingChangesRollover.rollover({
            hidden: hiddenPage({ entries: [gamma] }),
            snapshot: hiddenPage({ entries: [alpha] }),
            published: publishedPage({ sections: '## 0.91.0\n' }),
            tag: '0.92.0',
        })
        expect(result.moved).toEqual([])
        expect(result.hidden).toBe(hiddenPage({ entries: [gamma] }))
        expect(result.published).toBe(publishedPage({ sections: '## 0.91.0\n' }))
    })

    it('is a no-op when the hidden page or the snapshot has no entries', () => {
        const empty = hiddenPage({ entries: [] })
        const withAlpha = hiddenPage({ entries: [alpha] })
        const published = publishedPage({ sections: '## 0.91.0\n' })
        expect(breakingChangesRollover.rollover({ hidden: empty, snapshot: withAlpha, published, tag: '0.92.0' }).moved).toEqual([])
        expect(breakingChangesRollover.rollover({ hidden: withAlpha, snapshot: '', published, tag: '0.92.0' }).moved).toEqual([])
    })

    it('keeps the intro and heading of the hidden page when the last entry leaves', () => {
        const result = breakingChangesRollover.rollover({
            hidden: hiddenPage({ entries: [alpha] }),
            snapshot: hiddenPage({ entries: [alpha] }),
            published: publishedPage({ sections: '## 0.91.0\n' }),
            tag: '0.92.0',
        })
        expect(result.hidden).toBe('---\ntitle: "Unreleased breaking changes"\nhidden: true\n---\n\nIntro sentence.\n\n## What has changed?\n')
    })
})

describe('parseEntries', () => {
    it('never treats "What you need to do" as an entry boundary', () => {
        const parsed = breakingChangesRollover.parseEntries({ text: hiddenPage({ entries: [alpha, beta] }) })
        expect(parsed.blocks.map((block) => block[0])).toEqual(['#### Alpha changes', '#### `AP_BETA` is removed'])
        expect(parsed.blocks[0]).toContain('#### What you need to do')
        expect(parsed.blocks[0][parsed.blocks[0].length - 1]).toBe('Nothing for Alpha changes.')
    })
})
