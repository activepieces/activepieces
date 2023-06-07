import { EntitySchema } from 'typeorm'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { ApId, BaseModel, Project } from '@activepieces/shared'
import { BaseColumnSchemaPart } from '../helper/base-entity'

export type PieceMetadataSchema = BaseModel<ApId> & PieceMetadata & { projectId: ApId, project: Project}

export const PieceMetadataEntity = new EntitySchema<PieceMetadataSchema>({
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
        version: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        minimumSupportedRelease: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        maximumSupportedRelease: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        actions: {
            type: 'jsonb',
            nullable: false,
        },
        triggers: {
            type: 'jsonb',
            nullable: false,
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
        },
    },
})
