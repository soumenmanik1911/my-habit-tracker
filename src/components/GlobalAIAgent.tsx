'use client';

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Define the structure for parsed task data
interface TaskData {
  title: string;
  description?: string;
  date?: string;
  time?: string;
}

// Define the structure for pending task data
interface PendingTask {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  missing: string[];
}

// Define the structure for LLM response
interface LLMResponse {
  intent: 'add_task' | 'chat';
  title?: string;
  missing_fields?: string[];
}

// Holographic Sphere Component
const HolographicSphere = ({ isActive }: { isActive: boolean }) => {
  return (
    <Sphere args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={isActive ? '#00ffaa' : '#00bcd4'}
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.6}
      />
    </Sphere>
  );
};

// Glassmorphism Dialogue Box
const GlassmorphismDialog = (
  { isOpen, onClose, onSendMessage }:
  { isOpen: boolean; onClose: () => void; onSendMessage: (message: string) => void }
) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  const handleMicClick = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-96 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">AI Assistant</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300 text-xl">
          &times;
        </button>
      </div>

      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or speak your task..."
          className="w-full p-2 bg-white/20 text-white placeholder-gray-300 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handleMicClick}
          disabled={isListening}
          className={`p-2 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white`}
        >
          {isListening ? 'Listening...' : '🎤'}
        </button>

        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Main GlobalAIAgent Component
