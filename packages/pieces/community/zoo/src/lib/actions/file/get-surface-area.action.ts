import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { cadFileAnalysis } from '../../common/cad-file-analysis';

export const getSurfaceAreaAction = createAction({
  name: 'get_surface_area',
  classification: 'READ',
  displayName: 'Get Surface Area',
  description: 'Calculate the surface area of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the total surface area of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for surface area specifically; sibling actions cover mass, density, volume, and center of mass. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
  auth: zooAuth,
  // category: 'File Operations',
  props: {
    file: Property.File({
      displayName: 'CAD File',
      required: true,
      description: 'The CAD file to analyze',
    }),
    sourceFormat: cadFileAnalysis.sourceFormat,
  },
  async run({ auth, propsValue }) {
    return cadFileAnalysis.analyze({ token: auth.secret_text, endpoint: 'surface-area', file: propsValue.file, sourceFormat: propsValue.sourceFormat });
  },
});
