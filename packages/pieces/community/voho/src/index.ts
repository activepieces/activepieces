import { createPiece } from "@activepieces/pieces-framework";
import { startCall } from './lib/actions/start-call';

export const voho = createPiece({
  displayName: "Voho",
  auth: undefined,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://res.cloudinary.com/dlfvhzhvt/image/upload/v1748340903/WhatsApp_Image_2025-05-27_at_15.10.32_2559c925_eekier.jpg",
  authors: [],
  actions: [startCall],
  triggers: [],
});
    