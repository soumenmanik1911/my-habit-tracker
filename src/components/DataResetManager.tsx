'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, RefreshCw, Settings, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ResetSettings {
  expenses: {
    enabled: boolean;
    interval: 'monthly' | 'quarterly' | 'annually' | 'custom';
    customDate?: string;
  };
  debts: {
    enabled: boolean;
    interval: 'monthly' | 'quarterly' | 'annually' | 'custom';
    customDate?: string;
  };
  college: {
    enabled: boolean;
    interval: 'monthly' | 'quarterly' | 'annually' | 'custom';
    customDate?: string;
  };
}

interface DataSummary {
  expenses: number;
  debts: number;
  college: number;
}

const STORAGE_KEY = 'dataResetSettings';
const LOG_KEY = 'dataResetLogs';

export default function DataResetManager() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<ResetSettings>({
    expenses: { enabled: false, interval: 'monthly' },
    debts: { enabled: false, interval: 'monthly' },
    college: { enabled: false, interval: 'monthly' },
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedReset, setSelectedReset] = useState<'expenses' | 'debts' | 'college' | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary>({ expenses: 0, debts: 0, college: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: ResetSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Calculate next reset date
  const getNextResetDate = (type: keyof ResetSettings) => {
    const setting = settings[type];
    if (!setting.enabled) return null;

    const now = new Date();
    let nextDate = new Date();

    switch (setting.interval) {
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1, 1);
        break;
      case 'quarterly':
        nextDate.setMonth(now.getMonth() + 3, 1);
        break;
      case 'annually':
        nextDate.setFullYear(now.getFullYear() + 1, 0, 1);
        break;
      case 'custom':
        if (setting.customDate) {
          nextDate = new Date(setting.customDate);
        }
        break;
    }

    return nextDate;
  };

  // Get countdown text
  const getCountdownText = (nextDate: Date | null) => {
    if (!nextDate) return '';

    const now = new Date();
    const diff = nextDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  // Check for notifications
  useEffect(() => {
    const checkNotifications = () => {
      Object.keys(settings).forEach((type) => {
        const nextDate = getNextResetDate(type as keyof ResetSettings);
        if (nextDate) {
          const days = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (days <= 3 && days > 0) {
            addToast({
              type: 'warning',
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} reset in ${days} day${days > 1 ? 's' : ''}`,
              message: `Next reset: ${nextDate.toLocaleDateString()}`,
            });
          }
        }
      });
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 1000 * 60 * 60); // Check hourly
    return () => clearInterval(interval);
  }, [settings]);

  // Fetch data summary for confirmation
  const fetchDataSummary = async () => {
    if (!selectedReset) return;

    try {
      let endpoint = '';
      switch (selectedReset) {
        case 'expenses':
          endpoint = '/api/wallet/expenses';
          break;
        case 'debts':
          endpoint = '/api/wallet/expenses'; // Same endpoint, filter later
          break;
        case 'college':
          endpoint = '/api/health/weekly'; // Get health data
          break;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (selectedReset === 'expenses') {
        setDataSummary(prev => ({ ...prev, expenses: data.filter((item: any) => !item.is_debt).length }));
      } else if (selectedReset === 'debts') {
        setDataSummary(prev => ({ ...prev, debts: data.filter((item: any) => item.is_debt).length }));
      } else if (selectedReset === 'college') {
        setDataSummary(prev => ({ ...prev, college: data.filter((item: any) => item.college_attendance).length }));
      }
    } catch (error) {
      console.error('Error fetching data summary:', error);
    }
  };

  useEffect(() => {
    if (isConfirmOpen && selectedReset) {
      fetchDataSummary();
    }
  }, [isConfirmOpen, selectedReset]);

  // Export data
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devlife-data-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast({ type: 'success', title: 'Data exported successfully' });
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  // Reset data
  const handleReset = async () => {
    if (!selectedReset) return;

    setIsResetting(true);
    try {
      const nextDate = getNextResetDate(selectedReset);
      if (!nextDate) return;

      const beforeDate = nextDate.toISOString().split('T')[0];

      const response = await fetch(`/api/reset/${selectedReset === 'debts' ? 'debts' : selectedReset === 'college' ? 'college-attendance' : 'expenses'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeDate }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({ type: 'success', title: result.message });

        // Log the action
        const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        logs.push({
          type: selectedReset,
          timestamp: new Date().toISOString(),
          beforeDate,
          result,
        });
        localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-50))); // Keep last 50 logs

        setIsConfirmOpen(false);
        setSelectedReset(null);
      } else {
        addToast({ type: 'error', title: result.error || 'Reset failed' });
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Reset failed. Please try again.' });
    } finally {
      setIsResetting(false);
    }
  };

  const dataTypes = [
    { key: 'expenses' as const, label: 'Expenses', icon: '💰' },
    { key: 'debts' as const, label: 'Udhaar (Debts)', icon: '💸' },
    { key: 'college' as const, label: 'College Attendance', icon: '🎓' },
  ];

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-xl">
      <CardHeader className="border-b border-zinc-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-400" />
          Data Reset Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Settings Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-400">
              Configure automatic data resets and manage your data lifecycle.
            </p>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Reset Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {dataTypes.map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${key}-enabled`}
                          checked={settings[key].enabled}
                          onCheckedChange={(checked) =>
                            saveSettings({
                              ...settings,
                              [key]: { ...settings[key], enabled: !!checked },
                            })
                          }
                        />
                        <label htmlFor={`${key}-enabled`} className="text-sm font-medium">
                          {label}
                        </label>
                      </div>
                      {settings[key].enabled && (
                        <div className="ml-6 space-y-2">
                          <Select
                            value={settings[key].interval}
                            onValueChange={(value: any) =>
                              saveSettings({
                                ...settings,
                                [key]: { ...settings[key], interval: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                              <SelectItem value="custom">Custom Date</SelectItem>
                            </SelectContent>
                          </Select>
                          {settings[key].interval === 'custom' && (
                            <Input
                              type="date"
                              value={settings[key].customDate || ''}
                              onChange={(e) =>
                                saveSettings({
                                  ...settings,
                                  [key]: { ...settings[key], customDate: e.target.value },
                                })
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Data Types Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataTypes.map(({ key, label, icon }) => {
              const nextDate = getNextResetDate(key);
              const countdown = getCountdownText(nextDate);
              const isEnabled = settings[key].enabled;

              return (
                <div key={key} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{icon}</span>
                    <Badge variant={isEnabled ? 'default' : 'secondary'}>
                      {isEnabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-white mb-1">{label}</h3>
                  {isEnabled && nextDate ? (
                    <div className="text-sm text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Next: {nextDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-orange-400">{countdown}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500">Not configured</div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-3"
                    onClick={() => {
                      setSelectedReset(key);
                      setIsConfirmOpen(true);
                    }}
                    disabled={!isEnabled}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Reset Now
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Export Button */}
          <div className="flex justify-center">
            <Button onClick={handleExport} disabled={isExporting} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>

          {/* Confirmation Dialog */}
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Confirm Data Reset
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-zinc-600">
                  Are you sure you want to reset {selectedReset} data? This action cannot be undone.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Data to be deleted:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {selectedReset === 'expenses' && <li>Expenses: {dataSummary.expenses} records</li>}
                    {selectedReset === 'debts' && <li>Debts: {dataSummary.debts} records</li>}
                    {selectedReset === 'college' && <li>College attendance: {dataSummary.college} records</li>}
                  </ul>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="export-first" />
                  <label htmlFor="export-first" className="text-sm">
                    Export data first (recommended)
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}