import { PieceMetadataModel } from '@activepieces/pieces-framework'
import {
    ApId,
    BaseModel,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    COLLATION,
} from '../../database/database-common'

export type PieceMetadataSchema = BaseModel<ApId> & PieceMetadataModel

export const PieceMetadataEntity =
  new EntitySchema<PieceMetadataSchema>({
      name: 'piece_metadata',
      columns: {
          ...BaseColumnSchemaPart,
          name: {
              type: String,
              nullable: false,
          },
          authors: {
              type: String,
              nullable: false,
              array: true,
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
              type: 'json',
              nullable: true,
          },
          actions: {
              type: 'json',
              nullable: false,
          },
          triggers: {
              type: 'json',
              nullable: false,
          },
          pieceType: {
              type: String,
              nullable: false,
          },
          categories: {
              type: String,
              nullable: true,
              array: true,
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
              type: 'json',
              nullable: true,
          },
      },
      indices: [
          {
              name: 'idx_piece_metadata_name_platform_id_version',
              columns: ['name', 'version', 'platformId'],
              unique: true,
          },
      ],
      relations: {
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
