'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/MainLayout';

interface AnalyticsData {
  streakData: {
    daily: number;
    weekly: number;
    monthly: number;
    dsaStreak: number;
    gymStreak: number;
  };
  problemAnalytics: {
    totalProblems: number;
    dailyAverage: number;
    weeklyData: Array<{ date: string; count: number }>;
    difficultyBreakdown: Array<{ difficulty: string; count: number }>;
    platformBreakdown: Array<{ platform: string; count: number }>;
  };
  attendanceData: {
    subjects: Array<{
      id: number;
      subject_name: string;
      attended_classes: number;
      total_classes: number;
      percentage: number;
      streak: number;
    }>;
    weeklyAttendance: Array<{ date: string; present: boolean }>;
  };
  healthMetrics: {
    averageSleep: number;
    averageMood: number;
    gymDays: number;
    weeklyTrends: Array<{ date: string; sleep?: number; mood?: number; gym: boolean }>;
  };
}

export default function ProgressPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-zinc-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="text-center py-12">
          <p className="text-zinc-400">Unable to load analytics data</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress Analytics</h1>
            <p className="text-gray-600">Comprehensive tracking of your productivity journey</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Streak Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.streakData?.daily || 0}</div>
              <div className="text-sm text-gray-600">Daily Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.streakData?.weekly || 0}</div>
              <div className="text-sm text-gray-600">Weekly Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.streakData?.monthly || 0}</div>
              <div className="text-sm text-gray-600">Monthly Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.streakData?.dsaStreak || 0}</div>
              <div className="text-sm text-gray-600">DSA Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.streakData?.gymStreak || 0}</div>
              <div className="text-sm text-gray-600">Gym Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'dsa', label: 'DSA Analytics' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'health', label: 'Health Metrics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DSA Summary */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">DSA Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Problems:</span>
                  <span className="font-semibold">{analytics.problemAnalytics?.totalProblems || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-semibold">{analytics.problemAnalytics?.dailyAverage || 0}</span>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Difficulty Breakdown</div>
                  {analytics.problemAnalytics?.difficultyBreakdown?.map((item) => (
                    <div key={item.difficulty} className="flex justify-between text-sm">
                      <span>{item.difficulty}:</span>
                      <span>{item.count}</span>
                    </div>
                  )) || <div className="text-sm text-gray-500">No data available</div>}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.attendanceData?.subjects?.map((subject) => (
                  <div key={subject.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{subject.subject_name}</div>
                      <div className="text-sm text-gray-600">{subject.percentage?.toFixed(1) || 0}%</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      (subject.percentage || 0) >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {subject.streak || 0} days
                    </div>
                  </div>
                )) || <div className="text-sm text-gray-500">No subjects available</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'dsa' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem Trends */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Problem Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.problemAnalytics?.weeklyData?.map((day) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min((day.count / 5) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-6">{day.count}</span>
                      </div>
                    </div>
                  )) || <div className="text-sm text-gray-500">No problem data available</div>}
                </div>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.problemAnalytics?.platformBreakdown?.map((platform) => (
                  <div key={platform.platform} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{platform.platform}</span>
                      <span>{platform.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(platform.count / (analytics.problemAnalytics?.totalProblems || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )) || <div className="text-sm text-gray-500">No platform data available</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'attendance' && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Subject-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.attendanceData?.subjects?.map((subject) => {
                  const isAtRisk = (subject.percentage || 0) < 75;
                  return (
                    <div key={subject.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{subject.subject_name}</h3>
                        <div className={`px-2 py-1 rounded text-xs ${
                          isAtRisk ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {subject.percentage?.toFixed(1) || 0}%
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {subject.attended_classes || 0}/{subject.total_classes || 0} classes
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isAtRisk ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(subject.percentage || 0, 100)}%` }}
                        />
                      </div>
                      {isAtRisk && (
                        <div className="text-xs text-red-600 mt-2">
                          Need {(Math.ceil((subject.total_classes || 0) * 0.75) - (subject.attended_classes || 0))} more to reach 75%
                        </div>
                      )}
                    </div>
                  );
                }) || <div className="text-sm text-gray-500">No attendance data available</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Summary */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Health Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Sleep:</span>
                  <span className="font-semibold">{analytics.healthMetrics?.averageSleep?.toFixed(1) || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Mood:</span>
                  <span className="font-semibold">{analytics.healthMetrics?.averageMood?.toFixed(1) || 0}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gym Days:</span>
                  <span className="font-semibold">{analytics.healthMetrics?.gymDays || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Health Trends */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.healthMetrics?.weeklyTrends?.map((day) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4 text-sm">
                        {day.sleep && <span>😴 {day.sleep}h</span>}
                        {day.mood && <span>😊 {day.mood}/5</span>}
                        {day.gym && <span>💪</span>}
                      </div>
                    </div>
                  )) || <div className="text-sm text-gray-500">No health data available</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  );
}