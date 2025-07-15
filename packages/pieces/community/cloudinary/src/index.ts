
import { createPiece } from "@activepieces/pieces-framework";
import { cloudinaryAuth } from "./lib/common/auth";
import { uploadResource } from "./lib/actions/upload-resource";
import { deleteResource } from "./lib/actions/delete-resource";
import { createUsageReport } from "./lib/actions/create-usage-report";
import { findResourceByPublicId } from "./lib/actions/find-resource-by-public-id";
import { transformResource } from "./lib/actions/transform-resource";

export const cloudinary = createPiece({
  displayName: "Cloudinary ",
  auth: cloudinaryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/cloudinary.png",
  authors: ['Sanket6652'],
  actions: [uploadResource, deleteResource, createUsageReport, findResourceByPublicId, transformResource],
  triggers: [],
});
