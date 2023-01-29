import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { Contact, HubSpotContactsCreateOrUpdateResponse, HubSpotRequest } from "./models";

const API = 'https://api.hubapi.com/contacts/v1/contact';

export const hubSpotClient = {
  contacts: {
    async createOrUpdate({token, email, contact}: ContactsCreateOrUpdateParams): Promise<HubSpotContactsCreateOrUpdateResponse> {
      const properties = Object.entries(contact).map(([property, value]) => ({
        property,
        value,
      }));

      const request: HttpRequest<HubSpotRequest> = {
        method: HttpMethod.POST,
        url: `${API}/createOrUpdate/email/${email}`,
        body: {
          properties,
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest<HubSpotContactsCreateOrUpdateResponse>(request);

      return response.body;
    },
  },
};

type ContactsCreateOrUpdateParams = {
  token: string;
  email: string;
  contact: Partial<Contact>;
};
