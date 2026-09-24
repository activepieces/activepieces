import { DropdownOption, DropdownState, Property } from '@activepieces/pieces-framework';
import { hesperanAuth } from '../auth';
import { HesperanProfile, hesperanApi } from './client';

function profileOptions(profiles: HesperanProfile[]): DropdownOption<string>[] {
  return profiles.map((p) => ({
    label: p.calibrated ? `${p.name} (${p.slug})` : `${p.name} (${p.slug}) - not calibrated yet`,
    value: p.slug,
    description: p.calibrated
      ? `Answers: ${p.options.join(', ')}`
      : 'Calibrate this profile in the Hesperan console before it can decide.',
  }));
}

function answerOptions(profile: HesperanProfile): DropdownOption<string>[] {
  return profile.options.map((key) => {
    if (profile.type === 'noul') {
      return { label: key === 'true' ? 'Yes (true)' : key === 'false' ? 'No (false)' : key, value: key };
    }
    if (profile.type === 'score') {
      return { label: `Level ${key}`, value: key };
    }
    return { label: key, value: key };
  });
}

async function loadProfiles(auth: { secret_text: string } | undefined): Promise<HesperanProfile[] | DropdownState<string>> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Hesperan account first.', options: [] };
  }
  try {
    return await hesperanApi.listProfiles({ apiKey: auth.secret_text });
  } catch (e) {
    return { disabled: true, placeholder: e instanceof Error ? e.message : 'Could not load your profiles.', options: [] };
  }
}

function profileDropdown({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    auth: hesperanAuth,
    displayName: 'Profile',
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      const profiles = await loadProfiles(auth);
      if (!Array.isArray(profiles)) {
        return profiles;
      }
      if (profiles.length === 0) {
        return {
          disabled: true,
          placeholder: 'No decision profiles yet. Create and calibrate one in the Hesperan console.',
          options: [],
        };
      }
      return { options: profileOptions(profiles) };
    },
  });
}

function answerDropdown() {
  return Property.Dropdown({
    auth: hesperanAuth,
    displayName: 'Correct Answer',
    description:
      "The answer that turned out to be right, one of the profile's answers (for a yes/no profile: true or false). Choose the profile above to list them, or map a value from an earlier step.",
    required: true,
    refreshers: ['auth', 'profile'],
    options: async ({ auth, profile }) => {
      if (typeof profile !== 'string' || profile === '') {
        return { disabled: true, placeholder: 'Choose the profile first.', options: [] };
      }
      const profiles = await loadProfiles(auth);
      if (!Array.isArray(profiles)) {
        return profiles;
      }
      const chosen = profiles.find((p) => p.slug === profile);
      if (!chosen) {
        return { disabled: true, placeholder: `No profile with the slug ${profile}.`, options: [] };
      }
      return { options: answerOptions(chosen) };
    },
  });
}

function toState({ state, sendAsJson }: { state: unknown; sendAsJson: boolean | undefined }): HesperanState {
  if (typeof state === 'object' && state !== null) {
    return state;
  }
  const text = typeof state === 'string' ? state : String(state ?? '');
  if (!sendAsJson) {
    return text;
  }
  const parsed = parseJson(text);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('State is marked as JSON but is not a JSON object or array.');
  }
  return parsed;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('State is marked as JSON but could not be parsed. Paste a JSON object or array, or untick "Send state as JSON".');
  }
}

export const hesperanProps = {
  state: () =>
    Property.LongText({
      displayName: 'State',
      description:
        'What the decision is about: the text of a ticket, email or message, or a JSON object with the relevant fields (for example {"order": {"status": "delivered"}, "message": "Still waiting!"}). Up to 256 KB.',
      required: true,
    }),
  sendAsJson: () =>
    Property.Checkbox({
      displayName: 'Send state as JSON',
      description:
        'Tick when State is a JSON object or array. Structured state keeps dates, statuses and amounts unambiguous. Leave unticked for plain text.',
      required: false,
      defaultValue: false,
    }),
  profile: profileDropdown,
  answer: answerDropdown,
  profileOptions,
  answerOptions,
  toState,
};

export type HesperanState = string | object;
