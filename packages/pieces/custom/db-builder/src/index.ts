import { createPiece, Property, PieceAuth } from '@activepieces/pieces-framework';
import { list } from "./lib/actions/list";

export const dbBuilderAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    orgId: Property.ShortText({
      displayName: 'Organization ID',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const baseUrl = 'http://172.29.144.1:6060/node-service/api';
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
  actions: [list],
  triggers: [],
});