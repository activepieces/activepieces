import { useNavigate, useSearchParams } from 'react-router-dom';

import { useEmbedding } from '../components/embed-provider';

export const useNewWindow = () => {
  const { embedState } = useEmbedding();
  const navigate = useNavigate();
  if (embedState.isEmbedded) {
    return (route: string, searchParams?: string) =>
      navigate({
        pathname: route,
        search: searchParams,
      });
  } else {
    return (route: string, searchParams?: string) =>
      window.open(
        `${route}${searchParams ? '?' + searchParams : ''}`,
        '_blank',
        'noopener noreferrer',
      );
  }
};

export const FROM_QUERY_PARAM = 'from';
export const DEFAULT_REDIRECT_PATH = '/flows';
/**State param is for oauth2 flow, it is used to redirect to the page after login*/
export const STATE_QUERY_PARAM = 'state';
export const LOGIN_QUERY_PARAM = 'activepiecesLogin';
export const PROVIDER_NAME_QUERY_PARAM = 'providerName';
export const useRedirectAfterLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get(FROM_QUERY_PARAM) ?? DEFAULT_REDIRECT_PATH;
  return () => navigate(from);
};
