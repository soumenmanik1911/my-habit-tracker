'use client';

import { MainLayout } from '@/components/MainLayout';
import DataResetManager from '@/components/DataResetManager';

export default function ResetPage() {
  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Data Reset Manager</h1>
          <p className="text-gray-400">Configure automatic data resets and manage your data lifecycle</p>
        </div>

        <DataResetManager />
      </div>
    </MainLayout>
  );
}