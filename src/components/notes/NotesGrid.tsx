                                                                                                                    'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Note } from '@/types/notes';
import { NoteCard } from './NoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NotesGridProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onAddNote: () => void;
  onPinNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
}

export function NotesGrid({ 
  notes, 
  onNoteClick, 
  onAddNote, 
  onPinNote, 
  onDeleteNote 
}: NotesGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Get all unique tags for filtering
  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags || []))
  ).sort();

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = filterTag === '' || 
      (note.tags && note.tags.includes(filterTag));
    
    const matchesPinned = !showPinnedOnly || note.is_pinned;
    
    return matchesSearch && matchesTag && matchesPinned;
  });

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.is_pinned);

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Tag filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag} className="bg-gray-800">
                {tag}
              </option>
            ))}
          </select>

          {/* Pinned filter */}
          <Button
            variant={showPinnedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Filter className="w-4 h-4 mr-1" />
            Pinned
          </Button>

          {/* Add note button */}
          <Button
            onClick={onAddNote}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
        {searchQuery && ` for "${searchQuery}"`}
        {filterTag && ` with tag "${filterTag}"`}
        {showPinnedOnly && ' (pinned only)'}
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {notes.length === 0 ? 'No notes yet' : 'No notes match your filters'}
          </div>
          <div className="text-gray-500 text-sm mb-4">
            {notes.length === 0 
              ? 'Create your first note to get started!' 
              : 'Try adjusting your search or filter criteria'
            }
          </div>
          {notes.length === 0 && (
            <Button onClick={onAddNote} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Pinned Notes ({pinnedNotes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={onNoteClick}
                    onPin={onPinNote}
                    onDelete={onDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-lg font-semibold text-white mb-4">
                  All Notes ({unpinnedNotes.length})
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={onNoteClick}
                    onPin={onPinNote}
                    onDelete={onDeleteNote}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}