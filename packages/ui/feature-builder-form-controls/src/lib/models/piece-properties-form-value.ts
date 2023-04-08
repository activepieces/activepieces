import { PiecePropertyMap } from '@activepieces/shared';

export interface PiecePropertiesFormValue {
  properties: PiecePropertyMap;
  propertiesValues: Record<string, unknown>;
  customizedInputs?: Record<string, boolean>;
  setDefaultValues: boolean;
}
