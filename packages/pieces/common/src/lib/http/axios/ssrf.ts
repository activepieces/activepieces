import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d+)?$|^[0-9a-fA-F:]+$/;

export function getSsrfAgents(allowList: string[] = []) {
  const allowedIPs = allowList.filter((entry) => IP_REGEX.test(entry));
  
  const httpSsrfAgent = new RequestFilteringHttpAgent({ allowIPAddressList: allowedIPs });
  const httpsSsrfAgent = new RequestFilteringHttpsAgent({ allowIPAddressList: allowedIPs });

  return { httpSsrfAgent, httpsSsrfAgent };
}
