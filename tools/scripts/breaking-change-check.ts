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

function addedLinesFor({ baseRef, file }: { baseRef: string, file: string }): number {
    const output = execSync(
        `git diff --numstat origin/${baseRef}...HEAD -- ${file}`,
        { encoding: 'utf-8' },
    ).trim()
    if (!output) {
        return 0
    }
    const added = parseInt(output.split('\n')[0].split('\t')[0], 10)
    return Number.isNaN(added) ? 0 : added
}

function main(): void {
    const baseRef = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? 'main'
    const body = process.env.PR_BODY ?? ''
    const labels: string[] = JSON.parse(process.env.PR_LABELS ?? '[]')

    const hasBreakingLabel = labels.includes(BREAKING_LABEL)
    const templateChoice = sectionChoice({ body, heading: /^#{2,3}\s*Breaking change\?/im })
    const securityChoice = sectionChoice({ body, heading: /^#{2,3}\s*Security impact\?/im })
    const docAdded = addedLinesFor({ baseRef, file: BREAKING_CHANGES_DOC }) > 0

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

main()
