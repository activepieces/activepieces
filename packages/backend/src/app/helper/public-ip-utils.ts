import dns from "node:dns/promises";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";

const GOOGLE_DNS = "216.239.32.10";
const PUBLIC_IP_ADDRESS_QUERY = "o-o.myaddr.l.google.com";

let ipMetadata: IpMetadata | undefined;

export const getPublicIp = async (): Promise<IpMetadata> => {
  if (ipMetadata !== undefined) {
    return ipMetadata;
  }

  dns.setServers([GOOGLE_DNS]);

  const ipList = await dns.resolve(PUBLIC_IP_ADDRESS_QUERY, "TXT");

  ipMetadata = {
    ip: ipList[0][0],
  };

  return ipMetadata;
};

interface IpMetadata {
  ip: string;
}
