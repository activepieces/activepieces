import { Entry } from './entry';

export type ClockStartRequest = {
  customers_id: number;
  services_id: number;
  projects_id?: number;
  text?: string;
  billable?: number;
};

export type ClockResponse = {
  running?: Entry | null;
  stopped?: Entry | null;
};
