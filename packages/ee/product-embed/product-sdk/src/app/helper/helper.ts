import { JwtHelperService } from '@auth0/angular-jwt';

export enum StorageName {
  TOKEN = 'ap-token',
  STYLES = 'ap-styles',
  PROJECT_ID = 'ap-project-id',
  API_URL = 'ap-api-url',
}

export function storeLocal(name: StorageName, value: unknown) {
  localStorage.setItem(name, JSON.stringify(value));
}

export function getLocal(name: StorageName) {
  const value = localStorage.getItem(name);
  if (value === null) {
    switch (name) {
      case StorageName.STYLES:
        return {
          primaryColor: '#000000',
        };
      default:
        return null;
    }
  }

  return JSON.parse(value);
}

export function tokenValid(jwtHelperService: JwtHelperService) {
  const token = getLocal(StorageName.TOKEN);
  if (jwtHelperService.decodeToken(token)) {
    if (!jwtHelperService.isTokenExpired(token)) {
      return true;
    } else {
      console.error(
        'Activepieces:token provided has expired, please use a new one'
      );
    }
  } else {
    console.error(
      `Activepieces:token or project-Id provided is invalid, please make sure you have called activepieces.init({token,projectId,host})`
    );
  }

  return false;
}

export function isEmpty(object: any) {
  return Object.keys(object).length === 0;
}

export function parametersValidator(
  parametersObject: any,
  parameters: string[]
) {
  const missingParameters: string[] = [];
  for (const parameter of parameters) {
    if (!parametersObject[parameter]) {
      missingParameters.push(parameter);
    }
  }
  if (missingParameters.length > 0) {
    throw new Error(
      'Activepieces-The following parameters are missing:'.concat(
        ' ',
        missingParameters.join(', ')
      )
    );
  }
}
export function clearLocalStorageFromOurKeys() {
  const keys = Object.keys(StorageName).map((key: string) => StorageName[key]);
  for (let i = 0; i < keys.length; ++i) {
    localStorage.removeItem(keys[i]);
  }
}

export function getApiUrl() {
  return getLocal(StorageName.API_URL);
}

export function getRedrectUrl() {
  return getLocal(StorageName.API_URL) + '/redirect';
}

export function getApiDomainUrl() {
  const localApiUrl = getLocal(StorageName.API_URL);
  if (localApiUrl === null) {
    return null;
  }
  const domain = new URL(localApiUrl);
  return domain.hostname;
}
