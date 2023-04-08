import { PiecePropertyMap } from '@activepieces/pieces-framework';

export interface PiecePropertiesFormValue {
  properties: PiecePropertyMap;
  propertiesValues: Record<string, unknown>;
  customizedInputs?: Record<string, boolean>;
  setDefaultValues: boolean;
}
