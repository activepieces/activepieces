import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

const categories = [
  { value: "acquires", label: "Acquires" },
  { value: "merges_with", label: "Merges With" },
  { value: "sells_assets_to", label: "Sells Assets To" },
  { value: "signs_new_client", label: "Signs New Client" },
  { value: "files_suit_against", label: "Files Suit Against" },
  { value: "has_issues_with", label: "Has Issues With" },
  { value: "closes_offices_in", label: "Closes Offices In" },
  { value: "decreases_headcount_by", label: "Decreases Headcount By" },
  { value: "attends_event", label: "Attends Event" },
  { value: "expands_facilities", label: "Expands Facilities" },
  { value: "expands_offices_in", label: "Expands Offices In" },
  { value: "expands_offices_to", label: "Expands Offices To" },
  { value: "increases_headcount_by", label: "Increases Headcount By" },
  { value: "opens_new_location", label: "Opens New Location" },
  { value: "goes_public", label: "Goes Public" },
  { value: "invests_into", label: "Invests Into" },
  { value: "invests_into_assets", label: "Invests Into Assets" },
  { value: "receives_financing", label: "Receives Financing" },
  { value: "hires", label: "Hires" },
  { value: "leaves", label: "Leaves" },
  { value: "promotes", label: "Promotes" },
  { value: "retires_from", label: "Retires From" },
  { value: "integrates_with", label: "Integrates With" },
  { value: "is_developing", label: "Is Developing" },
  { value: "launches", label: "Launches" },
  { value: "partners_with", label: "Partners With" },
  { value: "receives_award", label: "Receives Award" },
  { value: "recognized_as", label: "Recognized As" },
  { value: "identified_as_competitor_of", label: "Identified As Competitor Of" },
];

export const findNewsEventsByDomainAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_news_by_domain',
  displayName: 'List Company News Events',
  description: 'Retrieves news events by company domain',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain of the company to find.',
      required: true,
    }),
    found_at_from: Property.ShortText({
      displayName: 'Found At From',
      description: 'Only return data first seen after given date . Example 2024-09-25',
      required: false,
    }),
    found_at_until: Property.ShortText({
      displayName: 'Found At Until',
      description: 'Only return data first seen before given date . Example 2024-09-25',
      required: false,
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'The categories of news to find.',
      required: false,
      options: {
        options: categories,
      },
    }),
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const domain = context.propsValue.domain;
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;
    const found_at_from = context.propsValue.found_at_from;
    const found_at_until = context.propsValue.found_at_until;
    const categories = context.propsValue.categories

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findNewsByDomain(domain, prepareQuery({
        page,
        limit,
        found_at_from,
        found_at_until,
        categories
      }));
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

export const findNewsEventByIdAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_news_event_by_id',
  displayName: 'Get News Event',
  description: 'Retrieves a single news event by ID.',
  props: {
    id: Property.ShortText({
      displayName: 'ID',
      description: 'The ID of the news event to find.',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.id;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findNewsEventById(id);
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

