import { Static, Type } from '@sinclair/typebox';
import { BaseModelSchema } from '@activepieces/shared';

export type ReferralId = string;

export const Referral = Type.Object({
  ...BaseModelSchema,
  referredUserId: Type.String({
    description: 'The ID of the user who was referred.'
  }),
  referringUserId: Type.String({
    description: 'The ID of the user who made the referral.'
  })
});

export type Referral = Static<typeof Referral>;

export const ListReferralsRequest = Type.Object({
  cursor: Type.Optional(Type.String({
    description: 'The cursor to start the list from.'
  })),
  limit: Type.Optional(Type.Number({
    description: 'The maximum number of items to return.'
  }))
});

export type ListReferralsRequest = Static<typeof ListReferralsRequest>;