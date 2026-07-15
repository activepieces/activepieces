import { identityHashing } from './hashing';

function buildUserData(props: UserDataProps): Record<string, unknown> {
  const user: Record<string, unknown> = {
    email: identityHashing.email(props.email),
    phone_number: identityHashing.phone(props.phone),
    external_id: identityHashing.externalId(props.external_id),
    ip_address: passthrough(props.ip_address),
    idfa: identityHashing.idfa(props.idfa),
    aaid: identityHashing.aaid(props.aaid),
    user_agent: passthrough(props.user_agent),
    uuid: passthrough(props.uuid),
    data_processing_options: buildDataProcessingOptions(props),
    screen_dimensions: buildScreenDimensions(props),
  };
  return compact(user);
}

function buildDataProcessingOptions(
  props: DataProcessingProps
): Record<string, unknown> | undefined {
  if (!props.limited_data_use) {
    return undefined;
  }
  if (!notBlank(props.dpo_country)) {
    throw new Error(
      'Data Processing Country is required when Limited Data Use is enabled.'
    );
  }
  return compact({
    modes: ['LDU'],
    country: props.dpo_country.trim().toUpperCase(),
    region: passthrough(props.dpo_region)?.toUpperCase(),
  });
}

function buildScreenDimensions(
  props: ScreenDimensionProps
): Record<string, unknown> | undefined {
  const dimensions = compact({
    width: props.screen_width,
    height: props.screen_height,
  });
  return Object.keys(dimensions).length > 0 ? dimensions : undefined;
}

function hasAttributionSignal(params: {
  props: AttributionSignalProps;
  user: Record<string, unknown>;
}): boolean {
  const { props, user } = params;
  return (
    notBlank(props.click_id) ||
    hasClickIdInEventSourceUrl(props) ||
    user['email'] !== undefined ||
    user['phone_number'] !== undefined ||
    user['external_id'] !== undefined ||
    user['ip_address'] !== undefined ||
    user['idfa'] !== undefined ||
    user['aaid'] !== undefined ||
    user['uuid'] !== undefined
  );
}

function hasClickIdInEventSourceUrl(props: AttributionSignalProps): boolean {
  if (
    props.action_source !== 'WEBSITE' ||
    !notBlank(props.event_source_url) ||
    !URL.canParse(props.event_source_url)
  ) {
    return false;
  }
  return notBlank(new URL(props.event_source_url).searchParams.get('rdt_cid'));
}

function passthrough(value: string | undefined): string | undefined {
  return notBlank(value) ? value.trim() : undefined;
}

function notBlank(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

type AttributionSignalProps = {
  action_source: string;
  click_id?: string;
  event_source_url?: string;
};

type DataProcessingProps = {
  limited_data_use?: boolean;
  dpo_country?: string;
  dpo_region?: string;
};

type ScreenDimensionProps = {
  screen_width?: number;
  screen_height?: number;
};

type UserDataProps = DataProcessingProps &
  ScreenDimensionProps & {
    email?: string;
    phone?: string;
    external_id?: string;
    ip_address?: string;
    idfa?: string;
    aaid?: string;
    user_agent?: string;
    uuid?: string;
  };

export const redditConversionEventUtils = {
  buildUserData,
  buildDataProcessingOptions,
  hasAttributionSignal,
};
