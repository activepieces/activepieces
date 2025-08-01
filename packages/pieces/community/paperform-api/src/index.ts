
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { paperformCommon } from "./lib/auth";
    import { deleteSubmissionAction } from "./lib/actions/delete-submission";
    import { deletePartialSubmissionAction } from "./lib/actions/delete-partial-submission";
    import { createCouponAction } from "./lib/actions/create-coupon";
    import { updateCouponAction } from "./lib/actions/update-coupon";
    import { deleteCouponAction } from "./lib/actions/delete-coupon";
    import { createProductAction } from "./lib/actions/create-product";
    import { updateProductAction } from "./lib/actions/update-product";
    import { deleteProductAction } from "./lib/actions/delete-product";
    import { createSpaceAction } from "./lib/actions/create-space";
    import { updateSpaceAction } from "./lib/actions/update-space";
    import { findFormAction } from "./lib/actions/find-form";
    import { findFormProductAction } from "./lib/actions/find-form-product";
    import { findSpaceAction } from "./lib/actions/find-space";
    import { formSubmissionTrigger } from "./lib/triggers/form-submission";
    import { partialFormSubmissionTrigger } from "./lib/triggers/partial-form-submission";

    export const paperformApiAuth = PieceAuth.SecretText({
      displayName: "API Key",
      description: "Your Paperform API key. You can generate an API key on your account page.",
      required: true,
      validate: async ({ auth }) => {
        return await paperformCommon.validateApiKey({ auth });
      },
    });

    export const paperformApi = createPiece({
      displayName: "Paperform-api",
      auth: paperformApiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/paperform-api.png",
      authors: [],
      actions: [deleteSubmissionAction, deletePartialSubmissionAction, createCouponAction, updateCouponAction, deleteCouponAction, createProductAction, updateProductAction, deleteProductAction, createSpaceAction, updateSpaceAction, findFormAction, findFormProductAction, findSpaceAction],
      triggers: [formSubmissionTrigger, partialFormSubmissionTrigger],
    });
    