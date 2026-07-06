import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type ToolSearchIndexSchema = {
    id: string
    created: string
    updated: string
    objectKind: string
    pieceName: string
    pieceVersion: string
    objectName: string
    displayName: string
    retrievalDoc: string
    audience: string | null
    requiresConnection: boolean
    categories: string[] | null
    modelVersion: string
    embeddingInputHash: string
    embedding: string | null
    platformId: string | null
}

export const ToolSearchIndexEntity = new EntitySchema<ToolSearchIndexSchema>({
    name: 'tool_search_index',
    columns: {
        ...BaseColumnSchemaPart,
        objectKind: {
            type: String,
            nullable: false,
        },
        pieceName: {
            type: String,
            nullable: false,
        },
        pieceVersion: {
            type: String,
            nullable: false,
        },
        objectName: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        retrievalDoc: {
            type: 'text',
            nullable: false,
        },
        audience: {
            type: String,
            nullable: true,
        },
        requiresConnection: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        categories: {
            type: String,
            array: true,
            nullable: true,
        },
        modelVersion: {
            type: String,
            nullable: false,
        },
        embeddingInputHash: {
            type: String,
            nullable: false,
        },
        // Dimension-agnostic `vector` (no fixed dim) so a 384/768/1024-d model can coexist with
        // no migration — safe because retrieval uses an exact scan with NO ANN index (only ANN
        // needs a fixed dim). ENGINE_IMPLEMENTATION §10 #6 (recommended, pending final sign-off).
        // NULL until embedded / on embed failure → excluded from reads.
        embedding: {
            type: 'vector',
            nullable: true,
        },
        // NULL = shared official catalog (embedded once, served to all). Set = tenant custom piece.
        // Every query filters (platformId IS NULL OR platformId = $tenant) for isolation.
        platformId: {
            ...ApIdSchema,
            nullable: true,
        },
    },
    indices: [
        // Two partial unique indexes mirror the migration's PG14-safe replacement for a single
        // NULLS NOT DISTINCT index (PG15+ syntax, unsupported on AP's pinned Postgres 14, and not
        // expressible in TypeORM). Shared catalog (platformId IS NULL) dedupes on the object key.
        {
            name: 'uq_tsi_object_shared',
            columns: ['pieceName', 'objectKind', 'objectName', 'modelVersion'],
            unique: true,
            where: '"platformId" IS NULL',
        },
        {
            name: 'uq_tsi_object_tenant',
            columns: ['pieceName', 'objectKind', 'objectName', 'platformId', 'modelVersion'],
            unique: true,
            where: '"platformId" IS NOT NULL',
        },
        {
            name: 'idx_tsi_filters',
            columns: ['objectKind', 'platformId', 'audience', 'requiresConnection'],
        },
    ],
})
