import assert from 'assert'
import { execSync } from 'child_process'

const BREAKING_LABEL = '⛓️‍💥 breaking-change'
const BREAKING_CHANGES_DOC = 'docs/install/reference/breaking-changes.mdx'

type TemplateChoice = 'yes' | 'no' | 'unset' | 'multiple'

// Both the "Breaking change?" and "Security impact?" sections use no/yes checkboxes,
// so each section is parsed in isolation — a global scan would conflate the two.
function sectionChoice({ body, heading }: { body: string, heading: RegExp }): TemplateChoice {
    const match = heading.exec(body)
    if (!match) {
        return 'unset'
    }
    const rest = body.slice(match.index + match[0].length)
    const nextHeading = rest.search(/^\s{0,3}#{2,3}\s/m)
    const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)

    const checked = [...section.matchAll(/^\s*-\s*\[([ xX])\]\s*(no|yes)\b/gim)]
        .filter((box) => box[1].toLowerCase() === 'x')
        .map((box) => box[2].toLowerCase())
    if (checked.length === 0) {
        return 'unset'
    }
    if (checked.length > 1) {
        return 'multiple'
    }
    return checked[0] === 'yes' ? 'yes' : 'no'
}

// The PR's added lines in `file`, stripped and cleared of blanks and HTML comments —
// neither may satisfy the "documented the breaking change" requirement.
function addedDocLines({ baseRef, file }: { baseRef: string, file: string }): string[] {
    const diff = execSync(
        `git diff origin/${baseRef}...HEAD -- ${file}`,
        { encoding: 'utf-8' },
    )
    return diff
        .split('\n')
        .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
        .map((line) => line.slice(1).trim())
        .filter((line) => line.length > 0 && !line.startsWith('<!--'))
}

// A real entry has the shape the doc uses: a `####` heading naming what changed, plus
// at least one line of description/action beneath it. A bare heading, a `---` separator,
// a version bump, or a stray sentence on its own is not an entry — so a labelled PR
// cannot pass the docs gate by adding generic content.
function hasBreakingEntry(added: string[]): boolean {
    const hasTitle = added.some((line) => /^#{4}\s+\S/.test(line))
    const hasBody = added.some((line) => !/^#{1,6}\s/.test(line) && !/^[-*_]{3,}$/.test(line))
    return hasTitle && hasBody
}

function main(): void {
    const baseRef = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? 'main'
    const body = process.env.PR_BODY ?? ''
    const labels: string[] = JSON.parse(process.env.PR_LABELS ?? '[]')

    const hasBreakingLabel = labels.includes(BREAKING_LABEL)
    const templateChoice = sectionChoice({ body, heading: /^#{2,3}\s*Breaking change\?/im })
    const securityChoice = sectionChoice({ body, heading: /^#{2,3}\s*Security impact\?/im })
    const docAdded = hasBreakingEntry(addedDocLines({ baseRef, file: BREAKING_CHANGES_DOC }))

    const errors: string[] = []

    // R1 — the author must make an explicit breaking-change choice in the PR template.
    if (templateChoice === 'unset') {
        errors.push('The "Breaking change?" section in the PR description is not filled in — tick exactly one box (no / yes-technical / yes-functional).')
    }
    else if (templateChoice === 'multiple') {
        errors.push('The "Breaking change?" section has more than one box ticked — tick exactly one.')
    }

    // R2 — the author must explicitly declare security impact (declaration only, no label coupling).
    if (securityChoice === 'unset') {
        errors.push('The "Security impact?" section in the PR description is not filled in — tick exactly one box (no / yes-security-sensitive).')
    }
    else if (securityChoice === 'multiple') {
        errors.push('The "Security impact?" section has more than one box ticked — tick exactly one.')
    }

    // R3 — the breaking label, the template answer, and the docs entry must agree.
    if (hasBreakingLabel && !docAdded) {
        errors.push(`PR carries the "${BREAKING_LABEL}" label but adds no entry to ${BREAKING_CHANGES_DOC}. Document the change (what changed + required action) so it reaches self-hosters.`)
    }
    if (docAdded && !hasBreakingLabel) {
        errors.push(`PR adds an entry to ${BREAKING_CHANGES_DOC} but is missing the "${BREAKING_LABEL}" label. Apply the label so it lands in the release notes.`)
    }
    if (templateChoice === 'yes' && !hasBreakingLabel) {
        errors.push(`The PR template declares a breaking change but the "${BREAKING_LABEL}" label is missing. Apply it.`)
    }
    if (templateChoice === 'no' && hasBreakingLabel) {
        errors.push(`The PR template declares "not breaking" but carries the "${BREAKING_LABEL}" label — reconcile the two.`)
    }

    if (errors.length > 0) {
        console.error('❌ Breaking-change check failed:\n')
        for (const error of errors) {
            console.error(`   - ${error}`)
        }
        console.error('\nSee docs/install/reference/breaking-changes.mdx and the PR template for guidance.')
        process.exit(1)
    }

    console.log('✅ Breaking-change check passed.')
}

function runSelfCheck(): void {
    assert(hasBreakingEntry(['#### AP_FOO removed', 'It is gone — remove it from your env.']) === true, 'titled entry with a body is a real entry')
    assert(hasBreakingEntry(['#### AP_FOO removed']) === false, 'a bare heading with no body is not an entry')
    assert(hasBreakingEntry(['---']) === false, 'a separator is not an entry')
    assert(hasBreakingEntry(['## 0.87.0', 'Set AP_FOO is gone.']) === false, 'a version bump without a #### title is not an entry')
    assert(hasBreakingEntry(['Just a stray sentence.']) === false, 'placeholder prose without a title is not an entry')
    console.log('breaking-change-check self-check passed')
}

if (process.argv.includes('--self-check')) {
    runSelfCheck()
}
else {
    main()
}
