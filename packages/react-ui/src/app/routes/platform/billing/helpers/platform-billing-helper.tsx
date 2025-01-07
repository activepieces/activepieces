export const planNameFormatter = (planName: string | undefined) => {
  if (!planName) {
    return 'Free Plan';
  }
  const free = planName.startsWith('free');
  if (free) {
    return 'Free Plan';
  }

  const pro =
    planName.startsWith('pro') ||
    planName.startsWith('growth') ||
    planName.startsWith('friends');
  if (pro) {
    return 'Pro Plan';
  }

  const ltd = planName.startsWith('ltd');
  if (ltd) {
    return 'Life Time Plan';
  }

  const unlimited = planName.startsWith('unlimited');
  if (unlimited) {
    return 'Unlimited Plan';
  }

  switch (planName) {
    case 'appsumo_activepieces_tier1':
      return 'AppSumo Tier 1';
    case 'appsumo_activepieces_tier2':
      return 'AppSumo Tier 2';
    case 'appsumo_activepieces_tier3':
      return 'AppSumo Tier 3';
    case 'appsumo_activepieces_tier4':
      return 'AppSumo Tier 4';
    case 'appsumo_activepieces_tier5':
      return 'AppSumo Tier 5';
    case 'appsumo_activepieces_tier6':
      return 'AppSumo Tier 6';
  }
  return planName;
};

export const calculateTaskCostHelper = (
  flowRunCount: number,
  tasksLimit: number,
) => {
  const unitCost = 1 / 1000;
  const totalTasks = flowRunCount || 0;
  const paidTasks = Math.max(0, totalTasks - tasksLimit);
  return Number((paidTasks * unitCost).toFixed(2));
};

export const calculateAICostHelper = (aiCredits: number, aiLimit: number) => {
  const unitCost = 1 / 1000;
  const totalAiCredits = aiCredits || 0;
  const paidAiCredits = Math.max(0, totalAiCredits - aiLimit);
  return Number((paidAiCredits * unitCost).toFixed(2));
};

export const calculateTaskCostTextHelper = (
  flowRunCount: number,
  calculateTaskCost: number,
) => {
  return `${flowRunCount} Tasks ($${calculateTaskCost.toFixed(2)})`;
};

export const calculateTotalCostHelper = (
  calculateTaskCost: number,
  calculateAICost: number,
) => {
  return `$${(calculateTaskCost + calculateAICost).toFixed(2)}`;
};
