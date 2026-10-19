import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { cadFileAnalysis } from '../../common/cad-file-analysis';

export const getMassAction = createAction({
  name: 'get_mass',
  classification: 'READ',
  displayName: 'Get Mass',
  description: 'Calculate the mass of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the mass of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for total mass specifically; sibling actions cover density, volume, surface area, and center of mass. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
  auth: zooAuth,
  // category: 'File Operations',
  props: {
    file: Property.File({
      displayName: 'CAD File',
      required: true,
      description: 'The CAD file to analyze',
    }),
    sourceFormat: cadFileAnalysis.sourceFormat,
    materialDensity: Property.Number({
      displayName: 'Material Density',
      description: 'Density of the material the part is made of, in the unit below',
      required: true,
    }),
    materialDensityUnit: Property.StaticDropdown({
      displayName: 'Material Density Unit',
      required: true,
      defaultValue: 'kg:m3',
      options: {
        options: [
          { label: 'kg/m³', value: 'kg:m3' },
          { label: 'lb/ft³', value: 'lb:ft3' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return cadFileAnalysis.analyze({
      token: auth.secret_text,
      endpoint: 'mass',
      file: propsValue.file,
      sourceFormat: propsValue.sourceFormat,
      queryParams: {
        material_density: String(propsValue.materialDensity),
        material_density_unit: propsValue.materialDensityUnit,
      },
    });
  },
});
