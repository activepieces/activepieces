import { chargekeepClient } from './client';

const { isRecord } = chargekeepClient;

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function records(value: unknown): Record<string, unknown>[] {
  return list(value).filter(isRecord);
}

function importedContact(result: unknown) {
  const r = isRecord(result) ? result : {};
  const contactId = num(r['contactId']);
  if (contactId === null) throw new Error('ChargeKeep did not return a contact ID for the imported contact.');
  return { contactId, leadId: num(r['leadId']), userId: num(r['userId']) };
}

function contact(result: unknown) {
  const r = isRecord(result) ? result : {};
  const person = isRecord(r['person']) ? r['person'] : {};
  const emails = records(r['emails']).map((e) => ({ id: num(e['id']), emailAddress: str(e['emailAddress']), usageTypeId: str(e['usageTypeId']), isActive: bool(e['isActive']), isConfirmed: bool(e['isConfirmed']) }));
  const phones = records(r['phones']).map((p) => ({ id: num(p['id']), phoneNumber: str(p['phoneNumber']), phoneExtension: str(p['phoneExtension']), usageTypeId: str(p['usageTypeId']), isActive: bool(p['isActive']), isConfirmed: bool(p['isConfirmed']) }));
  const addresses = records(r['addresses']).map((a) => ({ id: num(a['id']), usageTypeId: str(a['usageTypeId']), streetAddress: str(a['streetAddress']), neighborhood: str(a['neighborhood']), city: str(a['city']), stateId: str(a['stateId']), stateName: str(a['stateName']), zip: str(a['zip']), countryId: str(a['countryId']), countryName: str(a['countryName']), isActive: bool(a['isActive']) }));
  const primaryEmailId = num(r['primaryEmailId']);
  const primaryPhoneId = num(r['primaryPhoneId']);
  return {
    id: num(r['id']),
    typeId: str(r['typeId']),
    fullName: str(r['fullName']),
    namePrefix: str(person['namePrefix']),
    firstName: str(person['firstName']),
    middleName: str(person['middleName']),
    lastName: str(person['lastName']),
    nameSuffix: str(person['nameSuffix']),
    nickName: str(person['nickName']),
    gender: str(person['gender']),
    dob: str(person['dob']),
    timeZone: str(person['timeZone']),
    userId: num(r['userId']),
    contactDate: str(r['contactDate']),
    primaryEmail: emails.find((e) => e.id === primaryEmailId)?.emailAddress ?? emails[0]?.emailAddress ?? null,
    primaryPhone: phones.find((p) => p.id === primaryPhoneId)?.phoneNumber ?? phones[0]?.phoneNumber ?? null,
    emails,
    phones,
    addresses,
    tags: list(r['tags']),
    lists: list(r['lists']),
    contactXrefs: list(r['contactXrefs']),
    contactAffiliateCodes: list(r['contactAffiliateCodes']),
    affiliateContactId: num(r['affiliateContactId']),
    affiliateContactFullName: str(r['affiliateContactFullName']),
    organization: isRecord(r['organization']) ? r['organization'] : null,
    customField1: str(r['customField1']),
    customField2: str(r['customField2']),
    customField3: str(r['customField3']),
    customField4: str(r['customField4']),
    customField5: str(r['customField5']),
  };
}


function product(result: unknown) {
  const r = isRecord(result) ? result : {};
  return {
    productId: num(r['id']),
    code: str(r['code']),
    name: str(r['name']),
    type: str(r['type']),
    description: str(r['description']),
    currencyId: str(r['currencyId']),
    isArchived: bool(r['isArchived']),
    priceOptions: records(r['priceOptions']).map((o) => ({
      id: num(o['id']),
      type: str(o['type']),
      frequency: str(o['frequency']),
      unit: str(o['unit']),
      fee: num(o['fee']),
      signupFee: num(o['signupFee']),
      cycles: num(o['cycles']),
      trialDayCount: num(o['trialDayCount']),
      customPeriodCount: num(o['customPeriodCount']),
      customPeriodType: str(o['customPeriodType']),
      gracePeriodDayCount: num(o['gracePeriodDayCount']),
    })),
  };
}

function productListItem(item: Record<string, unknown>) {
  return {
    productId: num(item['id']),
    code: str(item['code']),
    name: str(item['name']),
    type: str(item['type']),
    description: str(item['description']),
    paymentOptions: records(item['paymentOptions']).map((o) => ({ priceOptionId: num(o['id']), type: str(o['type']), unitId: str(o['unitId']), unitName: str(o['unitName']), price: num(o['price']) })),
  };
}

function invoice(result: unknown) {
  const r = isRecord(result) ? result : {};
  return {
    invoiceId: num(r['id']),
    number: str(r['number']),
    status: str(r['status']),
    orderNumber: str(r['orderNumber']),
    contactName: str(r['contactName']),
    date: str(r['date']),
    dueDate: str(r['dueDate']),
    currencyId: str(r['currencyId']),
    grandTotal: num(r['grandTotal']),
    discountTotal: num(r['discountTotal']),
    shippingTotal: num(r['shippingTotal']),
    taxTotal: num(r['taxTotal']),
    description: str(r['description']),
    note: str(r['note']),
    lines: records(r['lines']).map((l) => ({
      id: num(l['id']),
      productId: num(l['productId']),
      productCode: str(l['productCode']),
      productName: str(l['productName']),
      description: str(l['description']),
      quantity: num(l['quantity']),
      rate: num(l['rate']),
      total: num(l['total']),
      unitId: str(l['unitId']),
    })),
  };
}

function subscription(item: Record<string, unknown>) {
  return {
    subscriptionId: num(item['id']),
    productId: num(item['productId']),
    productCode: str(item['productCode']),
    productName: str(item['productName']),
    paymentPeriodType: str(item['paymentPeriodType']),
    status: str(item['status']),
    statusCode: str(item['statusCode']),
    startDate: str(item['startDate']),
    endDate: str(item['endDate']),
    trialEndDate: str(item['trialEndDate']),
    fee: num(item['fee']),
    currencyId: str(item['currencyId']),
    cancellationDate: str(item['cancellationDate']),
  };
}

function contactSearchItem(item: Record<string, unknown>) {
  const a = isRecord(item['address']) ? item['address'] : {};
  return {
    contactId: num(item['id']),
    name: str(item['name']),
    email: str(item['email']),
    userId: num(item['userId']),
    city: str(a['city']),
    stateName: str(a['stateName']),
    country: str(a['country']),
  };
}

function contactGroup(item: Record<string, unknown>) {
  return { id: str(item['id']), name: str(item['name']) };
}

export const chargekeepMappers = { num, str, bool, list, records, importedContact, contact, product, productListItem, invoice, subscription, contactSearchItem, contactGroup };
