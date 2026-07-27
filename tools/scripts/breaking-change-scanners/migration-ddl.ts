import assert from 'assert'
import { readFileSync } from 'fs'

// A single ALTER TABLE literal can add several columns, each with its own NOT NULL /
// DEFAULT. Check each `ADD ...` clause on its own — a DEFAULT on one column must not
// mask a NOT-NULL-without-DEFAULT on another (`ADD "a" bool NOT NULL DEFAULT false,
// ADD "b" text NOT NULL` is unsafe because of "b").
function hasUnsafeNotNullAdd(sql: string): boolean {
    return sql
        .split(/\bADD\b/i)
        .slice(1)
        .map((clause) => clause.split(';')[0])
        .some((clause) => /\bNOT\s+NULL\b/i.test(clause) && !/\bDEFAULT\b/i.test(clause))
}

// Rules run against the up() SQL only. down() commonly contains the inverse of a
// safe change (a DROP INDEX undoing a CREATE INDEX, a CREATE TABLE undoing a DROP)
// which is not itself a breaking change — scanning it would produce false positives.
// Dropping an index is intentionally NOT listed: it is a performance concern, not a
// data/schema-contract break.
const DESTRUCTIVE_RULES: { label: string, test: (sql: string) => boolean }[] = [
    { label: 'DROP TABLE', test: (sql) => /\bDROP\s+TABLE\b/i.test(sql) },
    { label: 'DROP COLUMN', test: (sql) => /\bDROP\s+COLUMN\b/i.test(sql) },
    { label: 'DROP CONSTRAINT', test: (sql) => /\bDROP\s+CONSTRAINT\b/i.test(sql) },
    { label: 'ALTER COLUMN ... TYPE', test: (sql) => /\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/i.test(sql) },
    { label: 'ADD ... NOT NULL without DEFAULT', test: hasUnsafeNotNullAdd },
]

function extractSqlLiterals(source: string): string[] {
    const backtick = source.match(/`[\s\S]*?`/g) ?? []
    const single = source.match(/'(?:[^'\\]|\\.)*'/g) ?? []
    return [...backtick, ...single]
}

function extractUpSql(source: string): string[] {
    const upStart = source.search(/\b(public\s+)?async\s+up\s*\(/)
    if (upStart === -1) {
        return []
    }
    const rest = source.slice(upStart)
    const downRel = rest.search(/\b(public\s+)?async\s+down\s*\(/)
    const upBody = downRel === -1 ? rest : rest.slice(0, downRel)
    return extractSqlLiterals(upBody)
}

function readBreakingFlag(source: string): boolean | undefined {
    const match = source.match(/\bbreaking\s*=\s*(true|false)\b/)
    if (!match) {
        return undefined
    }
    return match[1] === 'true'
}

function runSelfCheck(): void {
    const destructiveFile = 'packages/server/api/src/app/database/migration/postgres/1804000000000-DropBadges.ts'
    const additiveFile = 'packages/server/api/src/app/database/migration/postgres/1807000000000-AddChatConversationStreamingUpdatedIndex.ts'
    const [destructive, additive] = scanMigrations({ files: [destructiveFile, additiveFile] })

    assert(destructive.destructive === true, `expected DropBadges up() to be destructive, got ${JSON.stringify(destructive.ddl)}`)
    assert(destructive.breaking === true, 'expected DropBadges to declare breaking = true')
    assert(additive.destructive === false, `expected additive index migration to be non-destructive, got ${JSON.stringify(additive.ddl)}`)
    assert(additive.breaking === false, 'expected additive index migration to declare breaking = false')

    assert(hasUnsafeNotNullAdd('ADD COLUMN "a" text NOT NULL') === true, 'single NOT NULL without DEFAULT is unsafe')
    assert(hasUnsafeNotNullAdd('ADD COLUMN "a" boolean NOT NULL DEFAULT false') === false, 'NOT NULL with DEFAULT is safe')
    assert(hasUnsafeNotNullAdd('ADD COLUMN "a" boolean NOT NULL DEFAULT false, ADD COLUMN "b" text NOT NULL') === true, 'multi-column: a DEFAULT on one column must not mask NOT-NULL-without-DEFAULT on another')
    assert(hasUnsafeNotNullAdd('ADD COLUMN "a" text') === false, 'nullable ADD is safe')

    console.log('migration-ddl self-check passed')
}

export function scanMigrations({ files }: { files: string[] }): MigrationScanResult[] {
    return files.map((file) => {
        const source = readFileSync(file, 'utf-8')
        const sqlStatements = extractUpSql(source)
        const ddl = DESTRUCTIVE_RULES
            .filter((rule) => sqlStatements.some((sql) => rule.test(sql)))
            .map((rule) => rule.label)
        return {
            file,
            breaking: readBreakingFlag(source),
            destructive: ddl.length > 0,
            ddl,
        }
    })
}

if (process.argv[1]?.endsWith('migration-ddl.ts')) {
    runSelfCheck()
}

export type MigrationScanResult = {
    file: string
    breaking: boolean | undefined
    destructive: boolean
    ddl: string[]
}
