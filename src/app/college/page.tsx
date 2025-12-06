'use client';

import { useState, useTransition } from 'react';
import { updateAttendance, addNewSubject } from '@/actions/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/MainLayout';

interface Subject {
  id: number;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  last_updated: string;
}

export default function CollegePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState<string>('');

  // Fetch all subjects
  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/college/subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Calculate attendance percentage and safe classes needed
  const calculateAttendanceInfo = (attended: number, total: number) => {
    if (total === 0) return { percentage: 0, safeClasses: 0 };
    
    const percentage = (attended / total) * 100;
    const neededFor75 = Math.ceil((total * 0.75) - attended);
    const safeClasses = Math.max(0, neededFor75);
    
    return { percentage, safeClasses };
  };

  // Handle attendance marking
  const handleAttendanceMark = (subjectId: number, type: 'present' | 'absent') => {
    startTransition(async () => {
      const result = await updateAttendance(subjectId, type);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`${type === 'present' ? 'Present' : 'Absent'} marked successfully!`);
        fetchSubjects(); // Refresh the list
      }
    });
  };

  // Handle adding new subject
  const handleAddSubject = () => {
    startTransition(async () => {
      const result = await addNewSubject(newSubjectName);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Subject added successfully!');
        setNewSubjectName('');
        fetchSubjects(); // Refresh the list
      }
    });
  };

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Attendance Tracker</h1>
        <p className="text-gray-400">Track your class attendance - Keep it above 75%!</p>
      </div>

      {/* Add New Subject */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add New Subject</CardTitle>
          <CardDescription className="text-gray-400">
            Add a new subject to track attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g., Data Structures, Operating Systems"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Button
              onClick={handleAddSubject}
              disabled={isPending || !newSubjectName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Cards */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Subjects</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your attendance for each subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchSubjects}
            className="mb-4 bg-gray-700 hover:bg-gray-600"
          >
            Refresh Subjects
          </Button>

          {subjects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No subjects added yet. Add your first subject above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const { percentage, safeClasses } = calculateAttendanceInfo(
                  subject.attended_classes,
                  subject.total_classes
                );
                const isBelow75 = percentage < 75;

                return (
                  <div
                    key={subject.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {subject.subject_name}
                        </h3>
                        <div className="text-sm text-gray-400">
                          {subject.attended_classes} / {subject.total_classes} classes
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Attendance</span>
                          <span
                            className={isBelow75 ? 'text-red-400' : 'text-green-400'}
                          >
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isBelow75 ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Safe Classes Message */}
                      {isBelow75 && (
                        <div className="text-sm text-orange-400">
                          Attend next {safeClasses} class{safeClasses !== 1 ? 'es' : ''} to be safe
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleAttendanceMark(subject.id, 'present')}
                          disabled={isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-1"
                        >
                          Present
                        </Button>
                        <Button
                          onClick={() => handleAttendanceMark(subject.id, 'absent')}
                          disabled={isPending}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-1"
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {message && (
        <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {message}
        </div>
      )}
      </div>
    </MainLayout>
  );
}