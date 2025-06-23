import { createPiece, Property, PieceAuth } from '@activepieces/pieces-framework';
import { list } from "./lib/actions/list";
import { createRow } from './lib/actions/createRow';
import { updateRow } from './lib/actions/updateRow';
import {deleteRow} from './lib/actions/deleteRow';
import { runCustomSql } from './lib/actions/runCustomSql';

export const dbBuilderAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    orgId: Property.ShortText({
      displayName: 'Organization ID',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const baseUrl = `${process.env['AP_NODE_SERVICE_URL']}/node-service/api`;
    const orgId = auth.orgId;

    try {
      const response = await fetch(`${baseUrl}/dbBuilder/${orgId}/test`, {
        method: 'GET',
      });

      const errorText = await response.text();

      if (response.ok) {
        return {
          valid: true,
          displayName: `Org ${orgId} is valid`,
        };
      } else {
        return {
          valid: false,
          error: `(${response.status}) ${errorText || 'Validation failed'}`,
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        error: `Exception: ${error?.message || 'Connection validation failed'}`,
      };
    }
  },
});

export const dbBuilder = createPiece({
  displayName: 'db-builder',
  auth: dbBuilderAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/db-builder.png',
  authors: [],
  actions: [list,createRow,updateRow,deleteRow, runCustomSql],
  triggers: [],
});