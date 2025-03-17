import { GlobalOAuthApp } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

type GlobalOAuthAppSchema = {
  clientSecret: string
} & GlobalOAuthApp

export const GlobalOAuthAppEntity = new EntitySchema<GlobalOAuthAppSchema>({
  name: 'global_oauth_app',
  columns: {
    ...BaseColumnSchemaPart,
    pieceName: {
      type: String,
    },
    clientId: {
      type: String,
    },
    clientSecret: {
      type: String,
    },
  },
  indices: [
    {
      name: 'idx_global_oauth_app_piece_name',
      columns: ['pieceName'],
      unique: true,
    },
  ],
})
