'use client';

import { useState, useTransition, useEffect } from 'react';
import { addProblem } from '@/actions/dsa';
import { addExpense, deleteExpense } from '@/actions/expenses';
import { updateAttendance } from '@/actions/attendance';
import { updateHealthTrackerEntry, updateCollegeAttendance, resetCollegeAttendance } from '@/actions/health';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContributionGraph from '@/components/dashboard/ContributionGraph';
import HabitMatrix from '@/components/HabitMatrix';
import FinanceCard from '@/components/FinanceCard';
import HabitLogger from '@/components/HabitLogger';
import StreakDisplay from '@/components/StreakDisplay';
import HabitSettings from '@/components/HabitSettings';
import { MainLayout } from '@/components/MainLayout';

interface DashboardData {
  totalSolved: number;
  currentStreak: number;
  gymStreak: number;
  totalExpense: number;
  totalDebt: number;
  attendanceSummary: {
    lowestPercentage: number;
    subjectsAtRisk: number;
  };
  collegeAttendance: {
    totalDays: number;
    presentDays: number;
  };
}

interface Problem {
  id: number;
  problem_name: string;
  platform: string;
  difficulty: string;
  time_taken_mins: number;
  date: string;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  is_debt: boolean;
  date: string;
}

interface HealthTrackerRecord {
  id?: number;
  date: string;
  attendance: string;
  mood: number;
  college_attendance?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

interface RecentTransaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  is_debt: boolean;
  date: string;
}

const attendanceOptions = ['Gym', 'Rest Day', 'Not Going to the Gym'] as const;

