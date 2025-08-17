
import { Solution } from '@activepieces/shared';
import automateBlogWriting from '../../../assets/solutions/automate-blog-writing.json';
import customerSupportAutomation from '../../../assets/solutions/customer-support-automation.json';
import leadGenerationNurturing from '../../../assets/solutions/lead-generation-nurturing.json';

export type SolutionWithMetadata = Solution & { 
  greeting: string; 
  location: string; 
}; 

export const solutions: SolutionWithMetadata[] = [
  automateBlogWriting as SolutionWithMetadata,
  customerSupportAutomation as SolutionWithMetadata,
  leadGenerationNurturing as SolutionWithMetadata,
];

