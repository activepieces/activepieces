import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PaperformAuth } from './lib/common/auth';
import { createFormCoupon } from './lib/actions/create-form-coupon';
import { createFormProduct } from './lib/actions/create-form-product';
import { createSpace } from './lib/actions/create-space';
import { deleteFormCoupon } from './lib/actions/delete-form-coupon';
import { deleteFormProduct } from './lib/actions/delete-form-product';
import { deleteFormSubmission } from './lib/actions/delete-form-submission';
import { deletePartialFormSubmission } from './lib/actions/delete-partial-form-submission';
import { findFormProduct } from './lib/actions/find-form-product';
import { findForm } from './lib/actions/find-form';
import { findSpace } from './lib/actions/find-space';
import { updateFormCoupon } from './lib/actions/update-form-coupon';
import { updateFormProduct } from './lib/actions/update-form-product';
import { updateSpace } from './lib/actions/update-space';
import { newFormSubmission } from './lib/triggers/new-form-submission';
import { newPartialFormSubmission } from './lib/triggers/new-partial-form-submission';

export const paperform = createPiece({
  displayName: 'Paperform',
  auth: PaperformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/paperform.png',
  authors: ['Sanket6652'],
  actions: [
    createFormCoupon,
    createFormProduct,
    createSpace,
    deleteFormCoupon,
    deleteFormProduct,
    deleteFormSubmission,
    deletePartialFormSubmission,
    findFormProduct,
    findForm,
    findSpace,
    updateFormCoupon,
    updateFormProduct,
    updateSpace,
  ],
  triggers: [newFormSubmission, newPartialFormSubmission],
});
