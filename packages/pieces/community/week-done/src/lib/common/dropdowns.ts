import {
  DropdownOption,
  DropdownState,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weekdoneApiCall } from './client';

type WeekdoneListResponse<T> = {
  status: string;
} & T;

export async function weekdoneUsersDropdown(
  auth: OAuth2PropertyValue
): Promise<DropdownState<number>> {
  const response = await weekdoneApiCall<WeekdoneListResponse<{ users: Array<{ id: number; name: string }> }>>({
    auth,
    method: HttpMethod.GET,
    path: '/users',
  });

  const options: DropdownOption<number>[] = (response.users ?? []).map((u) => ({
    label: u.name,
    value: u.id,
  }));

  return {
    disabled: false,
    options,
  };
}

export async function weekdoneItemCommentsDropdown(
  auth: OAuth2PropertyValue,
  itemId: number
): Promise<DropdownState<number>> {
  const response = await weekdoneApiCall<
    WeekdoneListResponse<{
      comments: Array<{ id: number; comment: string; inserted?: string; user_id?: number }>;
    }>
  >({
    auth,
    method: HttpMethod.GET,
    path: `/item/${itemId}/comments`,
  });

  const options: DropdownOption<number>[] = (response.comments ?? []).map((c) => ({
    label: c.comment ? c.comment.slice(0, 80) : String(c.id),
    value: c.id,
  }));

  return {
    disabled: false,
    options,
  };
}

export async function weekdoneTeamsDropdown(
  auth: OAuth2PropertyValue
): Promise<DropdownState<number>> {
  const response = await weekdoneApiCall<WeekdoneListResponse<{ teams: Array<{ id: number; name: string }> }>>({
    auth,
    method: HttpMethod.GET,
    path: '/teams',
  });

  const options: DropdownOption<number>[] = (response.teams ?? []).map((t) => ({
    label: t.name,
    value: t.id,
  }));

  return {
    disabled: false,
    options,
  };
}

export async function weekdoneTypesDropdown(
  auth: OAuth2PropertyValue,
  teamId?: number
): Promise<DropdownState<number>> {
  const response = await weekdoneApiCall<WeekdoneListResponse<{ types: Array<{ id: number; name: string }> }>>({
    auth,
    method: HttpMethod.GET,
    path: '/types',
  });

  const options: DropdownOption<number>[] = (response.types ?? [])
    .filter((t: any) => {
      if (teamId === undefined) {
        return true;
      }
      return t.team_id === undefined || t.team_id === null || Number(t.team_id) === teamId;
    })
    .map((t) => ({
      label: t.name,
      value: t.id,
    }));

  return {
    disabled: false,
    options,
  };
}

export async function weekdoneItemsDropdown(
  auth: OAuth2PropertyValue,
  params: { userId?: string | number; teamId?: number; period?: string; typeId?: number }
): Promise<DropdownState<number>> {
  const response = await weekdoneApiCall<WeekdoneListResponse<{ items: Array<{ id: number; description: string; type_id?: number }> }>>({
    auth,
    method: HttpMethod.GET,
    path: '/items',
    query: {
      user_id: params.userId as any,
      team_id: params.teamId,
      period: params.period,
    },
  });

  const options: DropdownOption<number>[] = (response.items ?? [])
    .filter((i) => (params.typeId !== undefined ? i.type_id === params.typeId : true))
    .map((i) => ({
      label: i.description || String(i.id),
      value: i.id,
    }));

  return {
    disabled: false,
    options,
  };
}
