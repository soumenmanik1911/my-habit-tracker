CREATE TABLE DSALogs (
    id SERIAL PRIMARY KEY,
    problem_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) CHECK (platform IN ('LeetCode', 'GFG', 'CodeChef', 'Other')),
    difficulty VARCHAR(50) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    time_taken_mins INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE Attendance (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(255) UNIQUE NOT NULL,
    total_classes INTEGER NOT NULL,
    attended_classes INTEGER NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Expenses (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('Food', 'Travel', 'Recharge', 'Books', 'Other')),
    description TEXT,
    is_debt BOOLEAN NOT NULL,
    date DATE DEFAULT CURRENT_DATE
);

-- Simplified Health Tracker - attendance, mood, and college attendance
CREATE TABLE HealthTracker (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    attendance VARCHAR(20) CHECK (attendance IN ('Gym', 'Rest Day', 'Not Going to the Gym')) NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
    college_attendance BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add college_attendance column if it doesn't exist (for existing databases)
ALTER TABLE HealthTracker ADD COLUMN IF NOT EXISTS college_attendance BOOLEAN DEFAULT NULL;

-- Make time_taken_mins nullable for existing DSALogs table
ALTER TABLE DSALogs ALTER COLUMN time_taken_mins DROP NOT NULL;

-- Original DailyStats table (commented out for reference and no longer used)
/*
CREATE TABLE DailyStats (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    sleep_hours DECIMAL(4,2),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    water_intake INTEGER CHECK (water_intake >= 0 AND water_intake <= 20),
    calories INTEGER CHECK (calories >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy index for DailyStats (kept for reference only)
CREATE INDEX idx_daily_stats_date ON DailyStats(date);
*/

-- Legacy GymAttendance table (no longer used by the app; superseded by HealthTracker)
CREATE TABLE GymAttendance (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    attended BOOLEAN NOT NULL DEFAULT false,
    workout_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better query performance (still valid for legacy data)
CREATE INDEX idx_gym_attendance_date ON GymAttendance(date);

-- Tasks table for Task Manager
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    due_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    category VARCHAR(20) CHECK (category IN ('Academic', 'Personal', 'Exam', 'Project')) DEFAULT 'Personal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better query performance on tasks
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_category ON tasks(category);

-- User Settings table for habit tracking preferences
CREATE TABLE UserSettings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO UserSettings (setting_key, setting_value) VALUES
('dsa_streak_enabled', 'true'),
('gym_miss_threshold', '3'),
('college_streak_enabled', 'true');


CREATE TABLE HabitStreaks (
    id SERIAL PRIMARY KEY,
    habit_type VARCHAR(20) UNIQUE NOT NULL, 
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO HabitStreaks (habit_type, current_streak, longest_streak) VALUES
('dsa', 0, 0),
('gym', 0, 0),
('college', 0, 0);