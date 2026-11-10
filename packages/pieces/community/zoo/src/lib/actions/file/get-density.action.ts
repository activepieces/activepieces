import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { cadFileAnalysis } from '../../common/cad-file-analysis';

export const getDensityAction = createAction({
  name: 'get_density',
  classification: 'READ',
  displayName: 'Get Density',
  description: 'Calculate the density of a CAD file',
  audience: 'both',
  aiMetadata: { description: 'Compute the density of a 3D solid from an uploaded CAD file (FBX, GLB, glTF, OBJ, PLY, STEP, or STL). Pick this for the mass-per-unit-volume mass property specifically; sibling actions cover mass, volume, surface area, and center of mass. Read-only analysis that does not modify the file and returns the same value for the same input.', idempotent: true },
  auth: zooAuth,
  // category: 'File Operations',
  props: {
    file: Property.File({
      displayName: 'CAD File',
      required: true,
      description: 'The CAD file to analyze',
    }),
    sourceFormat: cadFileAnalysis.sourceFormat,
    materialMass: Property.Number({
      displayName: 'Material Mass',
      description: 'Mass of the part, in the unit below',
      required: true,
    }),
    materialMassUnit: Property.StaticDropdown({
      displayName: 'Material Mass Unit',
      required: true,
      defaultValue: 'kg',
      options: {
        options: [
          { label: 'g', value: 'g' },
          { label: 'kg', value: 'kg' },
          { label: 'lb', value: 'lb' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return cadFileAnalysis.analyze({
      token: auth.secret_text,
      endpoint: 'density',
      file: propsValue.file,
      sourceFormat: propsValue.sourceFormat,
      queryParams: {
        material_mass: String(propsValue.materialMass),
        material_mass_unit: propsValue.materialMassUnit,
      },
    });
  },
});