export const GlobalAIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [conversation, setConversation] = useState<{ sender: string; message: string }[]>([]);
  const [pendingTask, setPendingTask] = useState<PendingTask | null>(null);

  const handleAvatarClick = () => {
    setIsOpen(!isOpen);
    setIsActive(!isActive);
  };

  const handleSendMessage = async (message: string) => {
    // Add user message to conversation
    setConversation((prev) => [...prev, { sender: 'user', message }]);

    // Verbose Debugging: Log raw user input
    console.log('[AI_DEBUG] 1. Raw User Input:', message);

    // Check if there is a pending task FIRST
    let inputMessage = message;
    if (pendingTask) {
      // Merge the pending task with the new input
      inputMessage = pendingTask.title + " " + message;
      console.log('[AI_DEBUG] Merging pending task with new input:', inputMessage);
    }

    // First, try manual parsing for fast track
    const manuallyParsedTask = await parseTaskFromMessage(inputMessage);
    
    if (manuallyParsedTask) {
      // We have a potential task, check if it has all required fields
      if (manuallyParsedTask.title && manuallyParsedTask.date && manuallyParsedTask.time) {
        // Fast track: All fields present, add to database
        const confirmationMessage = `Task "${manuallyParsedTask.title}" scheduled for ${manuallyParsedTask.date} at ${manuallyParsedTask.time}.`;
        setConversation((prev) => [...prev, { sender: 'ai', message: confirmationMessage }]);
        await addTaskToDatabase(manuallyParsedTask);
        return;
      } else if (manuallyParsedTask.title && !manuallyParsedTask.date) {
        // We have a title but no date - prompt for date immediately
        const datePrompt = 'Which date should this task be scheduled for? Please specify a date (e.g., "tomorrow", "December 26", or "2025-12-26").';
        setConversation((prev) => [...prev, { sender: 'ai', message: datePrompt }]);
        
        // Save as pending task
        const newPendingTask: PendingTask = {
          title: manuallyParsedTask.title,
          description: manuallyParsedTask.description,
          missing: ['date'], // Date is missing
        };
        setPendingTask(newPendingTask);
        return;
      }
    }

    // If manual parsing didn't work or we need LLM, use the original flow
    // Construct the system prompt with the current date
    const currentDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const systemPrompt = `
You are a Task Extraction Engine. You do not speak. You only output JSON.
Current Date: ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Current Year: ${new Date().getFullYear()}.

Rules:
1. Extract "title", "date" (YYYY-MM-DD), and "time" (HH:MM).
2. **CRITICAL:** If the user input contains a date (e.g., "31st", "tomorrow", "next fri"), you MUST remove it from the "title" and put it in the "date" field.
3. **Ordinal Dates:** Watch for "st", "nd", "rd", "th" (e.g., "21st", "2nd"). These are ALWAYS dates.
4. **Defaults:** If date is missing, set to null. If time is missing, set to null.
5. **Typos:** Fix phonetic typos ("tomorow" -> "tomorrow").

TRAINING DATA (Follow these patterns exactly):

// --- SECTION 1: Ordinal Dates (The most common error) ---
Input: "Jogging 31st December" -> Output: { "title": "Jogging", "date": "${new Date().getFullYear()}-12-31" }
Input: "Submit project 1st Jan" -> Output: { "title": "Submit project", "date": "${new Date().getFullYear() + 1}-01-01" }
Input: "Meeting 2nd Feb" -> Output: { "title": "Meeting", "date": "${new Date().getFullYear() + 1}-02-02" }
Input: "Party 23rd March" -> Output: { "title": "Party", "date": "${new Date().getFullYear()}-03-23" }
Input: "Pay bills 15th" -> Output: { "title": "Pay bills", "date": "${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15" }

// --- SECTION 2: Standard Dates ---
Input: "Walk Dec 30" -> Output: { "title": "Walk", "date": "${new Date().getFullYear()}-12-30" }
Input: "Gym December 31" -> Output: { "title": "Gym", "date": "${new Date().getFullYear()}-12-31" }
Input: "Call Mom 12/25" -> Output: { "title": "Call Mom", "date": "${new Date().getFullYear()}-12-25" }

// --- SECTION 3: Relative Dates & Times ---
Input: "Run tomorrow 5pm" -> Output: { "title": "Run", "date": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}", "time": "17:00" }
Input: "Sleep tonight 11pm" -> Output: { "title": "Sleep", "date": "${new Date().toISOString().split('T')[0]}", "time": "23:00" }
Input: "Study next Friday" -> Output: { "title": "Study", "date": "${(() => { const d = new Date(); const days = (5 - d.getDay() + 7) % 7; d.setDate(d.getDate() + days + 7); return d.toISOString().split('T')[0]; })()}" }

// --- SECTION 4: Typos & Slang ---
Input: "rnning tomorow" -> Output: { "title": "running", "date": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" }
Input: "meting 31st dec" -> Output: { "title": "meeting", "date": "${new Date().getFullYear()}-12-31" }
Input: "gymm today at 7" -> Output: { "title": "gym", "date": "${new Date().toISOString().split('T')[0]}", "time": "07:00" }
Input: "remind me to code tmrw" -> Output: { "title": "code", "date": "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" }

// --- SECTION 5: Complex Sentences ---
Input: "Add a task about writing essay 31st dec 6am" -> Output: { "title": "writing essay", "date": "${new Date().getFullYear()}-12-31", "time": "06:00" }
Input: "Plan for the trip on 4th July" -> Output: { "title": "Plan for the trip", "date": "${new Date().getFullYear()}-07-04" }
Input: "Adidas task walking yesterday" -> Output: { "title": "walking", "date": "${new Date(Date.now() - 86400000).toISOString().split('T')[0]}" }

Output ONLY valid JSON.
`;

    // Send the user input to the LLM with the system prompt
    const llmResponse = await callLLM(systemPrompt, inputMessage);
    
    // Clean the LLM response to extract JSON
    const jsonStr = llmResponse.replace(/```json|```/g, '').trim();
    
    try {
      const parsedData = JSON.parse(jsonStr);
      console.log('[AI_DEBUG] AI Extracted JSON:', parsedData);
      
      // Check if the parsed data is valid
      if (parsedData && typeof parsedData === 'object') {
        // Check if there is a pending task
        if (pendingTask) {
          // Merge the new data with the pending task
          const mergedTask: TaskData = {
            title: parsedData.title || pendingTask.title,
            description: parsedData.description || pendingTask.description,
            date: parsedData.date || pendingTask.date,
            time: parsedData.time || pendingTask.time,
          };

          // If date is still missing and the new title looks like a date, parse it
          if (!mergedTask.date && mergedTask.title !== pendingTask.title) {
            const parsedDate = new Date(mergedTask.title);
            if (!isNaN(parsedDate.getTime())) {
              mergedTask.date = parsedDate.toISOString().split('T')[0];
              mergedTask.title = pendingTask.title; // Restore original title
            }
          }
          
          // Check if all required fields are now present
          if (mergedTask.title && mergedTask.date && mergedTask.time) {
            // All data present, confirm and add to DB
            const confirmationMessage = `Task "${mergedTask.title}" scheduled for ${mergedTask.date} at ${mergedTask.time}.`;
            setConversation((prev) => [...prev, { sender: 'ai', message: confirmationMessage }]);
            
            // Clear the pending task
            setPendingTask(null);
            
            // Add the task to the database
            await addTaskToDatabase(mergedTask);
          } else {
            // Still missing information, update the pending task
            const missingFields: string[] = [];
            if (!mergedTask.date) missingFields.push('date');
            if (!mergedTask.time) missingFields.push('time');
            
            const updatedPendingTask: PendingTask = {
              title: mergedTask.title,
              description: mergedTask.description,
              missing: missingFields,
            };
            setPendingTask(updatedPendingTask);
            
            // Ask for the remaining missing details
            let clarificationMessage = 'I can help with that. ';
            if (!mergedTask.date) {
              clarificationMessage += 'When do you want to do this? ';
            }
            if (!mergedTask.time) {
              clarificationMessage += 'What time should I set? ';
            }
            setConversation((prev) => [...prev, { sender: 'ai', message: clarificationMessage }]);
          }
        } else {
          // No pending task, check if all required fields are present
          if (parsedData.title && parsedData.date && parsedData.time) {
            // All data present, confirm and add to DB
            const confirmationMessage = `Task "${parsedData.title}" scheduled for ${parsedData.date} at ${parsedData.time}.`;
            setConversation((prev) => [...prev, { sender: 'ai', message: confirmationMessage }]);
            
            // Add the task to the database
            await addTaskToDatabase(parsedData);
          } else {
            // Missing information, save as pending task
            const missingFields: string[] = [];
            if (!parsedData.date) missingFields.push('date');
            if (!parsedData.time) missingFields.push('time');
            
            const newPendingTask: PendingTask = {
              title: parsedData.title,
              description: parsedData.description,
              missing: missingFields,
            };
            setPendingTask(newPendingTask);

            // Ask for the missing details with enhanced prompts
            let clarificationMessage = 'I can help with that. ';
            if (!parsedData.date) {
              // Proactive date prompt with clear context
              clarificationMessage += 'Which date should this task be scheduled for? Please specify a date (e.g., "tomorrow", "December 26", or "2025-12-26"). ';
            }
            if (!parsedData.time) {
              clarificationMessage += 'What time should I set? ';
            }
            setConversation((prev) => [...prev, { sender: 'ai', message: clarificationMessage }]);
          }
        }
      } else {
        // Invalid JSON structure
        setConversation((prev) => [...prev, { sender: 'ai', message: 'I did not understand that. Can you provide the task details in a clear format?' }]);
      }
    } catch (error) {
      console.error('[AI_DEBUG] Error parsing LLM response:', error);
      setConversation((prev) => [...prev, { sender: 'ai', message: 'I did not understand that. Can you provide the task details in a clear format?' }]);
    }
  };

  // Mock function to call the LLM (replace with actual LLM API call)
  const callLLM = async (systemPrompt: string, userMessage: string): Promise<string> => {
    console.log('[AI_DEBUG] Calling LLM with system prompt:', systemPrompt);
    console.log('[AI_DEBUG] User message:', userMessage);
    
    // Mock response for testing based on user input
    // In a real implementation, you would call the LLM API here
    let title = '';
    let date = '';
    let time = '';
    
    // Extract title from user message
    const titleMatch = userMessage.match(/add (a )?task (for |to )?(.*?)( at | on |$)/i);
    if (titleMatch) {
      title = titleMatch[3].trim();
    } else if (userMessage.includes('remind me to')) {
      title = userMessage.replace('remind me to', '').trim();
    } else {
      // Extract the first few words as the title
      title = userMessage.split(' ').slice(0, 3).join(' ');
    }
    
    // Extract date from user message
    const dateMatch = userMessage.match(/(tomorrow|today|yesterday)/i);
    if (dateMatch) {
      const currentDate = new Date();
      if (dateMatch[1] === 'tomorrow') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (dateMatch[1] === 'yesterday') {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      date = currentDate.toISOString().split('T')[0];
    }
    // If no date match, date remains null
    
    // Extract time from user message
    const timeMatch = userMessage.match(/(at )?(\d{1,2}(?:\.\d{2})? ?(?:am|pm|o'clock))/i);
    if (timeMatch) {
      const timeStr = timeMatch[2];
      let hours: number;
      let minutes: number = 0;
      
      const timeParts = timeStr.match(/(\d{1,2})(?:\.(\d{2}))?/);
      if (timeParts) {
        hours = parseInt(timeParts[1]);
        if (timeParts[2]) {
          minutes = parseInt(timeParts[2]);
        }
      } else {
        hours = 0;
      }
      
      if (timeStr.includes('pm') && hours < 12) {
        hours += 12;
      } else if (timeStr.includes('am') && hours === 12) {
        hours = 0;
      }
      
      time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // Default to current time
      const now = new Date();
      time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    const mockResponse = `
      {
        "title": ${JSON.stringify(title)},
        "date": ${date ? JSON.stringify(date) : null},
        "time": ${JSON.stringify(time)}
      }
    `;
    
    return mockResponse;
  };

  // Function to add task to the database with enhanced error handling
  const addTaskToDatabase = async (taskData: TaskData) => {
    console.log('[AI_DEBUG] Adding task to database:', taskData);

    // Validate date presence before API call
    if (!taskData.date) {
      const errorMessage = 'I need to know when you want to schedule this task. Please specify a date.';
      console.log('[AI_DEBUG] Missing date:', errorMessage);
      setConversation((prev) => [...prev, { sender: 'ai', message: errorMessage }]);
      return;
    }

    try {
      // Call the new AI-specific API endpoint
      const response = await fetch('/api/ai-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskData.title,
          date: taskData.date,
          time: taskData.time,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific validation errors from the API
        if (result.error && result.error.includes('Date is required')) {
          const datePrompt = 'Which date should this task be scheduled for? Please provide a date in YYYY-MM-DD format (e.g., 2025-12-26).';
          console.log('[AI_DEBUG] Date validation error:', datePrompt);
          setConversation((prev) => [...prev, { sender: 'ai', message: datePrompt }]);
        } else if (result.error && result.error.includes('Invalid date format')) {
          const formatHelp = 'Please use the correct date format: YYYY-MM-DD (e.g., 2025-12-26 for December 26, 2025).';
          console.log('[AI_DEBUG] Date format error:', formatHelp);
          setConversation((prev) => [...prev, { sender: 'ai', message: formatHelp }]);
        } else {
          throw new Error(result.error || 'Failed to add task');
        }
        return;
      }

      console.log('[AI_DEBUG] Task added to database:', result);

      // Add a confirmation message to the conversation
      const confirmationMessage = taskData.time
        ? `Task "${taskData.title}" scheduled for ${taskData.date} at ${taskData.time}.`
        : `Task "${taskData.title}" scheduled for ${taskData.date}.`;
      setConversation((prev) => [...prev, { sender: 'ai', message: confirmationMessage }]);
    } catch (error) {
      console.error('[AI_DEBUG] Error adding task to database:', error);
      const errorMessage = 'I encountered an error while adding your task. Please check the date format and try again.';
      setConversation((prev) => [...prev, { sender: 'ai', message: errorMessage }]);
    }
  };

  // Parse task from message with manual date parsing and strict date validation
  const parseTaskFromMessage = async (message: string): Promise<TaskData | null> => {
    const taskData: TaskData = {
      title: '',
      description: '',
    };

    // Verbose Debugging: Log the input message
    console.log('[AI_DEBUG] Parsing message:', message);

    // Manual date parsing logic with enhanced validation
    const dateMatch = message.match(/(tomorrow|today|yesterday|\d{1,2}(?:st|nd|rd|th)? (?:January|February|March|April|May|June|July|August|September|October|November|December|january|february|march|april|may|june|july|august|september|october|november|december|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?: \d{4})?(?: at | on |,)?(?:\d{1,2}(?:\.\d{2})? ?(?:am|pm|o'clock))?)/i);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      let dateObj: Date;

      console.log('[AI_DEBUG] Extracted date string:', dateStr);

      if (dateStr === 'tomorrow') {
        dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + 1);
      } else if (dateStr === 'today') {
        dateObj = new Date();
      } else if (dateStr === 'yesterday') {
        dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - 1);
      } else {
        // Parse specific date formats
        // Handle typos and variations in month names
        const monthNames: Record<string, string> = {
          'january': 'January',
          'february': 'February',
          'march': 'March',
          'april': 'April',
          'may': 'May',
          'june': 'June',
          'july': 'July',
          'august': 'August',
          'september': 'September',
          'october': 'October',
          'november': 'November',
          'december': 'December',
          'decmenber': 'December', // Handle typo
          'jan': 'January',
          'feb': 'February',
          'mar': 'March',
          'apr': 'April',
          'jun': 'June',
          'jul': 'July',
          'aug': 'August',
          'sep': 'September',
          'oct': 'October',
          'nov': 'November',
          'dec': 'December',
        };

        // Replace month names with correct capitalization
        const correctedDateStr = dateStr.replace(
          /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|decmenber|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
          (match) => monthNames[match.toLowerCase()] || match
        );

        // Try to parse as standard date first
        dateObj = new Date(correctedDateStr);

        // If failed, try to parse ordinal date manually
        if (isNaN(dateObj.getTime())) {
          const ordinalMatch = correctedDateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)/i);
          if (ordinalMatch) {
            const day = parseInt(ordinalMatch[1]);
            const monthStr = ordinalMatch[2].toLowerCase();
            const monthMap: Record<string, number> = {
              'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
              'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
            };
            const monthIndex = monthMap[monthStr];
            if (monthIndex !== undefined) {
              dateObj = new Date(new Date().getFullYear(), monthIndex, day);
            }
          }
        }
      }

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.log('[AI_DEBUG] Invalid date:', dateStr);
        // Try to parse the date without the year
        const dateWithoutYear = dateStr.replace(/\d{4}/, '').trim();
        dateObj = new Date(dateWithoutYear);
        
        // If still invalid, don't set a default date - let the system prompt the user
        if (isNaN(dateObj.getTime())) {
          console.log('[AI_DEBUG] Invalid date format - will prompt user for valid date');
          // Don't set taskData.date here - let the main flow handle the prompt
          return taskData; // Return early with missing date
        }
      }

      taskData.date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`; // Format as YYYY-MM-DD in local time
      console.log('[AI_DEBUG] Formatted date:', taskData.date);
      
      // Extract time from the date object if time is not explicitly provided
      if (!taskData.time) {
        const timeStr = dateObj.toTimeString().slice(0, 5); // Extracts "HH:MM"
        taskData.time = timeStr;
        console.log('[AI_DEBUG] Extracted time from date object:', taskData.time);
      }
    } else {
      // No date found - this will trigger the date prompt in the main flow
      console.log('[AI_DEBUG] No date found in message - will prompt user for date');
      // Don't set any default date - let the system prompt the user
    }

    // Clean the message by removing date and time
    let cleanedMessage = message;
    if (dateMatch) {
      cleanedMessage = cleanedMessage.replace(dateMatch[1], '').trim();
    }

    // Manual time parsing logic
    const timeMatch = message.match(/(at )?(\d{1,2}(?:\.\d{2})? ?(?:am|pm|o'clock))/i);
    if (timeMatch) {
      const timeStr = timeMatch[2];
      let hours: number;
      let minutes: number = 0;

      console.log('[AI_DEBUG] Extracted time string:', timeStr);

      // Extract hours and minutes
      const timeParts = timeStr.match(/(\d{1,2})(?:\.(\d{2}))?/);
      if (timeParts) {
        hours = parseInt(timeParts[1]);
        if (timeParts[2]) {
          minutes = parseInt(timeParts[2]);
        }
      } else {
        hours = 0;
      }

      // Adjust for AM/PM
      if (timeStr.includes('pm') && hours < 12) {
        hours += 12;
      } else if (timeStr.includes('am') && hours === 12) {
        hours = 0;
      }

      taskData.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; // Format as HH:MM
      console.log('[AI_DEBUG] Formatted time:', taskData.time);

      // Remove time from cleaned message
      cleanedMessage = cleanedMessage.replace(timeMatch[0], '').trim();
    }

    // Extract title from cleaned message
    const titleMatch = cleanedMessage.match(/add (a )?task (for |to )?(.*?)$/i);
    if (titleMatch) {
      taskData.title = titleMatch[3].trim();
      console.log('[AI_DEBUG] Extracted title:', taskData.title);
    } else if (cleanedMessage.includes('remind me to')) {
      taskData.title = cleanedMessage.replace('remind me to', '').trim();
      console.log('[AI_DEBUG] Extracted title from reminder:', taskData.title);
    } else {
      taskData.title = cleanedMessage.trim();
      console.log('[AI_DEBUG] Extracted title as remaining text:', taskData.title);
    }

    // Fast Track Logic: If all fields are present, skip LLM validation
    if (taskData.title && taskData.date && taskData.time) {
      console.log('[AI_DEBUG] Fast Track: All fields present. Skipping LLM conversation.');
      console.log('[AI_DEBUG] Final task data:', taskData);
      return taskData;
    }

    // If we have a title but no date, return partial data
    // The main flow will detect the missing date and prompt the user
    if (taskData.title && !taskData.date) {
      console.log('[AI_DEBUG] Title found but date missing - will prompt user for date');
      return taskData;
    }

    // If we have no title, this isn't a valid task
    if (!taskData.title) {
      console.log('[AI_DEBUG] No valid title found - not a task request');
      return null;
    }

    console.log('[AI_DEBUG] Missing fields in task data:', taskData);
    return taskData;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 3D Avatar */}
      <div
        className={`w-16 h-16 cursor-pointer transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
        onClick={handleAvatarClick}
      >
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <HolographicSphere isActive={isActive} />
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>

      {/* Chat Dialog */}
      <div className="mt-2 transition-all duration-300 ease-in-out">
        <GlassmorphismDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Conversation Display */}
      {isOpen && conversation.length > 0 && (
        <div className="mt-2 w-80 h-60 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-4 overflow-y-auto transition-all duration-300 ease-in-out">
          {conversation.map((item, index) => (
            <div key={index} className={`mb-2 p-2 rounded-md ${item.sender === 'user' ? 'bg-blue-500/20 text-blue-200' : 'bg-gray-500/20 text-gray-200'}`}>
              <strong>{item.sender === 'user' ? 'You' : 'AI'}:</strong> {item.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};