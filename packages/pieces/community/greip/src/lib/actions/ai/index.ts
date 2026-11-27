import { bulkLookupIpsAction } from './geo/bulk-lookup-ips';
import { lookupIpAction } from './lookup/lookup-ip';
import { getCountryAction } from './lookup/get-country';
import { lookupAsnAction } from './lookup/lookup-asn';
import { lookupBinAction } from './lookup/lookup-bin';
import { validateIbanAction } from './lookup/validate-iban';
import { lookupDomainAction } from './lookup/lookup-domain';
import { scoreIpAction } from './scoring/score-ip';
import { scoreEmailAction } from './scoring/score-email';
import { scorePhoneAction } from './scoring/score-phone';
import { detectProfanityAction } from './scoring/detect-profanity';
import { scorePaymentAction } from './scoring/score-payment';
import { deleteUserDataAction } from './account/delete-user-data';

export const greipAiActions = [
  bulkLookupIpsAction,
  lookupIpAction,
  getCountryAction,
  lookupAsnAction,
  lookupBinAction,
  validateIbanAction,
  lookupDomainAction,
  scoreIpAction,
  scoreEmailAction,
  scorePhoneAction,
  detectProfanityAction,
  scorePaymentAction,
  deleteUserDataAction,
];
