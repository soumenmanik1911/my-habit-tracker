'use server';

import sql from '@/db/index';

export async function addExpense(formData: FormData) {
  try {
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const isDebt = formData.get('isDebt') === 'on';

    if (!amount || !category) {
      return { error: 'Amount and category are required' };
    }

    if (amount <= 0) {
      return { error: 'Amount must be positive' };
    }

    const result = await sql`
      INSERT INTO Expenses (amount, category, description, is_debt)
      VALUES (${amount}, ${category}, ${description || ''}, ${isDebt})
    `;

    return { success: true };
  } catch (error) {
    console.error('Error adding expense:', error);
    return { error: 'Failed to add expense' };
  }
}

export async function deleteExpense(expenseId: number) {
  try {
    if (!expenseId) {
      return { error: 'Expense ID is required' };
    }

    await sql`
      DELETE FROM Expenses WHERE id = ${expenseId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { error: 'Failed to delete expense' };
  }
}