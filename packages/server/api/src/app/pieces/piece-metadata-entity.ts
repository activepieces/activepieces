import { PieceMetadataModel } from '@activepieces/pieces-framework'
import {
    ApId,
    BaseModel,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    COLLATION,
    isPostgres,
    JSON_COLUMN_TYPE,
} from '../database/database-common'


type PieceMetadataSchemaWithRelations = PieceMetadataSchema & {
    project: Project
}

export type PieceMetadataSchema = BaseModel<ApId> & PieceMetadataModel

export const PieceMetadataEntity =
  new EntitySchema<PieceMetadataSchemaWithRelations>({
      name: 'piece_metadata',
      columns: {
          ...BaseColumnSchemaPart,
          name: {
              type: String,
              nullable: false,
          },
          authors: {
              type: ARRAY_COLUMN_TYPE,
              nullable: false,
              array: isPostgres(),
          },
          displayName: {
              type: String,
              nullable: false,
          },
          logoUrl: {
              type: String,
              nullable: false,
          },
          projectUsage: {
              type: Number,
              nullable: false,
              default: 0,
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
          i18n: {
              type: JSON_COLUMN_TYPE,
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
              onDelete: 'RESTRICT',
              onUpdate: 'RESTRICT',
              joinColumn: {
                  name: 'archiveId',
                  referencedColumnName: 'id',
                  foreignKeyConstraintName: 'fk_piece_metadata_file',
              },
          },
      },
  })
