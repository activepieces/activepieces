import { createPiece } from '@activepieces/pieces-framework';
import { create1stopBooking } from './lib/actions/create-1-stop-booking';
import { create2stopBooking } from './lib/actions/create-2-stop-booking';
import { motiontoolsAuth } from './lib/common/auth';
import { bookingCreated } from './lib/triggers/booking-created';
import { bookingStatusUpdate } from './lib/triggers/booking-status-update';
import { bookingStopStatusUpdate } from './lib/triggers/booking-stop-status-update';
import { packageCreated } from './lib/triggers/package-created';
import { packageStatusUpdate } from './lib/triggers/package-status-update';

export const motiontools = createPiece({
  displayName: 'MotionTools',
  auth: motiontoolsAuth,
  description:
    'Digitize processes, boost efficiency and excite users with MotionTools, the operating system for fleet-based service providers.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/motiontools.png',
  authors: ['sanket-a11y'],
  actions: [create1stopBooking, create2stopBooking],
  triggers: [
    bookingCreated,
    bookingStatusUpdate,
    bookingStopStatusUpdate,
    packageCreated,
    packageStatusUpdate,
  ],
});
