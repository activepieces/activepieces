import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessAiProps } from '../../common/ai-props';
import { scrapelessApi } from '../../common/api';

const ROUND_TRIP = 1;
const MULTI_CITY = 3;

export const searchGoogleFlightsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_google_flights',
  displayName: 'Search Google Flights',
  description:
    'Searches Google Flights for round-trip, one-way or multi-city flights.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Searches Google Flights and returns flight options with prices, airlines, times and booking tokens. Round trip needs a return date; multi-city needs Legs instead of the departure, arrival and dates. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    tripType: Property.StaticDropdown({
      displayName: 'Trip Type',
      description: 'Round trip, one way or multi-city.',
      required: true,
      options: {
        options: [
          { label: 'Round trip', value: 1 },
          { label: 'One way', value: 2 },
          { label: 'Multi-city', value: 3 },
        ],
      },
    }),
    departureId: Property.ShortText({
      displayName: 'Departure',
      description:
        'Departure airport code(s) or location kgmid, comma-separated, e.g. "CDG" or "CDG,ORY".',
      required: false,
    }),
    arrivalId: Property.ShortText({
      displayName: 'Arrival',
      description:
        'Arrival airport code(s) or location kgmid, comma-separated, e.g. "BCN".',
      required: false,
    }),
    outboundDate: Property.ShortText({
      displayName: 'Outbound Date',
      description: 'Departure date, YYYY-MM-DD.',
      required: false,
    }),
    returnDate: Property.ShortText({
      displayName: 'Return Date',
      description: 'Return date, YYYY-MM-DD. Required for round trips.',
      required: false,
    }),
    legs: Property.Json({
      displayName: 'Legs',
      description:
        'Multi-city only: array of legs, e.g. [{"departure_id":"CDG","arrival_id":"NRT","date":"2026-12-01"},{"departure_id":"NRT","arrival_id":"LAX","date":"2026-12-08"}].',
      required: false,
    }),
    travelClass: Property.StaticDropdown({
      displayName: 'Travel Class',
      description: 'Cabin class. Defaults to economy.',
      required: false,
      options: {
        options: [
          { label: 'Economy', value: 1 },
          { label: 'Premium economy', value: 2 },
          { label: 'Business', value: 3 },
          { label: 'First', value: 4 },
        ],
      },
    }),
    stops: Property.StaticDropdown({
      displayName: 'Stops',
      description: 'Maximum number of stops. Defaults to any.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 0 },
          { label: 'Nonstop only', value: 1 },
          { label: '1 stop or fewer', value: 2 },
          { label: '2 stops or fewer', value: 3 },
        ],
      },
    }),
    adults: Property.Number({
      displayName: 'Adults',
      description: 'Number of adults. Defaults to 1.',
      required: false,
    }),
    children: Property.Number({
      displayName: 'Children',
      description: 'Number of children. Defaults to 0.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Currency code for prices, e.g. "USD" (the default) or "EUR".',
      required: false,
    }),
    maxPrice: Property.Number({
      displayName: 'Max Price',
      description: 'Maximum ticket price.',
      required: false,
    }),
    includeAirlines: Property.ShortText({
      displayName: 'Include Airlines',
      description:
        'Only these IATA airline codes, comma-separated, e.g. "UA,AF". Can’t be combined with Exclude Airlines.',
      required: false,
    }),
    excludeAirlines: Property.ShortText({
      displayName: 'Exclude Airlines',
      description:
        'Leave out these IATA airline codes, comma-separated. Can’t be combined with Include Airlines.',
      required: false,
    }),
    country: scrapelessAiProps.country({ required: false }),
    language: scrapelessAiProps.language({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { tripType, legs } = propsValue;
    if (tripType === MULTI_CITY) {
      if (!Array.isArray(legs) || legs.length === 0) {
        throw new Error(
          'Legs must be a non-empty array for a multi-city search.'
        );
      }
    } else if (
      !propsValue.departureId ||
      !propsValue.arrivalId ||
      !propsValue.outboundDate
    ) {
      throw new Error(
        'Departure, Arrival and Outbound Date are required unless Trip Type is multi-city.'
      );
    }
    if (tripType === ROUND_TRIP && !propsValue.returnDate) {
      throw new Error('Return Date is required for a round trip.');
    }
    if (propsValue.includeAirlines && propsValue.excludeAirlines) {
      throw new Error('Set Include Airlines or Exclude Airlines, not both.');
    }
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.google.flights',
      input: {
        data_type: tripType,
        departure_id: propsValue.departureId,
        arrival_id: propsValue.arrivalId,
        outbound_date: propsValue.outboundDate,
        return_date: propsValue.returnDate,
        multi_city_json:
          tripType === MULTI_CITY && Array.isArray(legs)
            ? JSON.stringify(legs)
            : undefined,
        travel_class: propsValue.travelClass,
        stops: propsValue.stops,
        adults: propsValue.adults,
        children: propsValue.children,
        currency: propsValue.currency,
        max_price: propsValue.maxPrice,
        include_airlines: propsValue.includeAirlines,
        exclude_airlines: propsValue.excludeAirlines,
        gl: propsValue.country,
        hl: propsValue.language,
      },
    });
  },
});
