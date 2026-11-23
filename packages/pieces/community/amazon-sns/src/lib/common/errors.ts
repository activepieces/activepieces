const HINTS: Record<string, string> = {
  InvalidClientTokenId: 'the Access Key ID is not valid for this region or account',
  UnrecognizedClientException: 'the Access Key ID is not recognised',
  SignatureDoesNotMatch: 'the Secret Access Key does not match the Access Key ID',
  AuthorizationErrorException: 'the IAM user is not allowed to perform this operation',
  AuthorizationError: 'the IAM user is not allowed to perform this operation',
  AccessDeniedException: 'the IAM user is not allowed to perform this operation',
  NotFoundException: 'the topic or subscription was not found (check the ARN and region)',
  NotFound: 'the topic or subscription was not found (check the ARN and region)',
  InvalidParameterException: 'a parameter was rejected',
  InvalidParameter: 'a parameter was rejected',
  InvalidParameterValueException: 'a parameter value was rejected',
  ParameterValueInvalid: 'a parameter value was rejected',
  ThrottledException: 'the request was throttled; try again later',
  Throttling: 'the request was throttled; try again later',
  TopicLimitExceededException: 'the account topic limit was reached',
  SubscriptionLimitExceededException: 'the subscription limit was reached',
  FilterPolicyLimitExceededException: 'the filter policy limit was reached',
  KMSAccessDeniedException: 'SNS cannot use the topic KMS key',
  KMSDisabledException: 'the topic KMS key is disabled',
  EndpointDisabledException: 'the endpoint is disabled',
  OptedOutException: 'the phone number has opted out of SMS',
  VerificationException: 'the phone number is not verified in the SMS sandbox',
  ConcurrentAccessException: 'another request is changing this resource; try again',
  StaleTagException: 'the resource is being changed by another request; try again',
};

function readStringField({ source, key }: { source: object; key: string }): string | undefined {
  const value: unknown = Reflect.get(source, key);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function mapSnsError({ operation, error }: { operation: string; error: unknown }): Error {
  if (!(error instanceof Error)) {
    return new Error(`Amazon SNS ${operation} failed: ${String(error)}`);
  }
  const name = readStringField({ source: error, key: 'name' }) ?? 'Error';
  const code = readStringField({ source: error, key: 'Code' });
  const hint = HINTS[name] ?? (code ? HINTS[code] : undefined);
  const detail = error.message === '' ? name : error.message;
  if (hint) {
    return new Error(`Amazon SNS ${operation} failed: ${hint} (${name}: ${detail})`);
  }
  if (name === 'TimeoutError' || name === 'AbortError') {
    return new Error(
      `Amazon SNS ${operation} failed: the request timed out (${detail}). A write may still have been applied.`
    );
  }
  return new Error(`Amazon SNS ${operation} failed: ${name}: ${detail}`);
}

export { mapSnsError };
