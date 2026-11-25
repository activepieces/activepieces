import { ApErrorParams, ErrorCode, isNil } from '@activepieces/core-utils';
import { AxiosError, AxiosResponse, HttpStatusCode, isAxiosError } from 'axios';
import { t } from 'i18next';

const GENERIC_FEATURE_DISABLED_MESSAGE = 'Feature is disabled';

const USER_FACING_AUTHORIZATION_MESSAGES = new Set([
  'Cannot update official or shared templates',
  'Cannot delete official or shared templates',
  'Only custom pieces can be deleted',
  'You can only own one platform',
  'Users cannot change their own platform role or deactivate themselves',
  'Only the platform owner can update the platform owner',
  'Platform connections must be deleted from the platform admin connections page',
  'Your role in that project cannot create or change agents there',
  'Only the person who created an agent, or a project admin, can change who sees it',
  'That conversation belongs to someone else',
]);

export function serverErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) {
    return undefined;
  }
  const data = error.response?.data as ApErrorParams | undefined;
  const message =
    data?.params && 'message' in data.params ? data.params.message : undefined;
  const isUsable = typeof message === 'string' && message.length > 0;
  return isUsable ? message : undefined;
}

export function extractServerErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError(error)) {
    return httpErrorMessage(error) ?? fallback;
  }
  return fallback;
}

function httpErrorMessage(error: AxiosError): string | undefined {
  const { response } = error;
  if (isNil(response)) {
    return t("Couldn't reach the server. Check your connection and try again.");
  }
  const code = (response.data as ApErrorParams | undefined)?.code;
  const message = serverErrorMessage(error);
  if (
    code === ErrorCode.ENTITY_NOT_FOUND ||
    response.status === HttpStatusCode.NotFound
  ) {
    return t('It no longer exists. Refresh the page and try again.');
  }
  switch (code) {
    case ErrorCode.AUTHORIZATION:
    case ErrorCode.PERMISSION_DENIED:
      return !isNil(message) && USER_FACING_AUTHORIZATION_MESSAGES.has(message)
        ? message
        : t("You don't have permission to do this.");
    case ErrorCode.FEATURE_DISABLED:
      return isNil(message) || message === GENERIC_FEATURE_DISABLED_MESSAGE
        ? t("Your plan doesn't include this feature.")
        : message;
  }
  return message ?? clientErrorMessage(response);
}

function clientErrorMessage({
  status,
  data,
}: AxiosResponse): string | undefined {
  const isClientError = status >= 400 && status < 500;
  if (
    !isClientError ||
    typeof data !== 'object' ||
    isNil(data) ||
    !('message' in data) ||
    typeof data.message !== 'string' ||
    data.message.trim().length === 0
  ) {
    return undefined;
  }
  const isSchemaValidation =
    'code' in data && data.code === 'FST_ERR_VALIDATION';
  return isSchemaValidation
    ? t("Some values aren't valid. Check them and try again.")
    : data.message.trim();
}
