import {
  FlowPricingPlan,
  PlanTasksPrice,
  ProjectPlan,
  ProjectUsage,
  customPlanPrice,
  freePlanPrice,
} from '@activepieces/ee-shared';
import { Observable } from 'rxjs';

export function formatPrice(price: PlanTasksPrice): string {
  return price === freePlanPrice || price === customPlanPrice
    ? price
    : '$' + price + '/month';
}

export function openPortal(portalUrl: string) {
  window.open(portalUrl, '_blank', 'noopener noreferer');
}

export function formatNumberWithCommas(number: number): string {
  // Convert the number to a string
  const numStr = number.toString();

  // Split the string into integer and decimal parts (if any)
  const parts = numStr.split('.');

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Join the integer and decimal parts (if any)
  return parts.join('.');
}

export type loadPlansObs = Observable<{
  plans: FlowPricingPlan[];
  defaultPlan: { nickname: string };
  currentPlan: ProjectPlan;
  currentUsage: ProjectUsage & {
    daysLeftBeforeReset: number;
    hoursLeftBeforeReset: number;
  };
  customerPortalUrl: string;
}>;
