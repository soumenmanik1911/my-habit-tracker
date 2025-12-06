'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Subject {
  id: number;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
}

/**
 * Attendance dashboard
 *
 * Shows an overview of college attendance only.
 * Gym attendance analytics have been merged into the Health Tracker
 * and are no longer displayed here.
 */
export function AttendanceDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch all attendance data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch college attendance
      const collegeResponse = await fetch('/api/college/subjects');
      const collegeData = await collegeResponse.json();
      
      setSubjects(collegeData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Calculate overall attendance statistics
  const overallCollegePercentage = subjects.length > 0
    ? subjects.reduce((sum, subject) => sum + subject.percentage, 0) / subjects.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Attendance Overview</h2>
          <p className="text-gray-400">
            Comprehensive tracking for college classes and gym sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            onClick={fetchAttendanceData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">College Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {overallCollegePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {subjects.length} subjects tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* College Attendance Details */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">College Subjects</CardTitle>
          <CardDescription className="text-gray-400">
            Individual subject attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No college subjects added yet. Visit the College page to add subjects.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const isBelow75 = subject.percentage < 75;
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
                            {subject.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isBelow75 ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Message */}
                      {isBelow75 && (
                        <div className="text-sm text-orange-400">
                          Below 75% - Focus needed!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Quick Actions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Jump to specific attendance management pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => window.location.href = '/college'}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto"
            >
              <div className="text-left">
                <div className="font-semibold">Manage College Attendance</div>
                <div className="text-sm opacity-80">Add subjects and mark class attendance</div>
              </div>
            </Button>
            <Button
              onClick={() => window.location.href = '/health'}
              className="bg-green-600 hover:bg-green-700 text-white p-4 h-auto"
            >
              <div className="text-left">
                <div className="font-semibold">Health Tracker</div>
                <div className="text-sm opacity-80">Log daily gym attendance and mood</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}