const moodLabels: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // DSA state
  const [dsaProblems, setDsaProblems] = useState<Problem[]>([]);
  const [dsaForm, setDsaForm] = useState({
    problemName: '',
    platform: '',
    difficulty: '',
    timeTaken: '',
  });

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
    isDebt: false,
  });

  // Health state
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendance, setAttendance] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [healthHistory, setHealthHistory] = useState<HealthTrackerRecord[]>([]);

  // College attendance state
  const [collegeAttendance, setCollegeAttendance] = useState<boolean | null>(null);

  // HabitMatrix refresh state
  const [habitMatrixRefresh, setHabitMatrixRefresh] = useState(0);

  // Messages
  const [dsaMessage, setDsaMessage] = useState<string>('');
  const [expenseMessage, setExpenseMessage] = useState<string>('');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [collegeMessage, setCollegeMessage] = useState<string>('');

  // HabitMatrix refresh callback
  const refreshHabitMatrix = () => {
    setHabitMatrixRefresh(prev => prev + 1);
  };

  useEffect(() => {
    fetchAllData();
    fetchDsaProblems();
    fetchExpenses();
    fetchRecentTransactions();
    fetchHealthData();
  }, []);

  useEffect(() => {
    fetchCurrentHealthEntry(selectedDate);
    fetchCurrentCollegeAttendance(selectedDate);
  }, [selectedDate]);

  const fetchAllData = async () => {
    try {
      const response = await fetch('/api/dashboard-stats');
      const dashboard = await response.json();
      setData(dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDsaProblems = async () => {
    try {
      const response = await fetch('/api/dsa/today');
      const data = await response.json();
      setDsaProblems(data);
    } catch (error) {
      console.error('Error fetching DSA problems:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/wallet/expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/recent-transactions');
      const transactions = await response.json();
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  const fetchCurrentHealthEntry = async (date: string) => {
    try {
      const response = await fetch(`/api/health/daily?date=${date}`);
      const data = await response.json();

      if (data) {
        setAttendance(data.attendance || '');
        setMood(data.mood ? String(data.mood) : '');
      } else {
        setAttendance('');
        setMood('');
      }
    } catch (error) {
      console.error('Error fetching health entry:', error);
    }
  };

  const fetchHealthHistory = async () => {
    try {
      const response = await fetch('/api/health/weekly');
      const data = await response.json();
      setHealthHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching health history:', error);
    }
  };

  const fetchHealthData = async () => {
    await fetchCurrentHealthEntry(selectedDate);
    await fetchHealthHistory();
  };


  const fetchCurrentCollegeAttendance = async (date: string) => {
    try {
      const response = await fetch(`/api/health/daily?date=${date}`);
      const data = await response.json();
      setCollegeAttendance(data?.college_attendance ?? null);
    } catch (error) {
      console.error('Error fetching college attendance:', error);
    }
  };

  // Quick Actions
  const handleQuickAttendance = (subjectId: number, type: 'present' | 'absent') => {
    startTransition(async () => {
      await updateAttendance(subjectId, type);
      fetchAllData();
    });
  };

  const handleDsaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(dsaForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(async () => {
      const result = await addProblem(formData);
      if (result.error) {
        setDsaMessage(result.error);
      } else {
        setDsaMessage('Problem added successfully!');
        setDsaForm({ problemName: '', platform: '', difficulty: '', timeTaken: '' });
        fetchDsaProblems();
        fetchAllData();
        refreshHabitMatrix();
      }
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(expenseForm).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    startTransition(async () => {
      const result = await addExpense(formData);
      if (result.error) {
        setExpenseMessage(result.error);
      } else {
        setExpenseMessage('Expense added successfully!');
        setExpenseForm({ amount: '', category: '', description: '', isDebt: false });
        fetchExpenses();
        fetchRecentTransactions();
        fetchAllData();
        refreshHabitMatrix();
      }
    });
  };

  const handleExpenseDelete = (expenseId: number) => {
    startTransition(async () => {
      const result = await deleteExpense(expenseId);
      if (result.error) {
        setExpenseMessage(result.error);
      } else {
        setExpenseMessage('Expense deleted successfully!');
        fetchExpenses();
        fetchRecentTransactions();
        fetchAllData();
        refreshHabitMatrix();
      }
    });
  };

  const handleHealthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('date', selectedDate);
    formData.append('attendance', attendance);
    formData.append('mood', mood);

    startTransition(async () => {
      const result = await updateHealthTrackerEntry(formData);
      if ((result as any).error) {
        setHealthMessage((result as any).error);
      } else {
        setHealthMessage('Health entry saved successfully!');
        fetchHealthData();
        fetchAllData();
        refreshHabitMatrix();
      }
    });
  };

  const handleQuickGymLog = (gymAttendance: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('date', selectedDate);
      formData.append('attendance', gymAttendance);
      formData.append('mood', mood || '3'); // Default neutral mood if not set

      const result = await updateHealthTrackerEntry(formData);
      if ((result as any).error) {
        setHealthMessage((result as any).error);
      } else {
        setHealthMessage(`Gym session logged: ${gymAttendance}!`);
        setAttendance(gymAttendance);
        fetchHealthData();
        fetchAllData();
        refreshHabitMatrix();
        // Clear message after 3 seconds
        setTimeout(() => setHealthMessage(''), 3000);
      }
    });
  };

  const handleCollegeAttendanceToggle = (attended: boolean) => {
    startTransition(async () => {
      const result = await updateCollegeAttendance(selectedDate, attended);
      if (result.error) {
        setCollegeMessage(result.error);
      } else {
        setCollegeMessage(`College attendance marked as ${attended ? 'present' : 'absent'}!`);
        setCollegeAttendance(attended);
        fetchAllData();
        refreshHabitMatrix();
        // Clear message after 3 seconds
        setTimeout(() => setCollegeMessage(''), 3000);
      }
    });
  };

  const handleCollegeReset = () => {
    if ((data?.collegeAttendance?.presentDays || 0) < 30) return;

    startTransition(async () => {
      const result = await resetCollegeAttendance();
      if (result.error) {
        setCollegeMessage(result.error);
      } else {
        setCollegeMessage('College attendance counter reset to 0!');
        fetchAllData();
        refreshHabitMatrix();
        // Clear message after 3 seconds
        setTimeout(() => setCollegeMessage(''), 3000);
      }
    });
  };

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="min-h-screen bg-zinc-950 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-zinc-800 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              DevLife Dashboard
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">{getGreeting()}! Ready to grind? 🚀</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => window.location.href = '/progress'}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white flex-1 sm:flex-none"
            >
              📊 Analytics
            </Button>
          </div>
        </div>

        {/* Streak Display */}
        <StreakDisplay />

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Row 1: Quick Stats */}
          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl shadow-lg shadow-emerald-500/10 col-span-1">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-emerald-400">{data?.totalSolved || 0}</div>
              <div className="text-zinc-400 text-sm">Total DSA</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-rose-500/20 rounded-xl shadow-lg shadow-rose-500/10 col-span-1">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-rose-400">₹{(data?.totalDebt || 0).toFixed(0)}</div>
              <div className="text-zinc-400 text-sm">Total Udhaar</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-green-500/20 rounded-xl shadow-lg shadow-green-500/10 col-span-1">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-400">₹{(data?.totalExpense || 0).toFixed(0)}</div>
              <div className="text-zinc-400 text-sm">Total Expense</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl shadow-lg shadow-blue-500/10 col-span-1">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-400">{data?.collegeAttendance?.presentDays || 0}</div>
              <div className="text-zinc-400 text-sm">College Present</div>
            </CardContent>
          </Card>

          {/* Row 2: The Big Visuals */}
          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl col-span-1 sm:col-span-2 lg:col-span-3">
            <CardHeader className="border-b border-zinc-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-emerald-400">📊</span>
                The Grind (Last 365 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ContributionGraph />
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl col-span-1">
            <CardHeader className="border-b border-zinc-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-indigo-400">📅</span>
                Habit Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <HabitMatrix onRefresh={refreshHabitMatrix} key={habitMatrixRefresh} />
            </CardContent>
          </Card>

          {/* Row 3: Finance & Activity */}
          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl col-span-1 sm:col-span-2 lg:col-span-2">
            <CardHeader className="border-b border-zinc-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-rose-400">💰</span>
                Finance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <FinanceCard />
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl col-span-1 sm:col-span-2 lg:col-span-2">
            <CardHeader className="border-b border-zinc-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-blue-400">📝</span>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Recent DSA Problems */}
                {dsaProblems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <span className="text-emerald-400">🧠</span>
                      Recent DSA Problems
                    </h4>
                    <div className="space-y-2">
                      {dsaProblems.slice(0, 3).map((problem) => (
                        <div key={problem.id} className="flex items-center justify-between p-3 sm:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/70 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{problem.problem_name}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                              <span>{problem.platform}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                problem.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400' :
                                problem.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                                'bg-red-900/50 text-red-400'
                              }`}>
                                {problem.difficulty}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              problem.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {problem.difficulty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {recentTransactions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                      <span className="text-rose-400">💰</span>
                      Recent Transactions
                    </h4>
                    <div className="space-y-2">
                      {recentTransactions.slice(0, 2).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/70 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">₹{transaction.amount.toFixed(2)}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                              <span>{transaction.category}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                transaction.is_debt ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                              }`}>
                                {transaction.is_debt ? 'Udhaar' : 'Expense'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.is_debt ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                            }`}>
                              {transaction.is_debt ? 'Udhaar' : 'Expense'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dsaProblems.length === 0 && recentTransactions.length === 0 && (
                  <div className="text-center text-zinc-500 py-8 sm:py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <div className="text-sm sm:text-base">No recent activity</div>
                    <div className="text-xs text-zinc-600 mt-2">Start tracking your progress!</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habit Logger Section */}
        {/* <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl">
          <CardHeader className="border-b border-zinc-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-orange-400">📝</span>
              Log Today's Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <HabitLogger onHabitLogged={() => {
              fetchAllData(); // Refresh dashboard data
              // Could also refresh ContributionGraph if needed
            }} />
          </CardContent>
        </Card> */}

        {/* Quick Actions Section */}
        <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl">
          <CardHeader className="border-b border-zinc-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-purple-400">⚡</span>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              {/* DSA Quick Add */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-400">Add DSA Problem</h3>
                <form onSubmit={handleDsaSubmit} className="space-y-3">
                  <Input
                    placeholder="Problem name"
                    value={dsaForm.problemName}
                    onChange={(e) => setDsaForm(prev => ({ ...prev, problemName: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={dsaForm.platform} onValueChange={(value) => setDsaForm(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LeetCode">LeetCode</SelectItem>
                        <SelectItem value="GFG">GFG</SelectItem>
                        <SelectItem value="CodeChef">CodeChef</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dsaForm.difficulty} onValueChange={(value) => setDsaForm(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Add Problem
                  </Button>
                </form>
                {dsaMessage && (
                  <div className={`text-sm ${dsaMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {dsaMessage}
                  </div>
                )}
              </div>

              {/* Expense Quick Add */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-rose-400">Add Expense</h3>
                <form onSubmit={handleExpenseSubmit} className="space-y-3">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount (₹)"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">🍕 Food</SelectItem>
                      <SelectItem value="Travel">🚌 Travel</SelectItem>
                      <SelectItem value="Recharge">📱 Recharge</SelectItem>
                      <SelectItem value="Books">📚 Books</SelectItem>
                      <SelectItem value="Other">📝 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDebt"
                      checked={expenseForm.isDebt}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, isDebt: e.target.checked }))}
                      className="h-4 w-4 text-rose-600"
                    />
                    <label htmlFor="isDebt" className="text-sm text-zinc-300">
                      Udhaar (Debt)
                    </label>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className={`w-full ${expenseForm.isDebt ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                  >
                    Add {expenseForm.isDebt ? 'Debt' : 'Expense'}
                  </Button>
                </form>
                {expenseMessage && (
                  <div className={`text-sm ${expenseMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {expenseMessage}
                  </div>
                )}
              </div>

              {/* Gym Quick Log */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-400">Gym Session</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleQuickGymLog('Gym')}
                      disabled={isPending}
                      className={`${attendance === 'Gym' ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    >
                      💪 Gym Day
                    </Button>
                    <Button
                      onClick={() => handleQuickGymLog('Rest Day')}
                      disabled={isPending}
                      className={`${attendance === 'Rest Day' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    >
                      😴 Rest Day
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleQuickGymLog('Not Going to the Gym')}
                    disabled={isPending}
                    className={`w-full ${attendance === 'Not Going to the Gym' ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                  >
                    🚫 Skip Today
                  </Button>
                </div>
                {healthMessage && healthMessage.includes('Gym') && (
                  <div className={`text-sm ${healthMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {healthMessage}
                  </div>
                )}
              </div>

              {/* College Attendance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400">College Attendance</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleCollegeAttendanceToggle(true)}
                      disabled={isPending}
                      className={`${collegeAttendance === true ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    >
                      ✅ Present
                    </Button>
                    <Button
                      onClick={() => handleCollegeAttendanceToggle(false)}
                      disabled={isPending}
                      className={`${collegeAttendance === false ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    >
                      ❌ Absent
                    </Button>
                  </div>
                  {(data?.collegeAttendance?.presentDays || 0) >= 30 && (
                    <Button
                      onClick={handleCollegeReset}
                      disabled={isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      🔄 Reset Counter (30+ days)
                    </Button>
                  )}
                </div>
                {collegeMessage && (
                  <div className={`text-sm ${collegeMessage.includes('success') || collegeMessage.includes('marked') || collegeMessage.includes('reset') ? 'text-green-400' : 'text-red-400'}`}>
                    {collegeMessage}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl">
          <CardHeader className="border-b border-zinc-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-indigo-400">⚙️</span>
              Habit Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <HabitSettings />
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}
