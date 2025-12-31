'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Sparkles, Save, Tag, Wand2, Sparkles as RefactorIcon } from 'lucide-react';
import { Note } from '@/types/notes';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NoteEditorProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
}

export function NoteEditor({ note, isOpen, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Toast notifications
  const { addToast } = useToast();

  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || ''); // Ensure content is never null
      setTags(note.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [note]);

  // CRITICAL FIX: State initialization and reset during auth transitions
  useEffect(() => {
    // Force state initialization when component mounts or isOpen changes
    if (isOpen) {
      // Ensure all state variables are properly initialized
      setTitle(prev => prev || '');
      setContent(prev => prev || ''); // Never allow null/undefined
      setTags(prev => prev || []);
      setIsPreviewMode(false);
      setIsSaving(false);
      setIsGenerating(false);
      setIsRefactoring(false);
      setNewTag('');
      setIsTagsPanelOpen(false);
    }
  }, [isOpen]);

  // Additional safety: monitor content state and fix null/undefined values
  useEffect(() => {
    if (content === null || content === undefined) {
      console.warn('[STATE_FIX] Content state was null/undefined, resetting to empty string');
      setContent('');
    }
  }, [content]);

  // Speech recognition for voice typing
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported
  } = useSpeechRecognition({
    onResult: (newTranscript) => {
      // Insert transcript at cursor position
      if (contentRef.current) {
        const start = contentRef.current.selectionStart;
        const end = contentRef.current.selectionEnd;
        const safeContent = content || ''; // Ensure content is never null
        const newContent = safeContent.substring(0, start) + newTranscript + safeContent.substring(end);
        setContent(newContent);
        
        // Move cursor to end of inserted text
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.selectionStart = contentRef.current.selectionEnd = start + newTranscript.length;
            contentRef.current.focus();
          }
        }, 0);
      }
    }
  });

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags,
        is_pinned: note?.is_pinned || false,
      });
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAIAssist = async (action: 'fix_grammar' | 'generate_code' | 'summarize') => {
    const selectedText = window.getSelection()?.toString() || '';
    
    try {
      // CRITICAL FIX: Ensure content is always a valid string
      const safeContent = content || '';
      console.log('[AI_ASSIST] Content state:', { content, safeContent, type: typeof content, action });
      
      const response = await fetch('/api/notes/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          content: safeContent, // Always ensure we send a string
          selectedText,
          noteId: note?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (action === 'generate_code') {
          // Insert generated code at cursor position
          if (contentRef.current) {
            const start = contentRef.current.selectionStart;
            const end = contentRef.current.selectionEnd;
            const newContent = safeContent.substring(0, start) + data.result + safeContent.substring(end);
            setContent(newContent);
          }
        } else {
          // Replace selected text or entire content
          if (selectedText) {
            const newContent = safeContent.replace(selectedText, data.result);
            setContent(newContent);
          } else {
            setContent(data.result);
          }
        }
      }
    } catch (error) {
      console.error('AI assist error:', error);
    }
  };

  // AI Content Generator from Title
  const handleAIGenerateFromTitle = async () => {
    if (!title.trim()) {
      addToast({
        type: 'error',
        title: 'Title Required',
        message: 'Please enter a topic in the title first.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[AI_GENERATE] Starting generation for title:', title.trim());
      
      // CRITICAL FIX: Ensure content is always a valid string
      // Handle null/undefined state after authentication transitions
      const safeContent = content || '';
      
      console.log('[AI_GENERATE] === CLIENT SIDE DEBUG ===');
      console.log('[AI_GENERATE] Title:', JSON.stringify(title));
      console.log('[AI_GENERATE] Title type:', typeof title);
      console.log('[AI_GENERATE] Title length:', title?.length || 0);
      console.log('[AI_GENERATE] Content:', JSON.stringify(content));
      console.log('[AI_GENERATE] Content type:', typeof content);
      console.log('[AI_GENERATE] Content null check:', content === null);
      console.log('[AI_GENERATE] Content undefined check:', content === undefined);
      console.log('[AI_GENERATE] SafeContent:', JSON.stringify(safeContent));
      console.log('[AI_GENERATE] SafeContent length:', safeContent.length);
      
      const requestBody = {
        action: 'generate_content_from_title',
        title: title.trim(),
        content: safeContent,
        noteId: note?.id,
      };
      
      console.log('[AI_GENERATE] Request body:', requestBody);
      console.log('[AI_GENERATE] Request body content field:', JSON.stringify(requestBody.content));
      
      const response = await fetch('/api/notes/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[AI_GENERATE] Response status:', response.status);
      console.log('[AI_GENERATE] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[AI_GENERATE] Response data:', data);
        
        if (data.result) {
          // Typewriter effect for content insertion
          await typewriterEffect(data.result);
          
          // Auto-focus the textarea
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.focus();
            }
          }, 100);
          
          addToast({
            type: 'success',
            title: 'Content Generated',
            message: 'AI has generated content based on your title.',
          });
        } else {
          throw new Error('No content generated');
        }
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to generate content';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('[AI_GENERATE] API Error:', errorData);
        } catch (parseError) {
          console.error('[AI_GENERATE] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[AI_GENERATE] AI generation error:', error);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate content. Try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Typewriter effect for content insertion
  const typewriterEffect = async (text: string) => {
    if (!text || typeof text !== 'string') {
      console.warn('[TYPEWRITER] Invalid text provided:', text);
      return;
    }
    
    setContent('');
    const words = text.split(' ');
    let currentContent = '';
    
    try {
      for (let i = 0; i < words.length; i++) {
        currentContent += (i > 0 ? ' ' : '') + words[i];
        setContent(currentContent);
        
        // Small delay between words for typewriter effect
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    } catch (error) {
      console.error('[TYPEWRITER] Error during typewriter effect:', error);
      // Fallback: set content directly
      setContent(text);
    }
  };

  // Refactor Note - Chaos to Clarity
  const handleRefactor = async () => {
    // Step 1: Validation Check
    const safeContent = content || '';
    if (!safeContent.trim()) {
      addToast({
        type: 'warning',
        title: 'No Content',
        message: 'Please type some text to refactor first.',
      });
      return;
    }

    setIsRefactoring(true);
    
    // Step 3: Debugging Log
    console.log('Sending text to AI:', safeContent);
    console.log('Content length:', safeContent.length);
    console.log('Content preview:', safeContent.substring(0, 100) + '...');
    
    try {
      const response = await fetch('/api/notes/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refactor_note',
          rawText: safeContent.trim(),
          content: safeContent.trim(), // Also send as content for compatibility
          noteId: note?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Response received:', data.result);
        console.log('Response length:', data.result?.length);
        
        // Fade out old content, fade in new content
        await fadeTransition(data.result);
        
        addToast({
          type: 'success',
          title: 'Note Refactored',
          message: 'Your note has been transformed into structured Markdown!',
        });
      } else {
        console.error('API Response Error:', response.status, response.statusText);
        throw new Error(`Failed to refactor note: ${response.status}`);
      }
    } catch (error) {
      console.error('Refactor error:', error);
      addToast({
        type: 'error',
        title: 'Refactoring Failed',
        message: 'Failed to refactor note. Try again.',
      });
    } finally {
      setIsRefactoring(false);
    }
  };

  // Fade transition effect for content replacement
  const fadeTransition = async (newContent: string) => {
    return new Promise<void>((resolve) => {
      // Start with empty content for fade out effect
      setContent('');
      
      setTimeout(() => {
        // Fade in the new content
        setContent(newContent);
        resolve();
      }, 200);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {note ? 'Edit Note' : 'Create New Note'}
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagsPanelOpen(!isTagsPanelOpen)}
              className={`${
                isTagsPanelOpen 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' 
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title="Toggle Tags Panel"
            >
              <Tag className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="bg-white/10 border-white/20 text-white"
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/5">
          {/* Voice typing */}
          {isSupported && (
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={isListening ? stopListening : startListening}
              className={isListening 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Stop' : 'Voice'}
            </Button>
          )}

          {/* AI Assist */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIGenerateFromTitle}
              disabled={isGenerating}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              title="Generate content from Title"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </Button>
            
            {/* Refactor Button - Special Magic Styling */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefactor}
              disabled={isRefactoring}
              className="relative bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border-2 border-transparent bg-clip-padding hover:from-purple-500/30 hover:via-pink-500/30 hover:to-orange-500/30 transition-all duration-300 shadow-lg shadow-purple-500/25"
              title="Refactor Note - Transform chaos into clarity"
              style={{
                backgroundImage: 'linear-gradient(45deg, #8b5cf6, #ec4899, #f59e0b)',
                padding: '1px',
              }}
            >
              <div className="bg-gray-900/95 rounded-md px-2 py-1 flex items-center gap-2">
                {isRefactoring ? (
                  <div className="w-4 h-4 border-2 border-purple-300/50 border-t-purple-300 rounded-full animate-spin" />
                ) : (
                  <RefactorIcon className="w-4 h-4 text-purple-300" />
                )}
                <span className="text-purple-200 font-medium">
                  {isRefactoring ? 'Refactoring...' : 'Refactor'}
                </span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAssist('fix_grammar')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              title="Fix Grammar"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAssist('generate_code')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              title="Generate Code"
            >
              Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAIAssist('summarize')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              title="Summarize"
            >
              TL;DR
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Editor/Preview */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            isTagsPanelOpen ? 'md:w-3/4' : 'w-full'
          }`}>
            {isPreviewMode ? (
              <div className="flex-1 p-4 overflow-auto">
                <div className="prose prose-invert max-w-none">
                  {/* Simple markdown-like preview */}
                  <div className="whitespace-pre-wrap text-white">
                    {content || '_Nothing to preview_'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4">
                {/* Title input */}
                <Input
                  type="text"
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mb-4 bg-white/10 border-white/20 text-white placeholder-gray-400 text-lg font-semibold"
                />

                {/* Content textarea with refactoring overlay */}
                <div className="relative flex-1">
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your note... Use markdown for formatting!"
                    className={`w-full h-full p-3 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-all duration-300 ${
                      isRefactoring ? 'blur-sm opacity-70' : ''
                    }`}
                    style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
                    disabled={isRefactoring}
                  />
                  
                  {/* Refactoring Status Overlay */}
                  {isRefactoring && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-md">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-8 h-8 border-4 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
                        <span className="text-purple-200 font-medium">Refactoring chaos into clarity...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with tags */}
          <div className={`border-l border-white/10 bg-white/5 transition-all duration-300 ease-in-out overflow-hidden ${
            isTagsPanelOpen 
              ? 'md:w-64 w-full md:opacity-100 opacity-100 max-h-48 md:max-h-none' 
              : 'w-0 h-0 md:w-0 opacity-0 md:opacity-0'
          }`}>
            <div className="p-4 h-full">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </h3>
            
            {/* Add tag */}
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Add
              </Button>
            </div>

            {/* Tags list */}
            <div className="space-y-1">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-xs"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-300 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Voice typing status */}
            {isListening && (
              <div className="mt-4 p-2 bg-red-500/20 border border-red-400/30 rounded text-red-200 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></div>
                  Listening...
                </div>
                {transcript && (
                  <div className="mt-1 text-red-300">
                    "{transcript}"
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}