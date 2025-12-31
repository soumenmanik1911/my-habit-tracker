'use client';

import { useState } from 'react';
import { Pin, Calendar, Tag } from 'lucide-react';
import { Note } from '@/types/notes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onPin: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, onClick, onPin, onDelete }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Truncate content to first 2 lines
  const truncateContent = (content: string, maxLength: number = 150) => {
    const lines = content.split('\n').slice(0, 2);
    const truncated = lines.join(' ');
    return truncated.length > maxLength 
      ? truncated.substring(0, maxLength) + '...' 
      : truncated;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Simple context menu alternatives
    const action = prompt('Type "pin" to pin/unpin, "delete" to delete:');
    if (action === 'pin') {
      onPin(note);
    } else if (action === 'delete') {
      onDelete(note);
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        ${note.is_pinned ? 'ring-2 ring-yellow-400/50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(note)}
      onContextMenu={handleContextMenu}
    >
      {/* Glassmorphic card with backdrop blur */}
      <div className={`
        relative h-48 p-4 rounded-xl border transition-all duration-300
        bg-gradient-to-br from-white/10 to-white/5 
        backdrop-blur-md border-white/20
        hover:from-white/15 hover:to-white/10 hover:border-white/30
        ${note.is_pinned 
          ? 'shadow-lg shadow-yellow-500/20 border-yellow-400/30' 
          : 'hover:shadow-xl hover:shadow-blue-500/10'
        }
        ${isHovered ? 'shadow-2xl scale-105' : 'shadow-lg scale-100'}
        hover:scale-105
      `}>
        {/* Pin indicator */}
        {note.is_pinned && (
          <div className="absolute top-3 right-3">
            <Pin className="w-4 h-4 text-yellow-400 fill-current" />
          </div>
        )}

        {/* Action buttons */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPin(note);
              }}
              className="p-1 h-auto bg-white/10 hover:bg-white/20"
            >
              <Pin className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note);
              }}
              className="p-1 h-auto bg-red-500/20 hover:bg-red-500/30 text-red-300"
            >
              ×
            </Button>
          </div>
        )}

        {/* Card content */}
        <div className="flex flex-col h-full">
          {/* Title */}
          <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1 pr-8">
            {note.title}
          </h3>

          {/* Content preview */}
          <p className="text-gray-300 text-sm mb-3 line-clamp-3 flex-1">
            {truncateContent(note.content)}
          </p>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gray-500/20 text-gray-300 border-gray-400/30"
                >
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer with date */}
          <div className="flex items-center text-xs text-gray-400 mt-auto">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(note.updated_at)}
          </div>
        </div>

        {/* Hover glow effect */}
        {isHovered && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
        )}
      </div>
    </div>
  );
}