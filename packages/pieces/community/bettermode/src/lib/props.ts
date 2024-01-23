import { BettermodeAuthType } from './auth';
import { listMemberSpaces, listBadges } from './api';

export async function buildMemberSpacesDropdown(auth: BettermodeAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const spaces = await listMemberSpaces(auth as BettermodeAuthType);
  const options = spaces.map((space: { name: string; id: string }) => {
    return { label: space.name, value: space.id };
  });
  return {
    options: options,
  };
}

export async function buildBadgesDropdown(auth: BettermodeAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const badges = await listBadges(auth as BettermodeAuthType);
  const options = badges.map((badge: { name: string; id: string }) => {
    return { label: badge.name, value: badge.id };
  });
  return {
    options: options,
  };
}
