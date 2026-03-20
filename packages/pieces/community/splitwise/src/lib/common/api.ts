export const splitwiseApi = {
  getCategories: async (auth: string) => {
    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.categories || [];
  },

  getGroups: async (auth: string) => {
    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_groups', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.groups || [];
  },

  getExpenses: async (auth: string, groupId?: number, updatedAfter?: string) => {
    const params = new URLSearchParams();
    if (groupId) params.append('group_id', groupId.toString());
    if (updatedAfter) params.append('updated_after', updatedAfter);
    params.append('limit', '100'); // Get more expenses to avoid missing any

    const response = await fetch(`https://secure.splitwise.com/api/v3.0/get_expenses?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.expenses || [];
  },

  createExpense: async (auth: string, expenseData: any) => {
    const response = await fetch('https://secure.splitwise.com/api/v3.0/create_expense', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create expense: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`Expense creation failed: ${JSON.stringify(data.errors)}`);
    }

    return data;
  },
};
