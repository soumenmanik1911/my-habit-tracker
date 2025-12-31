'use client';

import { Plus } from 'lucide-react';

export function GhostCard() {
  return (
    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center group">
      <div className="flex flex-col items-center justify-center space-y-2 text-white/20">
        <Plus className="w-8 h-8" />
        <span className="text-xs font-medium">Empty Slot</span>
      </div>
    </div>
  );
}