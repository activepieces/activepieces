// Autocomplete suggestions for the onboarding role input. Not exhaustive and
// never enforced — the user can type anything; these just speed up the common
// cases.
const COMMON_ROLES: readonly string[] = [
  'Founder',
  'Co-founder',
  'CEO',
  'CTO',
  'COO',
  'CFO',
  'CMO',
  'CPO',
  'CRO',
  'CISO',
  'General Manager',
  'Managing Director',
  'VP of Engineering',
  'VP of Sales',
  'VP of Marketing',
  'VP of Product',
  'VP of Operations',
  'VP of Customer Success',
  'Head of Engineering',
  'Head of Sales',
  'Head of Marketing',
  'Head of Product',
  'Head of Operations',
  'Head of Growth',
  'Head of Design',
  'Head of Data',
  'Head of People',
  'Head of Customer Success',
  'Head of Finance',
  'Engineering Manager',
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full-stack Engineer',
  'DevOps Engineer',
  'Platform Engineer',
  'Site Reliability Engineer',
  'QA Engineer',
  'Data Engineer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'Product Designer',
  'UX Designer',
  'UI Designer',
  'Graphic Designer',
  'Marketing Manager',
  'Growth Marketer',
  'Content Marketer',
  'Performance Marketer',
  'SEO Specialist',
  'Social Media Manager',
  'Brand Manager',
  'Communications Manager',
  'Sales Manager',
  'Account Executive',
  'Sales Development Representative',
  'Business Development Manager',
  'Account Manager',
  'Customer Success Manager',
  'Customer Support Specialist',
  'Support Engineer',
  'Solutions Engineer',
  'Solutions Architect',
  'Operations Manager',
  'Business Operations',
  'Revenue Operations',
  'Project Manager',
  'Program Manager',
  'Scrum Master',
  'Office Manager',
  'Executive Assistant',
  'HR Manager',
  'Recruiter',
  'Talent Acquisition',
  'People Operations',
  'Finance Manager',
  'Accountant',
  'Controller',
  'Financial Analyst',
  'Legal Counsel',
  'Compliance Officer',
  'IT Manager',
  'IT Administrator',
  'Security Engineer',
  'Consultant',
  'Freelancer',
  'Agency Owner',
] as const;

// A handful of high-frequency roles shown as chips before the user types, so
// the suggestion feature is discoverable (a native datalist reads as browser
// autofill and gets ignored).
const POPULAR_ROLES: readonly string[] = [
  'Founder',
  'CEO',
  'Head of Sales',
  'Head of Marketing',
  'Product Manager',
  'Software Engineer',
];

function suggestRoles({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
}): string[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return POPULAR_ROLES.slice(0, limit);
  }
  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const role of COMMON_ROLES) {
    const haystack = role.toLowerCase();
    if (haystack === needle) {
      continue;
    }
    if (haystack.startsWith(needle)) {
      startsWith.push(role);
    } else if (haystack.includes(needle)) {
      contains.push(role);
    }
  }
  return [...startsWith, ...contains].slice(0, limit);
}

export const commonRoles = {
  suggestRoles,
};
