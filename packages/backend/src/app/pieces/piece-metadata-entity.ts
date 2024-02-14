import { EntitySchema } from 'typeorm'
import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { ApId, BaseModel, FileId, PackageType, PieceType, Project, ProjectId } from '@activepieces/shared'
import { ARRAY_COLUMN_TYPE, ApIdSchema, BaseColumnSchemaPart, COLLATION, JSON_COLUMN_TYPE, isPostgres } from '../database/database-common'

type PiecePackageMetadata = {
    projectId?: ProjectId
    pieceType: PieceType
    packageType: PackageType
    archiveId?: FileId
}

export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata

export type PieceMetadataModelSummary = PieceMetadataSummary & PiecePackageMetadata

export type PieceMetadataSchema = BaseModel<ApId> & PieceMetadataModel

type PieceMetadataSchemaWithRelations = PieceMetadataSchema & {
    project: Project
}

export const PieceMetadataEntity = new EntitySchema<PieceMetadataSchemaWithRelations>({
    name: 'piece_metadata',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        logoUrl: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        projectId: {
            type: String,
            nullable: true,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        version: {
            type: String,
            nullable: false,
            collation: COLLATION,
        },
        minimumSupportedRelease: {
            type: String,
            nullable: false,
            collation: COLLATION,
        },
        maximumSupportedRelease: {
            type: String,
            nullable: false,
            collation: COLLATION,
        },
        auth: {
            type: JSON_COLUMN_TYPE,
            nullable: true,
        },
        actions: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
        triggers: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
        pieceType: {
            type: String,
            nullable: false,
        },
        categories: {
            type: ARRAY_COLUMN_TYPE,
            nullable: true,
            array: isPostgres(),
        },
        packageType: {
            type: String,
            nullable: false,
        },
        archiveId: {
            ...ApIdSchema,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_piece_metadata_name_project_id_version',
            columns: ['name', 'version', 'projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_piece_metadata_project_id',
            },
            nullable: true,
        },
        archiveId: {
            type: 'one-to-one',
            target: 'file',
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
            joinColumn: {
                name: 'archiveId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_piece_metadata_file',
            },
        },
    },
})
