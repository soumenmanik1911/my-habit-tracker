-- Multi-Tenant Schema Reset

-- Drop all existing tables
DROP TABLE IF EXISTS DSALogs;
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS HealthTracker;
DROP TABLE IF EXISTS GymAttendance;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS UserSettings;
DROP TABLE IF EXISTS HabitStreaks;
DROP TABLE IF EXISTS DailyStats;

-- Create tables with user_id
CREATE TABLE DSALogs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    problem_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) CHECK (platform IN ('LeetCode', 'GFG', 'CodeChef', 'Other')),
    difficulty VARCHAR(50) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    time_taken_mins INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE Attendance (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    total_classes INTEGER NOT NULL,
    attended_classes INTEGER NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject_name)
);

CREATE TABLE Expenses (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('Food', 'Travel', 'Recharge', 'Books', 'Other')),
    description TEXT,
    is_debt BOOLEAN NOT NULL,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE HealthTracker (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    attendance VARCHAR(20) CHECK (attendance IN ('Gym', 'Rest Day', 'Not Going to the Gym')) NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
    college_attendance BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

ALTER TABLE HealthTracker ADD COLUMN IF NOT EXISTS college_attendance BOOLEAN DEFAULT NULL;

CREATE TABLE GymAttendance (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    attended BOOLEAN NOT NULL DEFAULT false,
    workout_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_gym_attendance_date ON GymAttendance(date);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    due_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    category VARCHAR(20) CHECK (category IN ('Academic', 'Personal', 'Exam', 'Project')) DEFAULT 'Personal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_category ON tasks(category);

CREATE TABLE UserSettings (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

CREATE TABLE HabitStreaks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_type VARCHAR(20) NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, habit_type)
);

CREATE TABLE SmokingLogs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Legacy DailyStats table (included for compatibility with existing code)
CREATE TABLE DailyStats (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    sleep_hours DECIMAL(4,2),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    water_intake INTEGER CHECK (water_intake >= 0 AND water_intake <= 20),
    calories INTEGER CHECK (calories >= 0),
    gym_status BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Note: No initial inserts for UserSettings and HabitStreaks as they are now per-user