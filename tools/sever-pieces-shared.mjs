// Codemod: split each community piece's `@activepieces/shared` named import into
// core-utils / core-piece-types / (remaining) shared. Pieces whose every shared
// symbol is covered by the core packages end up with ZERO shared imports.
// Run with --write to apply; default is a dry run (report only).

import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const COMMUNITY = path.join(REPO, 'packages', 'pieces', 'community')
const WRITE = process.argv.includes('--write')

const CORE_UTILS = new Set(['assertNotNullOrUndefined', 'Cursor', 'FlowRunId', 'isEmpty', 'isNil', 'LocalesEnum', 'ProjectId', 'SeekPage'])
const CORE_PIECE_TYPES = new Set(['AgentPieceTool', 'AgentPieceToolMetadata', 'AgentToolType', 'AppConnectionType', 'AppConnectionValue', 'AUTHENTICATION_PROPERTY_NAME', 'BaseOAuth2ConnectionValue', 'BasicAuthConnectionValue', 'BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE', 'CloudOAuth2ConnectionValue', 'CustomAuthConnectionValue', 'DelayPauseMetadata', 'EventPayload', 'ExecutionType', 'FieldControlMode', 'MarkdownVariant', 'MAX_KEY_LENGTH_FOR_CORWDIN', 'NoAuthConnectionValue', 'OAuth2ConnectionValueWithApp', 'OAuth2GrantType', 'OIDCConnectionValue', 'PackageType', 'ParseEventResponse', 'PauseMetadata', 'PauseType', 'PieceCategory', 'PieceType', 'PlatformOAuth2ConnectionValue', 'PopulatedFlowSummary', 'PredefinedInputField', 'PredefinedInputsStructure', 'RespondResponse', 'ResumePayload', 'SecretTextConnectionValue', 'StreamStepProgress', 'TriggerPayload', 'TriggerStrategy', 'TriggerTestStrategy', 'WebhookHandshakeConfiguration', 'WebhookHandshakeStrategy', 'WebhookPauseMetadata'])

const IMPORT_RE = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]@activepieces\/shared['"];?/g

function baseName(token) {
    // "Foo as Bar" / "type Foo as Bar" → "Foo"
    return token.replace(/^type\s+/, '').trim().split(/\s+as\s+/)[0].trim()
}

function buildImport(typeModifier, tokens, module) {
    return `import ${typeModifier ? 'type ' : ''}{ ${tokens.join(', ')} } from '${module}';`
}

function rewriteFile(content) {
    let changed = false
    let fullySevered = true
    let hadShared = false
    const out = content.replace(IMPORT_RE, (match, typeModifier, body) => {
        hadShared = true
        const tokens = body.split(',').map((t) => t.trim()).filter(Boolean)
        const utils = []
        const pieceTypes = []
        const rest = []
        for (const token of tokens) {
            const name = baseName(token)
            if (CORE_UTILS.has(name)) utils.push(token)
            else if (CORE_PIECE_TYPES.has(name)) pieceTypes.push(token)
            else rest.push(token)
        }
        if (utils.length === 0 && pieceTypes.length === 0) {
            return match // nothing we can move; leave untouched
        }
        changed = true
        const lines = []
        if (utils.length) lines.push(buildImport(typeModifier, utils, '@activepieces/core-utils'))
        if (pieceTypes.length) lines.push(buildImport(typeModifier, pieceTypes, '@activepieces/core-piece-types'))
        if (rest.length) {
            lines.push(buildImport(typeModifier, rest, '@activepieces/shared'))
            fullySevered = false
        }
        return lines.join('\n')
    })
    return { out, changed, fullySevered: hadShared && fullySevered, hadShared }
}

function walk(dir) {
    let result = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) result = result.concat(walk(full))
        else if (full.endsWith('.ts')) result.push(full)
    }
    return result
}

let filesChanged = 0
const piecesTouched = new Set()
const piecesFullySevered = new Set()
const piecesStillShared = new Set()

for (const piece of fs.readdirSync(COMMUNITY)) {
    const src = path.join(COMMUNITY, piece, 'src')
    if (!fs.existsSync(src)) continue
    let pieceHadShared = false
    let pieceStillShared = false
    for (const file of walk(src)) {
        const content = fs.readFileSync(file, 'utf8')
        if (!content.includes('@activepieces/shared')) continue
        const { out, changed, hadShared } = rewriteFile(content)
        if (hadShared) pieceHadShared = true
        if (changed) {
            filesChanged++
            piecesTouched.add(piece)
            if (WRITE) fs.writeFileSync(file, out)
        }
        // recompute residual shared after rewrite
        if (out.includes("from '@activepieces/shared'")) pieceStillShared = true
    }
    if (pieceHadShared) {
        if (pieceStillShared) piecesStillShared.add(piece)
        else piecesFullySevered.add(piece)
    }
}

console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'}`)
console.log(`files rewritten: ${filesChanged}`)
console.log(`pieces touched: ${piecesTouched.size}`)
console.log(`pieces FULLY severed from shared: ${piecesFullySevered.size}`)
console.log(`pieces still importing shared (uncovered symbols): ${piecesStillShared.size}`)
console.log(`\nstill-shared sample: ${[...piecesStillShared].slice(0, 20).join(', ')}`)
