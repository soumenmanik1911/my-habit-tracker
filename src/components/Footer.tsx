'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GitBranch, Heart, Quote } from 'lucide-react';

interface Quote {
  text: string;
  author?: string;
}

export function Footer() {
  const [dailyQuote, setDailyQuote] = useState<string>('');

  useEffect(() => {
    // Load quotes and select daily quote
    const loadDailyQuote = async () => {
      try {
        const response = await fetch('/data/quotes.json');
        const quotes: string[] = await response.json();

        // Get day of year for consistent daily rotation
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        // Select quote based on day of year, cycle through all quotes
        const quoteIndex = dayOfYear % quotes.length;
        setDailyQuote(quotes[quoteIndex]);
      } catch (error) {
        console.error('Failed to load quotes:', error);
        setDailyQuote('Stay motivated and keep pushing forward!');
      }
    };

    loadDailyQuote();
  }, []);

  return (
    <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Version Control Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Version Control</h3>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>Built with modern web technologies</p>
              <p>Git repository: habit-tracker</p>
              <p>Continuous integration enabled</p>
              <p>Automated deployments</p>
            </div>
          </div>

          {/* Daily Quote Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Daily Motivation</h3>
            </div>
            <Card className="bg-zinc-800/50 border-zinc-700/50">
              <CardContent className="p-4">
                <blockquote className="text-sm text-zinc-200 italic">
                  "{dailyQuote}"
                </blockquote>
              </CardContent>
            </Card>
          </div>

          {/* Credits Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">Credits</h3>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>Developed by <span className="font-semibold text-white">Soumen Manik</span></p>
              <p>Full-stack developer passionate about productivity</p>
              <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
              <p>© 2024 All rights reserved</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-zinc-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-400">
              Habit Tracker - Track your progress, achieve your goals
            </p>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>v1.0.0</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}