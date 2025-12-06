'use server';

import sql from '@/db/index';

export async function addProblem(formData: FormData) {
  try {
    const problemName = formData.get('problemName') as string;
    const platform = formData.get('platform') as string;
    const difficulty = formData.get('difficulty') as string;
    const timeTaken = formData.get('timeTaken') as string;

    // Make fields optional - only platform and difficulty are required
    if (!platform || !difficulty) {
      return { error: 'Platform and difficulty are required' };
    }

    const result = await sql`
      INSERT INTO DSALogs (problem_name, platform, difficulty, time_taken_mins)
      VALUES (${problemName || 'Unnamed Problem'}, ${platform}, ${difficulty}, ${timeTaken ? parseInt(timeTaken) : 0})
    `;

    return { success: true };
  } catch (error) {
    console.error('Error adding problem:', error);
    return { error: 'Failed to add problem' };
  }
}