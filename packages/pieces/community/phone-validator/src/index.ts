
    import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { phoneValidatorAuth } from './lib/common/auth';
import { validatePhone } from './lib/actions';

export const phoneValidator = createPiece({
  displayName: "Phone Validator",
  description: "Validate phone numbers and retrieve line type, carrier, and location information",
  auth: phoneValidatorAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/phone-validator.png",
  categories: [PieceCategory.COMMUNICATION],
  authors: ['onyedikachi-david'],
  actions: [validatePhone],
  triggers: [],
});
