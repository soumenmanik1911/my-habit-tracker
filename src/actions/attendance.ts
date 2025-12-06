'use server';

import sql from '@/db/index';

export async function updateAttendance(subjectId: number, type: 'present' | 'absent') {
  try {
    if (!subjectId) {
      return { error: 'Subject ID is required' };
    }

    if (type !== 'present' && type !== 'absent') {
      return { error: 'Type must be either "present" or "absent"' };
    }

    // First, get the current attendance record
    const currentRecord = await sql`
      SELECT total_classes, attended_classes FROM Attendance WHERE id = ${subjectId}
    `;

    if (currentRecord.length === 0) {
      return { error: 'Subject not found' };
    }

    const { total_classes, attended_classes } = currentRecord[0];
    let newAttendedClasses = attended_classes;

    if (type === 'present') {
      newAttendedClasses = attended_classes + 1;
    } else if (type === 'absent') {
      // Ensure we don't go below 0
      newAttendedClasses = Math.max(0, attended_classes - 1);
    }

    // Update the attendance record
    await sql`
      UPDATE Attendance 
      SET 
        total_classes = ${total_classes + 1},
        attended_classes = ${newAttendedClasses},
        last_updated = CURRENT_TIMESTAMP
      WHERE id = ${subjectId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating attendance:', error);
    return { error: 'Failed to update attendance' };
  }
}

export async function addNewSubject(subjectName: string) {
  try {
    if (!subjectName || subjectName.trim() === '') {
      return { error: 'Subject name is required' };
    }

    await sql`
      INSERT INTO Attendance (subject_name, total_classes, attended_classes)
      VALUES (${subjectName.trim()}, 0, 0)
    `;

    return { success: true };
  } catch (error) {
    console.error('Error adding new subject:', error);
    return { error: 'Failed to add new subject' };
  }
}