import { Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from './auth';
import { apiErrorStatus, SystemeContact, systemeIoCommon } from './client';

type Option<T> = { label: string; value: T };
type OptionsState<T> = { disabled: boolean; placeholder?: string; options: Option<T>[] };

const CONNECT_FIRST = 'Please connect your account first';

function errorPlaceholder({ what, error }: { what: string; error: unknown }): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not load ${what}: ${message.slice(0, 120)}`;
}

function fieldValue({ contact, slug }: { contact: SystemeContact; slug: string }): string | undefined {
  const field = contact.fields?.find((f) => f.slug === slug);
  return typeof field?.value === 'string' && field.value.trim() !== '' ? field.value.trim() : undefined;
}

export function contactLabel(contact: SystemeContact): string {
  const name = [fieldValue({ contact, slug: 'first_name' }), fieldValue({ contact, slug: 'surname' }) ?? fieldValue({ contact, slug: 'last_name' })]
    .filter((p) => p !== undefined)
    .join(' ');
  return name ? `${name} (${contact.email})` : contact.email;
}

export async function contactDropdownOptions({
  apiKey,
  searchValue,
  label = contactLabel,
}: {
  apiKey: string;
  searchValue?: string;
  label?: (contact: SystemeContact) => string;
}): Promise<OptionsState<number>> {
  try {
    const search = searchValue?.trim() ?? '';
    const found = await searchContacts({ apiKey, search, label });
    if (found.contacts.length === 0) {
      return {
        disabled: false,
        placeholder: noMatchHint({ search, nameSearch: found.nameSearch }),
        options: [],
      };
    }
    return {
      disabled: false,
      placeholder: found.hint,
      options: found.contacts.map((contact) => ({ label: label(contact), value: contact.id })),
    };
  } catch (error) {
    return { disabled: true, placeholder: errorPlaceholder({ what: 'contacts', error }), options: [] };
  }
}

async function searchContacts({
  apiKey,
  search,
  label,
}: {
  apiKey: string;
  search: string;
  label: (contact: SystemeContact) => string;
}): Promise<{ contacts: SystemeContact[]; hint?: string; nameSearch?: boolean }> {
  if (FULL_EMAIL.test(search)) {
    const contacts = await systemeIoCommon.findContactsByEmail({ auth: apiKey, email: search }).catch((error: unknown) => {
      if (apiErrorStatus(error) === 422) {
        return [];
      }
      throw error;
    });
    return { contacts };
  }
  if (/^\d+$/.test(search)) {
    const id = Number(search);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return { contacts: [] };
    }
    const contacts = await systemeIoCommon.getContact({ auth: apiKey, contactId: id }).then(
      (contact) => [contact],
      (error: unknown) => {
        if (apiErrorStatus(error) === 404) {
          return [];
        }
        throw error;
      },
    );
    return { contacts };
  }
  const page = await systemeIoCommon.paginate<SystemeContact>({ auth: apiKey, url: '/contacts', maxItems: 100 });
  if (search === '') {
    return {
      contacts: page.items,
      hint: page.hasMore ? 'Showing the newest 100 contacts. Type a full email address or a contact id to find others.' : undefined,
    };
  }
  const needle = search.toLowerCase();
  const contacts = page.items.filter(
    (contact) => label(contact).toLowerCase().includes(needle) || (contact.email ?? '').toLowerCase().includes(needle),
  );
  return {
    contacts,
    nameSearch: true,
    hint: page.hasMore && contacts.length > 0 ? 'Name search covers the newest 100 contacts. Type a full email address or a contact id to find others.' : undefined,
  };
}

function noMatchHint({ search, nameSearch }: { search: string; nameSearch?: boolean }): string {
  if (search === '') {
    return 'No contacts found';
  }
  if (nameSearch) {
    return `No match for "${search}" among the newest 100 contacts. Type the full email address or a contact id.`;
  }
  return `No contact matches "${search}". Type the full email address or a contact id.`;
}

const FULL_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function tagDropdownOptions({ apiKey, searchValue }: { apiKey: string; searchValue?: string }): Promise<OptionsState<number>> {
  try {
    const search = searchValue?.trim() || undefined;
    const { items, hasMore } = await systemeIoCommon.getTags({ auth: apiKey, query: search, maxItems: search ? SEARCH_PAGE : 1000 });
    return {
      disabled: false,
      placeholder: items.length === 0 ? 'No tags found' : truncatedHint({ hasMore, what: 'tags', searched: search !== undefined }),
      options: items.map((tag) => ({ label: tag.name, value: tag.id })),
    };
  } catch (error) {
    return { disabled: true, placeholder: errorPlaceholder({ what: 'tags', error }), options: [] };
  }
}

const CONTACT_DESCRIPTION =
  'Pick a contact: type a name (searches the newest 100), a full email address or a contact id, or map a contact id. Agents can pass the numeric contact id directly.';

export function contactPicker<R extends boolean>({
  required,
  displayName = 'Contact',
  description = CONTACT_DESCRIPTION,
}: {
  required: R;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: systemeIoAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) => {
      if (!auth) {
        return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
      }
      return contactDropdownOptions({ apiKey: auth.secret_text, searchValue: ctx?.searchValue });
    },
  });
}

export function tagPicker<R extends boolean>({
  required,
  displayName = 'Tag',
  description = 'Pick a tag (type to search), or map a tag id. Agents can pass the numeric tag id directly.',
}: {
  required: R;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: systemeIoAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) => {
      if (!auth) {
        return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
      }
      return tagDropdownOptions({ apiKey: auth.secret_text, searchValue: ctx?.searchValue });
    },
  });
}

type Course = { id: number; name: string; active?: boolean };

export const courseDropdown = Property.Dropdown({
  auth: systemeIoAuth,
  displayName: 'Course',
  description: 'Pick a course (type to search), or map a course id. Agents can pass the numeric course id directly.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, ctx) => {
    if (!auth) {
      return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
    }
    try {
      const search = ctx?.searchValue?.trim() || undefined;
      const { items, hasMore } = await systemeIoCommon.paginate<Course>({
        auth: auth.secret_text,
        url: '/school/courses',
        query: { query: search },
        maxItems: search ? SEARCH_PAGE : 1000,
      });
      return {
        disabled: false,
        placeholder: items.length === 0 ? 'No courses found' : truncatedHint({ hasMore, what: 'courses', searched: search !== undefined }),
        options: items.map((course) => ({
          label: course.active === false ? `${course.name} (inactive)` : course.name,
          value: course.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: errorPlaceholder({ what: 'courses', error }), options: [] };
    }
  },
});

type Community = { id: number; name: string };

export const communityDropdown = Property.Dropdown({
  auth: systemeIoAuth,
  displayName: 'Community',
  description: 'Pick a community (type to search), or map a community id. Agents can pass the numeric community id directly.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, ctx) => {
    if (!auth) {
      return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
    }
    try {
      const search = ctx?.searchValue?.trim() || undefined;
      const { items, hasMore } = await systemeIoCommon.paginate<Community>({
        auth: auth.secret_text,
        url: '/community/communities',
        query: { query: search },
        maxItems: search ? SEARCH_PAGE : 1000,
      });
      return {
        disabled: false,
        placeholder: items.length === 0 ? 'No communities found' : truncatedHint({ hasMore, what: 'communities', searched: search !== undefined }),
        options: items.map((community) => ({ label: community.name, value: community.id })),
      };
    } catch (error) {
      return { disabled: true, placeholder: errorPlaceholder({ what: 'communities', error }), options: [] };
    }
  },
});

type CourseModule = { id: number; name: string; position?: number };

export const courseModulesDropdown = Property.MultiSelectDropdown({
  auth: systemeIoAuth,
  displayName: 'Modules',
  description:
    'Required for "Partial access" and "Partial dripping access": the modules the contact can open. Ignored for full access and dripping content. Agents can pass module ids.',
  required: false,
  refreshers: ['course_id', 'access_type'],
  options: async ({ auth, course_id, access_type }) => {
    if (!auth) {
      return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
    }
    if (access_type !== 'partial_access' && access_type !== 'partial_dripping_access') {
      return { disabled: true, placeholder: 'Only needed for partial access', options: [] };
    }
    const courseId = Number(course_id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return { disabled: true, placeholder: 'Please select a course first', options: [] };
    }
    try {
      const { items, hasMore } = await systemeIoCommon.paginate<CourseModule>({
        auth: auth.secret_text,
        url: '/school/course-modules',
        query: { courseId },
        maxItems: 1000,
      });
      return {
        disabled: false,
        placeholder: items.length === 0 ? 'This course has no modules' : truncatedHint({ hasMore, what: 'modules', searchable: false }),
        options: items.map((module) => ({ label: module.name, value: module.id })),
      };
    } catch (error) {
      return { disabled: true, placeholder: errorPlaceholder({ what: 'modules', error }), options: [] };
    }
  },
});

type Subscription = {
  id: number;
  status: string;
  pricePlan?: { name?: string; amount?: number; currency?: string } | null;
};

export const subscriptionDropdown = Property.Dropdown({
  auth: systemeIoAuth,
  displayName: 'Subscription',
  description: 'Pick one of the contact\'s subscriptions, or map a subscription id. Agents can pass the numeric subscription id directly.',
  required: true,
  refreshers: ['contact_id'],
  options: async ({ auth, contact_id }) => {
    if (!auth) {
      return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
    }
    const contactId = Number(contact_id);
    if (!Number.isInteger(contactId) || contactId <= 0) {
      return { disabled: true, placeholder: 'Please select a contact first', options: [] };
    }
    try {
      const { items, hasMore } = await systemeIoCommon.paginate<Subscription>({
        auth: auth.secret_text,
        url: '/payment/subscriptions',
        query: { contact: contactId },
        maxItems: 1000,
      });
      return {
        disabled: false,
        placeholder: items.length === 0 ? 'This contact has no subscriptions' : truncatedHint({ hasMore, what: 'subscriptions', searchable: false }),
        options: items.map((sub) => ({
          label: `${sub.pricePlan?.name ?? `Subscription ${sub.id}`} (${sub.status})`,
          value: sub.id,
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: errorPlaceholder({ what: 'subscriptions', error }), options: [] };
    }
  },
});

export const accessTypeDropdown = Property.StaticDropdown({
  displayName: 'Access Type',
  description:
    "What the contact can open. 'full_access' = the whole course; 'partial_access' = only the selected modules; 'dripping_content' = lectures unlock on the course's drip schedule; 'partial_dripping_access' = selected modules on the drip schedule.",
  required: true,
  defaultValue: 'full_access',
  options: {
    disabled: false,
    options: [
      { label: 'Full access', value: 'full_access' },
      { label: 'Partial access (selected modules)', value: 'partial_access' },
      { label: 'Dripping content', value: 'dripping_content' },
      { label: 'Partial dripping access (selected modules)', value: 'partial_dripping_access' },
    ],
  },
});

const CONTACT_LOCALES = [
  'en', 'fr', 'es', 'it', 'pt', 'de', 'nl', 'ru', 'jp', 'tr', 'ar', 'zh', 'sv', 'ro',
  'cs', 'hu', 'sk', 'dk', 'id', 'pl', 'el', 'sr', 'hi', 'no', 'th', 'sq', 'sl', 'ua',
];

export const contactLocaleOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'German', value: 'de' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'jp' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Czech', value: 'cs' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Danish', value: 'dk' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Polish', value: 'pl' },
  { label: 'Greek', value: 'el' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Thai', value: 'th' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Ukrainian', value: 'ua' },
];

export function optionalLocale(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const locale = String(value).trim();
  if (!CONTACT_LOCALES.includes(locale)) {
    throw new Error(`Locale must be one of: ${CONTACT_LOCALES.join(', ')}. Note Systeme.io uses 'jp' (Japanese), 'dk' (Danish) and 'ua' (Ukrainian).`);
  }
  return locale;
}


export async function systemeIoAuthTagOptions({
  apiKey,
  searchValue,
}: {
  apiKey: string | undefined;
  searchValue?: string;
}): Promise<OptionsState<number>> {
  if (!apiKey) {
    return { disabled: true, placeholder: CONNECT_FIRST, options: [] };
  }
  return tagDropdownOptions({ apiKey, searchValue });
}

function truncatedHint({
  hasMore,
  what,
  searchable = true,
  searched = false,
}: {
  hasMore: boolean;
  what: string;
  searchable?: boolean;
  searched?: boolean;
}): string | undefined {
  if (!hasMore) {
    return undefined;
  }
  if (searched) {
    return `Showing the first ${SEARCH_PAGE} matching ${what}. Type more to narrow the search.`;
  }
  return `Showing the first 1,000 ${what}. ${searchable ? 'Type to search, or map an id.' : 'Map an id for the others.'}`;
}

const SEARCH_PAGE = 100;
