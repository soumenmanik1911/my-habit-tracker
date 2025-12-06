'use client';

import { useState, useTransition } from 'react';
import { addProblem } from '@/actions/dsa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/MainLayout';

interface Problem {
  id: number;
  problem_name: string;
  platform: string;
  difficulty: string;
  time_taken_mins: number;
  date: string;
}

export default function DSAPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');

  // Fetch today's problems
  const fetchTodayProblems = async () => {
    try {
      const response = await fetch('/api/dsa/today');
      const data = await response.json();
      setProblems(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addProblem(formData);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Problem added successfully!');
        fetchTodayProblems(); // Refresh the list
      }
    });
  };

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">DSA Tracker</h1>
        <p className="text-gray-400">Track your daily coding problems</p>
      </div>

      {/* Add Problem Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add Problem</CardTitle>
          <CardDescription className="text-gray-400">
            Log a new problem you've solved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="problemName" className="text-sm font-medium text-gray-300">
                  Problem Name
                </label>
                <Input
                  id="problemName"
                  name="problemName"
                  placeholder="e.g., Two Sum"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="platform" className="text-sm font-medium text-gray-300">
                  Platform
                </label>
                <Select name="platform" required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LeetCode">LeetCode</SelectItem>
                    <SelectItem value="GFG">GeeksforGeeks</SelectItem>
                    <SelectItem value="CodeChef">CodeChef</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="difficulty" className="text-sm font-medium text-gray-300">
                  Difficulty
                </label>
                <Select name="difficulty" required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="timeTaken" className="text-sm font-medium text-gray-300">
                  Time Taken (mins)
                </label>
                <Input
                  id="timeTaken"
                  name="timeTaken"
                  type="number"
                  placeholder="30"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'Adding...' : 'Add Problem'}
            </Button>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Problems List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Today's Problems</CardTitle>
          <CardDescription className="text-gray-400">
            Problems solved today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchTodayProblems}
            className="mb-4 bg-gray-700 hover:bg-gray-600"
          >
            Refresh
          </Button>
          
          {problems.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No problems solved today yet
            </p>
          ) : (
            <div className="space-y-3">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div>
                    <h3 className="font-semibold text-white">{problem.problem_name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{problem.platform}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          problem.difficulty === 'Easy'
                            ? 'bg-green-900 text-green-300'
                            : problem.difficulty === 'Medium'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                      <span>{problem.time_taken_mins} mins</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(problem.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}