import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { cadFileAnalysis } from '../../common/cad-file-analysis';

export const getCenterOfMassAction = createAction({
  name: 'get_center_of_mass',
  classification: 'READ',
  displayName: 'Get Center of Mass',
  description: 'Calculate the center of mass of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the center-of-mass coordinates of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for the centroid/balance-point specifically; sibling actions cover mass, density, volume, and surface area. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
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
    return cadFileAnalysis.analyze({ token: auth.secret_text, endpoint: 'center-of-mass', file: propsValue.file, sourceFormat: propsValue.sourceFormat });
  },
});
