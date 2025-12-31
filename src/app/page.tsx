'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addProblem } from '@/actions/dsa';
import { addExpense, deleteExpense } from '@/actions/expenses';
import { updateAttendance } from '@/actions/attendance';
import { updateHealthTrackerEntry, updateCollegeAttendance, resetCollegeAttendance } from '@/actions/health';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FinanceCard from '@/components/FinanceCard';
import HabitLogger from '@/components/HabitLogger';
import ProblemTypeOverview from '@/components/ProblemTypeOverview';
import StreakDisplay from '@/components/StreakDisplay';
import HabitSettings from '@/components/HabitSettings';
import SmokingTracker from '@/components/SmokingTracker';
import { MorningSyncPopup } from '@/components/MorningSyncPopup';
import { MainLayout } from '@/components/MainLayout';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';

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

// Dashboard Overview Component
const DashboardOverview = ({ data, dsaProblems, recentTransactions }: {
  data: DashboardData | null;
  dsaProblems: Problem[];
  recentTransactions: RecentTransaction[];
}) => (
  <>
    {/* Problem Type Overview */}
    <ProblemTypeOverview />

    {/* Streak Display */}
    <StreakDisplay />

    {/* Bento Grid Layout */}
    <div className="grid grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)] max-lg:flex max-lg:flex-col max-lg:gap-4">
      {/* Top Row: Quick Stats */}
      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-1 relative">
        <div className="absolute top-2 right-2 text-cyan-400">🧠</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">DSA STATUS</div>
          <div className="text-2xl font-bold text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' }}>{data?.totalSolved || 0}</div>
          <div className="text-zinc-400 text-xs">Total Solved</div>
        </CardContent>
      </Card>

      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-1 relative">
        <div className="absolute top-2 right-2 text-cyan-400">💰</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">FINANCE</div>
          <div className="text-2xl font-bold text-rose-400" style={{ filter: 'drop-shadow(0 0 8px rgba(244,63,94,0.8))' }}>₹{(data?.totalDebt || 0).toFixed(0)}</div>
          <div className="text-zinc-400 text-xs">Total Udhaar</div>
        </CardContent>
      </Card>

      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-1 relative">
        <div className="absolute top-2 right-2 text-cyan-400">💪</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">GYM STATUS</div>
          <div className="text-2xl font-bold text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.8))' }}>{data?.gymStreak || 0}</div>
          <div className="text-zinc-400 text-xs">Current Streak</div>
        </CardContent>
      </Card>

      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-1 relative">
        <div className="absolute top-2 right-2 text-cyan-400">🎓</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">COLLEGE</div>
          <div className="text-2xl font-bold text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.8))' }}>{data?.collegeAttendance?.presentDays || 0}</div>
          <div className="text-zinc-400 text-xs">Days Present</div>
        </CardContent>
      </Card>

      {/* Middle Row: Primary Widgets */}
      <div className="col-span-2 row-span-2 bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 relative">
        <div className="absolute top-2 right-2 text-cyan-400">📊</div>
        <div className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">PROBLEM DIFFICULTY</div>
          <ProblemTypeOverview />
        </div>
      </div>

      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-2 relative">
        <div className="absolute top-2 right-2 text-cyan-400">💰</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">FINANCE OVERVIEW</div>
          <FinanceCard />
        </CardContent>
      </Card>

      <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 col-span-2 relative">
        <div className="absolute top-2 right-2 text-cyan-400">📝</div>
        <CardContent className="p-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">RECENT ACTIVITY</div>
          <div className="space-y-3">
            {/* Recent DSA Problems */}
            {dsaProblems.length > 0 && (
              <div>
                <div className="space-y-1">
                  {dsaProblems.slice(0, 2).map((problem) => (
                    <div key={problem.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-zinc-700/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{problem.problem_name}</div>
                        <div className="text-xs text-zinc-400">{problem.platform}</div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        problem.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400' :
                        problem.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {problem.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
              <div>
                <div className="space-y-1">
                  {recentTransactions.slice(0, 1).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-zinc-700/30">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white">₹{transaction.amount.toFixed(2)}</div>
                        <div className="text-xs text-zinc-400">{transaction.category}</div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        transaction.is_debt ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'
                      }`}>
                        {transaction.is_debt ? 'Udhaar' : 'Expense'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dsaProblems.length === 0 && recentTransactions.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-xs">No recent activity</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Smoking Tracker */}
      <div className="col-span-4 bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 p-4 relative">
        <div className="absolute top-2 right-2 text-cyan-400">🚬</div>
        <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">SMOKING TRACKER</div>
        <SmokingTracker />
      </div>
    </div>
  </>
);

// Dashboard Actions Component
const DashboardActions = ({
  dsaForm, setDsaForm, handleDsaSubmit, dsaMessage,
  expenseForm, setExpenseForm, handleExpenseSubmit, expenseMessage,
  attendance, handleQuickGymLog, healthMessage,
  collegeAttendance, handleCollegeAttendanceToggle, collegeMessage,
  data, handleCollegeReset, isPending
}: {
  dsaForm: any;
  setDsaForm: any;
  handleDsaSubmit: any;
  dsaMessage: string;
  expenseForm: any;
  setExpenseForm: any;
  handleExpenseSubmit: any;
  expenseMessage: string;
  attendance: string;
  handleQuickGymLog: any;
  healthMessage: string;
  collegeAttendance: boolean | null;
  handleCollegeAttendanceToggle: any;
  collegeMessage: string;
  data: DashboardData | null;
  handleCollegeReset: any;
  isPending: boolean;
}) => (
  <>
    {/* Quick Actions Section */}
    <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl">
      <CardHeader className="border-b border-zinc-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-purple-400">⚡</span>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* DSA Quick Add */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-400">Add DSA Problem</h3>
            <form onSubmit={handleDsaSubmit} className="space-y-3">
              <Input
                name="problemName"
                placeholder="Problem name"
                value={dsaForm.problemName}
                onChange={(e) => setDsaForm((prev: typeof dsaForm) => ({ ...prev, problemName: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select name="platform" value={dsaForm.platform} onValueChange={(value) => setDsaForm((prev: typeof dsaForm) => ({ ...prev, platform: value }))}>
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
                <Select name="difficulty" value={dsaForm.difficulty} onValueChange={(value) => setDsaForm((prev: typeof dsaForm) => ({ ...prev, difficulty: value }))}>
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
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount (₹)"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev: typeof expenseForm) => ({ ...prev, amount: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
              <Select name="category" value={expenseForm.category} onValueChange={(value) => setExpenseForm((prev: typeof expenseForm) => ({ ...prev, category: value }))}>
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
                  name="isDebt"
                  type="checkbox"
                  id="isDebt"
                  checked={expenseForm.isDebt}
                  onChange={(e) => setExpenseForm((prev: typeof expenseForm) => ({ ...prev, isDebt: e.target.checked }))}
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
      <CardContent className="p-4">
        <HabitSettings />
      </CardContent>
    </Card>
  </>
);

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

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

  // Morning Sync Popup state
  const [showMorningPopup, setShowMorningPopup] = useState(false);

  // Messages
  const [dsaMessage, setDsaMessage] = useState<string>('');
  const [expenseMessage, setExpenseMessage] = useState<string>('');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [collegeMessage, setCollegeMessage] = useState<string>('');

  useEffect(() => {
    fetchAllData();
    fetchDsaProblems();
    fetchExpenses();
    fetchRecentTransactions();
    fetchHealthData();

    // Check if morning popup should be shown (first visit only)
    const popupDismissed = sessionStorage.getItem('devlife_morning_popup_dismissed');
    if (!popupDismissed) {
      setShowMorningPopup(true);
    }
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
        // Clear message after 3 seconds
        setTimeout(() => setCollegeMessage(''), 3000);
      }
    });
  };

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="min-h-screen bg-zinc-950">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-zinc-800 rounded-xl"></div>
              ))}
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
    <>
      <SignedOut>
        <div className="min-h-screen bg-[#030014] relative overflow-hidden">
          {/* Cosmic Background - Nebula Glows */}
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px]"></div>

          {/* Fixed Navigation Bar */}
          <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  DevLife
                </div>
                <div className="flex items-center space-x-4">
                  <SignInButton mode="modal">
                    <button className="text-gray-300 hover:text-white transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="relative pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Copy */}
                <div className="space-y-8">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                    Master Your Day.<br />
                    <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                      Gamify Your Life.
                    </span>
                  </h1>
                  <p className="text-xl text-gray-400 max-w-lg">
                    The all-in-one productivity hub for developers. Track habits, crush tasks, and level up your career.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <SignUpButton mode="modal">
                      <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                </div>

                {/* Right Column - Floating UI Mockups */}
                <div className="relative h-[600px] lg:h-[700px]">
                  {/* Element A - Main Dashboard View (Foundation) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] max-w-[500px] h-[350px] bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="p-6">
                      <div className="text-sm text-cyan-400 mb-4">DevLife Dashboard</div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm">Productivity Trend</span>
                          <span className="text-green-400 text-xs">+24%</span>
                        </div>
                        <div className="h-16 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded flex items-end justify-between px-2">
                          {Array.from({ length: 7 }, (_, i) => (
                            <div key={i} className="w-4 bg-cyan-400 rounded-t" style={{ height: `${20 + Math.random() * 40}px` }}></div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-white text-xs">Complete project proposal</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-white text-xs">Review code changes</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                            <span className="text-white text-xs">Morning workout</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Element B - Habit Grid (Top-Left Satellite) */}
                  <div className="absolute top-0 left-[-20px] lg:left-0 z-20 w-[220px] h-[180px] bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden -rotate-6 animate-float-slow">
                    <div className="p-4">
                      <div className="text-xs text-cyan-400 mb-2">Habit Grid</div>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 30 }, (_, i) => (
                          <div key={i} className={`w-3 h-3 rounded ${['bg-green-500', 'bg-pink-500', 'bg-purple-500', 'bg-cyan-500'][i % 4]}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Element C - Gamification Badge (Bottom-Right Satellite) */}
                  <div className="absolute bottom-10 right-[-20px] lg:right-0 z-30 w-[200px] h-[120px] bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden rotate-3 animate-float-medium">
                    <div className="p-4 flex items-center justify-between h-full">
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-400">Lv. 7</div>
                        <div className="text-xs text-gray-400">Level Up!</div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Element D - Analytics Widget (Top-Right Tiny Card) */}
                  <div className="absolute top-10 right-10 z-0 w-[150px] h-[100px] bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden rotate-12">
                    <div className="p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">+24%</div>
                      <div className="text-xs text-gray-400">Weekly Completion Rate</div>
                    </div>
                  </div>

                  {/* Element E - Overdue Task Alert (Floating element) */}
                  <div className="absolute bottom-32 left-10 z-40 w-[260px] h-[60px] bg-red-950/70 backdrop-blur-xl border border-red-500/50 shadow-2xl rounded-2xl overflow-hidden -rotate-2 animate-float-fast">
                    <div className="p-3 flex items-center space-x-2">
                      <div className="text-red-400">⚠️</div>
                      <div className="text-sm text-white">Overdue: Submit Project Proposal</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Everything you need to stay
                  <span className="bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent"> focused</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Powerful tools designed for modern developers and students
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Habits Card */}
                <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/20 hover:border-purple-500/50 rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="text-6xl mb-6">🔥</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Github-style Habit Tracking</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Build lasting routines with visual contribution graphs. Track daily streaks and watch your consistency grow.
                  </p>
                </div>

                {/* Tasks Card */}
                <div className="bg-gradient-to-b from-gray-900 to-black border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="text-6xl mb-6">📋</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Mission-Control Task Manager</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Organize academic and personal tasks with smart prioritization. Never miss deadlines with intelligent reminders.
                  </p>
                </div>

                {/* Gamification Card */}
                <div className="bg-gradient-to-b from-gray-900 to-black border border-pink-500/20 hover:border-pink-500/50 rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="text-6xl mb-6">⚡</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Earn XP and Level Up</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Turn productivity into a game. Earn experience points, unlock achievements, and level up your productivity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-black/50 backdrop-blur-md border-t border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm">
                © 2024 DevLife. Built for productivity enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <MainLayout showHeader={true} showSidebar={true}>
          <div className="min-h-screen bg-zinc-950 text-white">
            <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 0 10px rgba(0,243,255,0.6))' }}>
                  DevLife Dashboard
                </h1>
                <p className="text-cyan-400/80 mt-2 text-sm sm:text-base" style={{ textShadow: '0 0 5px #00f3ff' }}>{getGreeting()}! Ready to grind? 🚀</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => window.location.href = '/tasks'}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white flex-1 sm:flex-none"
                >
                  📋 Tasks
                </Button>
              </div>
            </div>

            {/* Tab Toggle */}
            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex gap-1">
              <Button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                📊 Overview
              </Button>
              <Button
                onClick={() => setActiveTab('actions')}
                className={`flex-1 rounded-lg transition-all ${activeTab === 'actions' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                ✍️ Quick Actions
              </Button>
              <Button
                onClick={() => router.push('/habit-grid')}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20"
              >
                🔥 Habit Tracker
              </Button>
            </div>
 
            {/* Conditional Rendering */}
            {activeTab === 'overview' && <DashboardOverview data={data} dsaProblems={dsaProblems} recentTransactions={recentTransactions} />}

            {activeTab === 'actions' && <DashboardActions
              dsaForm={dsaForm} setDsaForm={setDsaForm} handleDsaSubmit={handleDsaSubmit} dsaMessage={dsaMessage}
              expenseForm={expenseForm} setExpenseForm={setExpenseForm} handleExpenseSubmit={handleExpenseSubmit} expenseMessage={expenseMessage}
              attendance={attendance} handleQuickGymLog={handleQuickGymLog} healthMessage={healthMessage}
              collegeAttendance={collegeAttendance} handleCollegeAttendanceToggle={handleCollegeAttendanceToggle} collegeMessage={collegeMessage}
              data={data} handleCollegeReset={handleCollegeReset} isPending={isPending}
            />}

      </div>
      </div>
    </MainLayout>
    
    {/* Morning Sync Popup */}
    {showMorningPopup && (
      <MorningSyncPopup onDismiss={() => setShowMorningPopup(false)} />
    )}
    </SignedIn>
    </>
  );
}
