import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { makeAcuityRequest } from './index';
import { HttpMethod } from '@activepieces/pieces-common';

type Auth = { userId: string; apiKey: string };

export const calendarIdDropdown = Property.Dropdown({
  displayName: 'Calendar',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Acuity account',
        options: [],
      };
    }

    const { userId, apiKey } = auth as Auth;
    const calendars = await makeAcuityRequest({ userId, apiKey }, HttpMethod.GET, '/calendars');

    const options: DropdownOption<string>[] = calendars.map((calendar: any) => ({
      label: calendar.name,
      value: calendar.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const appointmentTypeIdDropdown = Property.Dropdown({
  displayName: 'Appointment Type',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Acuity account',
        options: [],
      };
    }

    const { userId, apiKey } = auth as Auth;
    const appointmentTypes = await makeAcuityRequest({ userId, apiKey }, HttpMethod.GET, '/appointment-types');

    const options: DropdownOption<string>[] = appointmentTypes.map((type: any) => ({
      label: type.name,
      value: type.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const clientFirstNameDropdown = Property.Dropdown({
  displayName: 'Current First Name',
  required: true,
  refreshers: ['queryLastName', 'queryEmail', 'queryPhone'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Acuity account',
        options: [],
      };
    }

    const { userId, apiKey } = auth as Auth;
    const clients = await makeAcuityRequest({ userId, apiKey }, HttpMethod.GET, '/clients');

    const options: DropdownOption<string>[] = clients.map((client: any) => ({
      label: `${client.firstName} ${client.lastName} (${client.email || ''}, ${client.phone || ''})`,
      value: client.firstName,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const clientLastNameDropdown = Property.Dropdown({
  displayName: 'Current Last Name',
  required: true,
  refreshers: ['queryFirstName', 'queryEmail', 'queryPhone'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Acuity account',
        options: [],
      };
    }

    const { userId, apiKey } = auth as Auth;
    const clients = await makeAcuityRequest({ userId, apiKey }, HttpMethod.GET, '/clients');

    const options: DropdownOption<string>[] = clients.map((client: any) => ({
      label: `${client.lastName} ${client.firstName} (${client.email || ''}, ${client.phone || ''})`,
      value: client.lastName,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const clientPhoneDropdown = Property.Dropdown({
  displayName: 'Current Phone',
  required: false,
  refreshers: ['queryFirstName', 'queryLastName', 'queryEmail'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Acuity account',
        options: [],
      };
    }

    const { userId, apiKey } = auth as Auth;
    const clients = await makeAcuityRequest({ userId, apiKey }, HttpMethod.GET, '/clients');

    const options: DropdownOption<string>[] = clients.map((client: any) => ({
      label: `${client.phone} (${client.firstName} ${client.lastName}, ${client.email || ''})`,
      value: client.phone,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
