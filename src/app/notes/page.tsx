'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Note } from '@/types/notes';
import { NoteCard } from '@/components/notes/NoteCard';
import { GhostCard } from '@/components/notes/GhostCard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { GlobalAIAgent } from '@/components/GlobalAIAgent';
import { Footer } from '@/components/Footer';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Ghost cards configuration
  const MIN_SLOTS = 8;

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Handle note click (open editor)
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  // Handle add note
  const handleAddNote = () => {
    setSelectedNote(null);
    setIsEditorOpen(true);
  };

  // Handle save note (create or update)
  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      if (selectedNote) {
        // Update existing note
        const response = await fetch(`/api/notes/${selectedNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });

        if (!response.ok) {
          throw new Error('Failed to update note');
        }

        const updatedNote = await response.json();
        setNotes(notes.map(note => 
          note.id === selectedNote.id ? updatedNote : note
        ));
      } else {
        // Create new note
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });

        if (!response.ok) {
          throw new Error('Failed to create note');
        }

        const newNote = await response.json();
        setNotes([newNote, ...notes]);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      throw err;
    }
  };

  // Handle pin note
  const handlePinNote = async (note: Note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: !note.is_pinned,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      const updatedNote = await response.json();
      setNotes(notes.map(n => 
        n.id === note.id ? updatedNote : n
      ));
    } catch (err) {
      console.error('Error pinning note:', err);
    }
  };

  // Handle delete note
  const handleDeleteNote = async (note: Note) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter(n => n.id !== note.id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Handle editor close
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedNote(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <div className="text-white text-lg">Loading your intelligent glass notebook...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={fetchNotes}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      {/* NavigationHeader */}
      <NavigationHeader />

      {/* Main Content Area - THIS IS THE KEY FIX */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-auto">
        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
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
              {Array.from(new Set(notes.flatMap(note => note.tags || []))).sort().map(tag => (
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
              onClick={handleAddNote}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes Grid - With Ghost Cards for Visual Fill */}
        {(() => {
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

          // Calculate ghost cards needed
          const totalNotes = filteredNotes.length;
          const ghostCount = Math.max(0, MIN_SLOTS - totalNotes);
          const ghosts = new Array(ghostCount).fill(null);

          return (
            <div className="space-y-6">
              {/* Results count */}
              <div className="text-sm text-gray-400">
                {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
                {filterTag && ` with tag "${filterTag}"`}
                {showPinnedOnly && ' (pinned only)'}
              </div>

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
                    <Button onClick={handleAddNote} className="bg-blue-500 hover:bg-blue-600">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                        {pinnedNotes.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={handleNoteClick}
                            onPin={handlePinNote}
                            onDelete={handleDeleteNote}
                          />
                        ))}
                        {/* Add ghost cards after pinned notes if needed */}
                        {ghosts.slice(0, Math.max(0, MIN_SLOTS - unpinnedNotes.length)).map((_, index) => (
                          <GhostCard key={`pinned-ghost-${index}`} />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {unpinnedNotes.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={handleNoteClick}
                            onPin={handlePinNote}
                            onDelete={handleDeleteNote}
                          />
                        ))}
                        {/* Add remaining ghost cards after regular notes */}
                        {ghosts.slice(pinnedNotes.length > 0 ? Math.max(0, MIN_SLOTS - unpinnedNotes.length) : 0).map((_, index) => (
                          <GhostCard key={`regular-ghost-${index}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If no pinned or regular notes but we have ghost count, show ghost grid */}
                  {filteredNotes.length > 0 && ghosts.length > 0 && pinnedNotes.length === 0 && unpinnedNotes.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {ghosts.map((_, index) => (
                        <GhostCard key={`fallback-ghost-${index}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* The Footer Section - wrapper for Daily Inspiration & About */}
      <Footer />

      {/* Note Editor Modal */}
      <NoteEditor
        note={selectedNote}
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        onSave={handleSaveNote}
      />

      {/* Global AI Agent */}
      <GlobalAIAgent />
    </div>
  );
}