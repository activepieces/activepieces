import {
  Property,
} from '@activepieces/pieces-framework';
import {
  fetchSubscriberByEmail,
  fetchSubscribedTags,
  fetchTags,
} from '../service';
import { Tag, AuthEmail } from '../types';

export const tagId = Property.ShortText({
  displayName: 'Tag Id',
  description: 'The tag id',
  required: true,
});

export const name = Property.ShortText({
  displayName: 'Name',
  description: 'The name of the tag',
  required: true,
});

export const tags = Property.MultiSelectDropdown({
  displayName: 'Tags',
  description: 'Choose the Tags',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const tags = await fetchTags(auth.toString());
    const options = tags.map((tag: Tag) => {
      return {
        label: tag.name,
        value: tag.id,
      };
    });

    return {
      options,
    };
  },
});

export const tagsRequired = { ...tags, required: true };

export const tag = Property.Dropdown({
  displayName: 'Tag',
  description: 'Choose a Tag',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const tags = await fetchTags(auth.toString());

    // loop through data and map to options
    const options = tags.map((tag: Tag) => {
      return {
        label: tag.name,
        value: tag.id,
      };
    });

    return {
      options,
    };
  },
});

export const tagsPageNumber = Property.Number({
  displayName: 'Page',
  description: 'Each page of results will contain up to 50 tags.',
  required: false,
  defaultValue: 1,
});
export const sortOrder = Property.StaticDropdown({
  displayName: 'Sort Order',
  description: 'Sort order',
  required: false,
  options: {
    options: [
      { label: 'Ascending', value: 'asc' },
      { label: 'Descending', value: 'desc' },
    ],
  },
});
export const subscriberState = Property.StaticDropdown({
  displayName: 'Subscriber State',
  description: 'Subscriber state',
  required: false,
  options: {
    options: [
      { label: 'Active', value: 'active' },
      { label: 'canceled', value: 'canceled' },
    ],
  },
});

// Generate options for tags based on email address


export const tagIdByEmail = Property.Dropdown({
  displayName: 'Tag',
  description: 'The tag to remove',
  required: true,
  refreshers: ['auth', 'email'],
  options: async (params: unknown) => {
    const { auth, email } = params as AuthEmail;
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account.',
        options: [],
      };
    }
    if (!email) {
      return {
        disabled: true,
        placeholder: 'Provide a subscriber email address.',
        options: [],
      };
    }
    const subscriber = await fetchSubscriberByEmail(
      auth.toString(),
      email.toString()
    );

    if (!subscriber) {
      return {
        disabled: true,
        placeholder: 'No subscribers found for this email address.',
        options: [],
      };
    }

    const subscriberId = subscriber.id;
    const tags = await fetchSubscribedTags(
      auth.toString(),
      subscriberId.toString()
    );

    // loop through data and map to options
    const options = tags.map((tag: Tag) => {
      return {
        label: tag.name,
        value: tag.id,
      };
    });

    return {
      disabled: false,
      placeholder: 'Choose a tag',
      options,
    };
  },
});

export const tagIdBySubscriberId = Property.Dropdown({
  displayName: 'Tag',
  description: 'The tag to remove',
  required: true,
  refreshers: ['auth', 'subscriberId'],
  options: async ({ auth, subscriberId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account and',
        options: [],
      };
    }

    if (!subscriberId) {
      return {
        disabled: true,
        placeholder: 'Provide a subscriber id.',
        options: [],
      };
    }

    {
      const tags = await fetchSubscribedTags(
        auth.toString(),
        subscriberId.toString()
      );
      if (!tags) {
        return {
          disabled: true,
          placeholder: 'Something went wrong.',
          options: [],
        };
      }
      // loop through data and map to options
      const options = tags.map((tag: Tag) => {
        return {
          label: tag.name,
          value: tag.id,
        };
      });

      return {
        options,
      };
    }
  },
});

// WIP debounce

// // // https://github.com/lodash/lodash/issues/4700#issuecomment-805439202
// export const asyncT = function asyncThrottle<
//   F extends (...args: any[]) => Promise<any>
// >(func: F, wait?: number) {
//   const throttled = _.throttle((resolve, reject, args: Parameters<F>) => {
//     func(...args)
//       .then(resolve)
//       .catch(reject);
//   }, wait);
//   return (...args: Parameters<F>): ReturnType<F> =>
//     new Promise((resolve, reject) => {
//       throttled(resolve, reject, args);
//     }) as ReturnType<F>;
// };

// let optionsFnRef: any;

// function debouncedOptions() {

//   // cancel any old refs
//   if (optionsFnRef && optionsFnRef.cancel) optionsFnRef.cancel();

//   // create new instance and save for later
//   optionsFnRef = loadash.debounce(optiosnFn, 3000);

//   // execute will start after 1000 unless cancelled because the function is re-invoked again

//   return optionsFnRef;
// }

// import Options type
