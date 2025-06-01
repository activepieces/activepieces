export const calculateTotalCost = (
  tasksUsed: number,
  tasksLimit: number,
): string => {
  const unitCost = 1 / 1000;
  const totalTasks = tasksUsed || 0;
  const excessTasks = Math.max(0, totalTasks - tasksLimit);
  const cost = excessTasks * unitCost;

  return `$${cost.toFixed(2)}`;
};
