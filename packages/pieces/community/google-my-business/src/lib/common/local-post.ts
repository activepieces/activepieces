import { isNil } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';

function buildContent({
  topicType,
  summary,
  languageCode,
  scheduledTime,
  mediaSourceUrl,
  callToActionType,
  callToActionUrl,
  eventTitle,
  eventStartDate,
  eventStartTime,
  eventEndDate,
  eventEndTime,
  offerCouponCode,
  offerRedeemOnlineUrl,
  offerTermsConditions,
  alertType,
}: LocalPostContent): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (!isNil(topicType)) body['topicType'] = topicType;
  if (!isNil(summary)) body['summary'] = summary;
  if (!isNil(languageCode)) body['languageCode'] = languageCode;
  if (!isNil(scheduledTime)) body['scheduledTime'] = scheduledTime;

  if (!isNil(callToActionType)) {
    body['callToAction'] =
      callToActionType === 'CALL'
        ? { actionType: callToActionType }
        : { actionType: callToActionType, url: callToActionUrl };
  }

  if (!isNil(mediaSourceUrl)) {
    body['media'] = [{ mediaFormat: 'PHOTO', sourceUrl: mediaSourceUrl }];
  }

  const hasSchedule = !isNil(eventStartDate) && !isNil(eventEndDate);
  if (!isNil(eventTitle) || hasSchedule) {
    body['event'] = {
      ...(isNil(eventTitle) ? {} : { title: eventTitle }),
      ...(hasSchedule
        ? {
            schedule: {
              startDate: toGoogleDate(eventStartDate),
              ...(isNil(eventStartTime) ? {} : { startTime: toGoogleTime(eventStartTime) }),
              endDate: toGoogleDate(eventEndDate),
              ...(isNil(eventEndTime) ? {} : { endTime: toGoogleTime(eventEndTime) }),
            },
          }
        : {}),
    };
  }

  const offer = {
    ...(isNil(offerCouponCode) ? {} : { couponCode: offerCouponCode }),
    ...(isNil(offerRedeemOnlineUrl) ? {} : { redeemOnlineUrl: offerRedeemOnlineUrl }),
    ...(isNil(offerTermsConditions) ? {} : { termsConditions: offerTermsConditions }),
  };
  if (Object.keys(offer).length > 0) {
    body['offer'] = offer;
  }

  if (!isNil(alertType)) body['alertType'] = alertType;

  return body;
}

function assertValid({
  topicType,
  eventTitle,
  eventStartDate,
  eventEndDate,
  callToActionType,
  callToActionUrl,
  alertType,
}: LocalPostContent): void {
  const needsSchedule = topicType === 'EVENT' || topicType === 'OFFER';
  if (needsSchedule && (isNil(eventTitle) || isNil(eventStartDate) || isNil(eventEndDate))) {
    throw new Error(
      'Event and Offer posts require an Event / Offer Title, a Start Date and an End Date.',
    );
  }
  if (topicType === 'ALERT' && isNil(alertType)) {
    throw new Error('Alert posts require an Alert Type.');
  }
  if (!isNil(callToActionType) && callToActionType !== 'CALL' && isNil(callToActionUrl)) {
    throw new Error('A Call To Action URL is required for every call to action except Call Now.');
  }
  if (!isNil(eventStartDate) !== !isNil(eventEndDate)) {
    throw new Error('A Start Date and an End Date must be given together.');
  }
}

function toGoogleDate(value: string): GoogleDate {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function toGoogleTime(value: string): GoogleTimeOfDay {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const localPostUtils = {
  buildContent,
  assertValid,
  postNamePattern: /^accounts\/[^/]+\/locations\/[^/]+\/localPosts\/[^/]+$/,
  scheduleValidation: {
    eventStartDate: z.optional(z.string().check(z.regex(DATE_PATTERN))),
    eventEndDate: z.optional(z.string().check(z.regex(DATE_PATTERN))),
    eventStartTime: z.optional(z.string().check(z.regex(TIME_PATTERN))),
    eventEndTime: z.optional(z.string().check(z.regex(TIME_PATTERN))),
  },
  topicOptions: [
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Event', value: 'EVENT' },
    { label: 'Offer', value: 'OFFER' },
    { label: 'Alert', value: 'ALERT' },
  ],
  callToActionOptions: [
    { label: 'Book', value: 'BOOK' },
    { label: 'Order Online', value: 'ORDER' },
    { label: 'Shop', value: 'SHOP' },
    { label: 'Learn More', value: 'LEARN_MORE' },
    { label: 'Sign Up', value: 'SIGN_UP' },
    { label: 'Call Now', value: 'CALL' },
  ],
  alertTypeOptions: [{ label: 'COVID-19', value: 'COVID_19' }],
  baseUrl: 'https://mybusiness.googleapis.com/v4',
};

export type LocalPostContent = {
  topicType?: string;
  summary?: string;
  languageCode?: string;
  scheduledTime?: string;
  mediaSourceUrl?: string;
  callToActionType?: string;
  callToActionUrl?: string;
  eventTitle?: string;
  eventStartDate?: string;
  eventStartTime?: string;
  eventEndDate?: string;
  eventEndTime?: string;
  offerCouponCode?: string;
  offerRedeemOnlineUrl?: string;
  offerTermsConditions?: string;
  alertType?: string;
};

type GoogleDate = {
  year: number;
  month: number;
  day: number;
};

type GoogleTimeOfDay = {
  hours: number;
  minutes: number;
};
