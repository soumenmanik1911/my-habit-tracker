// Client-side caching utilities for task management
// Implements "Fetch Once, Read Many" strategy with midnight expiration

export interface CachedTask {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: string;
  is_completed: boolean;
  category: 'Academic' | 'Personal' | 'Exam' | 'Project';
  created_at: string;
}

export interface CachedTasksData {
  tasks: CachedTask[];
  timestamp: string;
  date: string; // YYYY-MM-DD format for cache key
}

// Cache key for daily tasks
const TASKS_CACHE_KEY = 'devlife_daily_tasks';

// Get current date in YYYY-MM-DD format
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get timestamp for next midnight
function getNextMidnightTimestamp(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Check if cache has expired (past midnight)
function isCacheExpired(timestamp: string): boolean {
  const cacheTime = new Date(timestamp).getTime();
  return cacheTime < getNextMidnightTimestamp();
}

// Get cached tasks from localStorage
export function getCachedTasks(): CachedTasksData | null {
  try {
    const cached = localStorage.getItem(TASKS_CACHE_KEY);
    if (!cached) return null;

    const data: CachedTasksData = JSON.parse(cached);
    
    // Check if cache is for today and not expired
    const currentDate = getCurrentDateString();
    if (data.date !== currentDate || isCacheExpired(data.timestamp)) {
      clearCachedTasks();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cached tasks:', error);
    clearCachedTasks();
    return null;
  }
}

// Save tasks to localStorage cache
export function setCachedTasks(tasks: CachedTask[]): void {
  try {
    const cacheData: CachedTasksData = {
      tasks,
      timestamp: new Date().toISOString(),
      date: getCurrentDateString()
    };
    
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching tasks:', error);
  }
}

// Clear cached tasks (e.g., when tasks are updated)
export function clearCachedTasks(): void {
  try {
    localStorage.removeItem(TASKS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cached tasks:', error);
  }
}

// Fetch tasks with caching logic
export async function fetchTasksWithCache(): Promise<CachedTask[]> {
  // Try to get cached tasks first
  const cached = getCachedTasks();
  if (cached) {
    console.log('📋 Loaded tasks from cache (0 DB calls)');
    return cached.tasks;
  }

  // If no valid cache, fetch from API
  try {
    console.log('📡 Fetching fresh tasks from API (1 DB call)');
    const response = await fetch('/api/daily-tasks');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.tasks) {
      // Cache the fetched tasks
      setCachedTasks(data.tasks);
      return data.tasks;
    } else {
      throw new Error(data.error || 'Failed to fetch tasks');
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Check if cache needs refresh (for manual refresh scenarios)
export function shouldRefreshCache(): boolean {
  const cached = getCachedTasks();
  return cached === null;
}

// Get cache status for debugging
export function getCacheStatus(): { hasCache: boolean; isExpired: boolean; date: string | null } {
  const cached = getCachedTasks();
  if (!cached) {
    return { hasCache: false, isExpired: false, date: null };
  }
  
  return {
    hasCache: true,
    isExpired: isCacheExpired(cached.timestamp),
    date: cached.date
  };
}