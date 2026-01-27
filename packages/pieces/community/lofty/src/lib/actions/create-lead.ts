import { createAction, Property } from '@activepieces/pieces-framework';
import { loftyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLead = createAction({
  auth: loftyAuth,
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Create a lead in Lofty',
  props: {
    firstName: Property.ShortText({
      displayName: 'First name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last name',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email',
      description: 'Lead email address(s)',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'YYYY-MM-DD',
      required: false,
    }),
    mailingAddress: Property.ShortText({
      displayName: 'Street or Complete Address (Mailing Address)',
      required: false,
    }),
    mailingCity: Property.ShortText({
      displayName: 'City (Mailing Address)',
      required: false,
    }),
    mailingState: Property.ShortText({
      displayName: 'State (Mailing Address)',
      required: false,
    }),
    mailingZipcode: Property.ShortText({
      displayName: 'Zip Code (Mailing Address)',
      required: false,
    }),
    leadType: Property.ShortText({
      displayName: 'Lead Type',
      required: false,
    }),
    leadOwnershipLevel: Property.ShortText({
      displayName: 'Lead Ownership Level',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
    }),
    segment: Property.ShortText({
      displayName: 'Segment',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag(s)',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    subscriptionSmartPlans: Property.Checkbox({
      displayName: 'Subscription - Smart Plans',
      required: false,
    }),
    subscriptionPropertyAlert: Property.Checkbox({
      displayName: 'Subscription - Property Alert',
      required: false,
    }),
    subscriptionMarketReport: Property.Checkbox({
      displayName: 'Subscription - Market Report',
      required: false,
    }),
    minPriceBuyer: Property.Number({
      displayName: 'Min Price (Buyer)',
      required: false,
    }),
    maxPriceBuyer: Property.Number({
      displayName: 'Max Price (Buyer)',
      required: false,
    }),
    locationDeprecated: Property.ShortText({
      displayName: 'Location (Deprecated)',
      required: false,
    }),
    buyerCity: Property.ShortText({
      displayName: 'City (Buyer)',
      required: false,
    }),
    buyerState: Property.ShortText({
      displayName: 'State (Buyer)',
      required: false,
    }),
    buyerZipcode: Property.ShortText({
      displayName: 'Zipcode (Buyer)',
      required: false,
    }),
    buyerAddress: Property.ShortText({
      displayName: 'Address (Buyer)',
      required: false,
    }),
    minBedsBuyer: Property.Number({
      displayName: 'Min Beds (Buyer)',
      required: false,
    }),
    minBathsBuyer: Property.Number({
      displayName: 'Min Baths (Buyer)',
      required: false,
    }),
    bedsSeller: Property.Number({
      displayName: 'Beds (Seller)',
      required: false,
    }),
    bathsSeller: Property.Number({
      displayName: 'Baths (Seller)',
      required: false,
    }),
    priceSeller: Property.Number({
      displayName: 'Price (Seller)',
      required: false,
    }),
    addressSeller: Property.ShortText({
      displayName: 'Address (Seller)',
      required: false,
    }),
    sqftSeller: Property.Number({
      displayName: 'SqFt (Seller)',
      required: false,
    }),
    citySeller: Property.ShortText({
      displayName: 'City (Seller)',
      required: false,
    }),
    stateSeller: Property.ShortText({
      displayName: 'State (Seller)',
      required: false,
    }),
    zipcodeSeller: Property.ShortText({
      displayName: 'Zipcode (Seller)',
      required: false,
    }),
    sendWelcomeEmail: Property.Checkbox({
      displayName: 'Send Welcome Email',
      required: false,
    }),
    callOptIn: Property.Checkbox({
      displayName: 'Call Opt In',
      required: false,
    }),
    textOptIn: Property.Checkbox({
      displayName: 'Text Opt In',
      required: false,
    }),
    emailOptIn: Property.Checkbox({
      displayName: 'Email Opt In',
      required: false,
    }),
    numberConsent: Property.Checkbox({
      displayName: 'Number Consent',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const payload: any = {
      emails: propsValue.emails,
    };

    if (propsValue.firstName) payload.first_name = propsValue.firstName;
    if (propsValue.lastName) payload.last_name = propsValue.lastName;
    if (propsValue.phone) payload.phone = propsValue.phone;
    if (propsValue.source) payload.source = propsValue.source;
    if (propsValue.birthday) payload.birthday = propsValue.birthday;
    if (propsValue.mailingAddress)
      payload.mailing_address = propsValue.mailingAddress;
    if (propsValue.mailingCity) payload.mailing_city = propsValue.mailingCity;
    if (propsValue.mailingState)
      payload.mailing_state = propsValue.mailingState;
    if (propsValue.mailingZipcode)
      payload.mailing_zipcode = propsValue.mailingZipcode;
    if (propsValue.leadType) payload.lead_type = propsValue.leadType;
    if (propsValue.leadOwnershipLevel)
      payload.lead_ownership_level = propsValue.leadOwnershipLevel;
    if (propsValue.segment) payload.segment = propsValue.segment;
    if (propsValue.tags) payload.tags = propsValue.tags;
    if (propsValue.note) payload.note = propsValue.note;
    if (propsValue.subscriptionSmartPlans !== undefined)
      payload.subscription_smart_plans = propsValue.subscriptionSmartPlans;
    if (propsValue.subscriptionPropertyAlert !== undefined)
      payload.subscription_property_alert =
        propsValue.subscriptionPropertyAlert;
    if (propsValue.subscriptionMarketReport !== undefined)
      payload.subscription_market_report = propsValue.subscriptionMarketReport;
    if (propsValue.minPriceBuyer !== undefined)
      payload.min_price_buyer = propsValue.minPriceBuyer;
    if (propsValue.maxPriceBuyer !== undefined)
      payload.max_price_buyer = propsValue.maxPriceBuyer;
    if (propsValue.locationDeprecated)
      payload.location_deprecated = propsValue.locationDeprecated;
    if (propsValue.buyerCity) payload.buyer_city = propsValue.buyerCity;
    if (propsValue.buyerState) payload.buyer_state = propsValue.buyerState;
    if (propsValue.buyerZipcode)
      payload.buyer_zipcode = propsValue.buyerZipcode;
    if (propsValue.buyerAddress)
      payload.buyer_address = propsValue.buyerAddress;
    if (propsValue.minBedsBuyer !== undefined)
      payload.min_beds_buyer = propsValue.minBedsBuyer;
    if (propsValue.minBathsBuyer !== undefined)
      payload.min_baths_buyer = propsValue.minBathsBuyer;
    if (propsValue.bedsSeller !== undefined)
      payload.beds_seller = propsValue.bedsSeller;
    if (propsValue.bathsSeller !== undefined)
      payload.baths_seller = propsValue.bathsSeller;
    if (propsValue.priceSeller !== undefined)
      payload.price_seller = propsValue.priceSeller;
    if (propsValue.addressSeller)
      payload.address_seller = propsValue.addressSeller;
    if (propsValue.sqftSeller !== undefined)
      payload.sqft_seller = propsValue.sqftSeller;
    if (propsValue.citySeller) payload.city_seller = propsValue.citySeller;
    if (propsValue.stateSeller) payload.state_seller = propsValue.stateSeller;
    if (propsValue.zipcodeSeller)
      payload.zipcode_seller = propsValue.zipcodeSeller;
    if (propsValue.sendWelcomeEmail !== undefined)
      payload.send_welcome_email = propsValue.sendWelcomeEmail;
    if (propsValue.callOptIn !== undefined)
      payload.call_opt_in = propsValue.callOptIn;
    if (propsValue.textOptIn !== undefined)
      payload.text_opt_in = propsValue.textOptIn;
    if (propsValue.emailOptIn !== undefined)
      payload.email_opt_in = propsValue.emailOptIn;
    if (propsValue.numberConsent !== undefined)
      payload.number_consent = propsValue.numberConsent;

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/leads',
      payload
    );

    return response;
  },
});
