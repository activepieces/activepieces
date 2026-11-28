import {
  Property,
} from '@activepieces/pieces-framework';
import {
  fetchSubscriberByEmail,
  fetchSubscribedTags,
  fetchTags,
} from '../service';
import { Tag } from '../types';
import { convertkitAuth } from '../../auth';

export const tagId = Property.ShortText({
  displayName: 'Tag ID',
  description: "The tag's ID in Kit.",
  required: true,
});

export const name = Property.ShortText({
  displayName: 'Tag Name',
  placeholder: 'Customers',
  required: true,
});

export const tags = Property.MultiSelectDropdown({
  displayName: 'Tags',
  description: 'Tags to add to the subscriber.',
  required: false,
  refreshers: ['auth'],
  auth: convertkitAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    const tags = await fetchTags(auth.secret_text);
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
  required: true,
  refreshers: ['auth'],
  auth: convertkitAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    const tags = await fetchTags(auth.secret_text);

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
  description: 'Up to 50 subscriptions per page.',
  required: false,
  defaultValue: 1,
});
export const sortOrder = Property.StaticDropdown({
  displayName: 'Sort Order',
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
  description: "Active or cancelled subscriptions. Empty: Kit's default.",
  required: false,
  options: {
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
});

// Generate options for tags based on email address


export const tagIdByEmail = Property.Dropdown({
  displayName: 'Tag',
  description: 'Tags this subscriber has now.',
  required: true,
  refreshers: ['auth', 'email'],
  auth: convertkitAuth,
  options: async (params) => {
    const { auth, email } = params;
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    if (!email) {
      return {
        disabled: true,
        placeholder: "Enter the subscriber's email first",
        options: [],
      };
    }
    const subscriber = await fetchSubscriberByEmail(
      auth.secret_text,
      email.toString()
    );

    if (!subscriber) {
      return {
        disabled: true,
        placeholder: 'No subscriber with this email',
        options: [],
      };
    }

    const subscriberId = subscriber.id;
    const tags = await fetchSubscribedTags(
      auth.secret_text,
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
  description: 'Tags this subscriber has now.',
  required: true,
  auth: convertkitAuth,
  refreshers: ['auth', 'subscriberId'],
  options: async ({ auth, subscriberId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    if (!subscriberId) {
      return {
        disabled: true,
        placeholder: 'Enter the subscriber ID first',
        options: [],
      };
    }

    {
      const tags = await fetchSubscribedTags(
        auth.secret_text,
        subscriberId.toString()
      );
      if (!tags) {
        return {
          disabled: true,
          placeholder: 'Could not load tags. Check the subscriber ID.',
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
