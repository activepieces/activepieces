type UnknownRecord = Record<string, unknown>;

export type StkRequestContext = {
  businessShortCode: string;
  transactionType: string;
  amount: number;
  phoneNumber: string;
  partyB: string;
  accountReference: string;
  transactionDescription: string;
};

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

function numericResultCode(value: unknown): number | null {
  const code = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(code) ? code : null;
}

export function parseStkCallback(payload: unknown, request?: StkRequestContext) {
  const body = record(payload);
  const callback = record(record(body['Body'])['stkCallback']);
  if (Object.keys(callback).length === 0) {
    throw new Error('Invalid M-Pesa STK callback: Body.stkCallback is missing.');
  }
  const resultCode = numericResultCode(callback['ResultCode']);
  const metadataItems = record(callback['CallbackMetadata'])['Item'];
  const values = Array.isArray(metadataItems)
    ? Object.fromEntries(metadataItems.flatMap((entry) => {
        const item = record(entry);
        return typeof item['Name'] === 'string' ? [[item['Name'], item['Value'] ?? null]] : [];
      }))
    : {};

  return {
    successful: resultCode === 0,
    resultCode,
    resultDescription: callback['ResultDesc'] ?? null,
    merchantRequestId: callback['MerchantRequestID'] ?? null,
    checkoutRequestId: callback['CheckoutRequestID'] ?? null,
    amount: values['Amount'] ?? request?.amount ?? null,
    mpesaReceiptNumber: values['MpesaReceiptNumber'] ?? null,
    transactionDate: values['TransactionDate'] ?? null,
    phoneNumber: values['PhoneNumber'] ?? request?.phoneNumber ?? null,
    businessShortCode: request?.businessShortCode ?? null,
    partyB: request?.partyB ?? null,
    transactionType: request?.transactionType ?? null,
    accountReference: request?.accountReference ?? null,
    transactionDescription: request?.transactionDescription ?? null,
    completedAt: new Date().toISOString(),
    request: request ?? null,
    metadata: values,
    raw: payload,
  };
}

export function parseTransactionCallback(payload: unknown, event: 'result' | 'timeout') {
  const result = record(record(payload)['Result']);
  if (event === 'result' && Object.keys(result).length === 0) {
    throw new Error('Invalid M-Pesa result callback: Result is missing.');
  }
  const resultCode = event === 'timeout' ? null : numericResultCode(result['ResultCode']);
  const parameterItems = record(result['ResultParameters'])['ResultParameter'];
  const values = Array.isArray(parameterItems)
    ? Object.fromEntries(parameterItems.flatMap((entry) => {
        const item = record(entry);
        return typeof item['Key'] === 'string' ? [[item['Key'], item['Value'] ?? null]] : [];
      }))
    : {};

  return {
    successful: event === 'result' && resultCode === 0,
    event,
    resultCode,
    resultDescription: event === 'timeout' ? 'M-Pesa queued request timed out.' : result['ResultDesc'] ?? null,
    conversationId: result['ConversationID'] ?? null,
    originatorConversationId: result['OriginatorConversationID'] ?? null,
    transactionId: result['TransactionID'] ?? null,
    parameters: values,
    raw: payload,
  };
}
