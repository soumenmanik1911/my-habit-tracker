'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/MainLayout';

/**
 * Gym page
 *
 * Gym attendance is now unified into the Health Tracker.
 * This page simply directs users to the Health page, which
 * uses the HealthTracker table as the single source of truth.
 */
export default function GymPage() {
  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Gym Attendance</h1>
        <p className="text-gray-400">
          Gym tracking has been merged into the Health Tracker.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Go to Health Tracker</CardTitle>
          <CardDescription className="text-gray-400">
            Log your daily gym attendance and mood on the Health page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/health">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Open Health Tracker
            </Button>
          </Link>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}