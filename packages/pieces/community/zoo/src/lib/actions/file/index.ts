import { getCenterOfMassAction } from './get-center-of-mass.action';
import { convertCadFileAction } from './convert-cad-file.action';
import { getDensityAction } from './get-density.action';
import { getMassAction } from './get-mass.action';
import { getSurfaceAreaAction } from './get-surface-area.action';
import { getVolumeAction } from './get-volume.action';

export const FILE_ACTIONS = [
  getCenterOfMassAction,
  convertCadFileAction,
  getDensityAction,
  getMassAction,
  getSurfaceAreaAction,
  getVolumeAction,
];
