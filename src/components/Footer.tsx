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
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-t border-slate-700/50 mt-auto relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(56,189,248,0.02)_25%,rgba(56,189,248,0.02)_50%,transparent_50%,transparent_75%,rgba(56,189,248,0.02)_75%)] bg-[length:20px_20px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Daily Quote Section - Highlighted and Centered */}
          <div className="lg:col-span-3 lg:order-1 order-2">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Quote className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Daily Inspiration
                </h3>
              </div>

              <div className="max-w-3xl mx-auto">
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-600/50 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
                  <CardContent className="p-8">
                    <blockquote className="text-xl text-slate-200 leading-relaxed font-medium italic relative">
                      <span className="absolute -top-2 -left-2 text-4xl text-cyan-400/30">"</span>
                      {dailyQuote}
                      <span className="absolute -bottom-6 -right-2 text-4xl text-cyan-400/30">"</span>
                    </blockquote>
                    <div className="mt-6 flex items-center justify-center">
                      <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Version Control Section */}
          <div className="space-y-4 lg:order-2 order-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Technology</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Next.js & TypeScript
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                PostgreSQL Database
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Tailwind CSS & Framer Motion
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Vercel Deployment
              </p>
            </div>
          </div>

          {/* Credits Section */}
          <div className="space-y-4 lg:order-3 order-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">About</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="font-medium text-white">Soumen Manik</p>
              <p>Full-stack developer & productivity enthusiast</p>
              <p className="text-slate-400">Building tools that matter</p>
              <p className="text-slate-400">© 2025 All rights reserved</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-600/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-400 text-center sm:text-left">
              DevLife - Your personal productivity companion for tracking habits and achieving goals
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-600/30">v2.0.0</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-center">Updated Dec 7, 2025</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}