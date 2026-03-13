import { bookingCreated } from './booking-created';
import { bookingAccepted } from './booking-accepted';
import { bookingChanged } from './booking-changed';
import { bookingCheckin } from './booking-checkin';
import { bookingCheckout } from './booking-checkout';
import { bookingCanceled } from './booking-canceled';
import { bookingFailed } from './booking-failed';
import { optionCreated } from './option-created';
import { optionAccepted } from './option-accepted';
import { optionCanceled } from './option-canceled';
import { optionExpired } from './option-expired';
import { orderOrdered } from './order-ordered';
import { messageSent } from './message-sent';
import { messageReceived } from './message-received';
import { reviewCreated } from './review-created';
import { reviewRequest } from './review-request';

export const formitableTriggers = [
  bookingCreated,
  bookingAccepted,
  bookingChanged,
  bookingCheckin,
  bookingCheckout,
  bookingCanceled,
  bookingFailed,
  optionCreated,
  optionAccepted,
  optionCanceled,
  optionExpired,
  orderOrdered,
  messageSent,
  messageReceived,
  reviewCreated,
  reviewRequest,
];
