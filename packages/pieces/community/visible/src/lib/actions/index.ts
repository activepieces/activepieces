import { createPortfolioCompany } from './create-portfolio-company';
import { createOrUpdateContact } from './create-or-update-contact';
import { createMetric } from './create-metric';
import { customApiCall } from './custom-api-call';

export const visibleActions = [
  createPortfolioCompany,
  createOrUpdateContact,
  createMetric,
  customApiCall,
];
