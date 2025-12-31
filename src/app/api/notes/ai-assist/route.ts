import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

// POST /api/notes/ai-assist - AI copilot features for notes
export async function POST(request: NextRequest) {
  try {
    console.log('[AI_ASSIST] === STARTING REQUEST ===');
    
    const { userId } = await auth();
    console.log('[AI_ASSIST] User ID:', userId);
    
    if (!userId) {
      console.log('[AI_ASSIST] Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('[AI_ASSIST] Request body:', requestBody);
    
    const { action, content, selectedText = '', noteId, title = '', rawText = '' } = requestBody;

    // CRITICAL FIX: Ensure content is always a valid string
    // Handle null/undefined values from client-side state initialization issues
    const safeContent = content || '';
    const safeRawText = rawText || '';
    const safeSelectedText = selectedText || '';
    
    console.log('[AI_ASSIST] === COMPREHENSIVE DEBUG ===');
    console.log('[AI_ASSIST] Request validation:', {
      action,
      originalContent: content,
      originalContentType: typeof content,
      originalContentNull: content === null,
      originalContentUndefined: content === undefined,
      safeContent,
      safeContentType: typeof safeContent,
      safeContentLength: safeContent.length,
      title,
      titleLength: title?.length || 0,
      noteId,
      timestamp: new Date().toISOString()
    });

    // Debug logging
    console.log('=== AI ASSIST DEBUG ===');
    console.log('Action:', action);
    console.log('Safe Content length:', safeContent?.length || 0);
    console.log('Safe RawText length:', safeRawText?.length || 0);
    console.log('Content preview:', safeContent?.substring(0, 100) + '...');
    console.log('RawText preview:', safeRawText?.substring(0, 100) + '...');
    
    // Validation - for most actions, content is required unless it's generate_content_from_title
    if (!action) {
      console.log('[AI_ASSIST] Missing action');
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    // CRITICAL FIX: Only require content for actions that actually need it
    // generate_content_from_title doesn't need content since it generates from title alone
    if (action !== 'refactor_note' && action !== 'generate_content_from_title' && !safeContent) {
      console.log('[AI_ASSIST] Missing content for action:', action);
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    if (action === 'refactor_note' && !safeRawText && !safeContent) {
      console.log('[AI_ASSIST] Missing content and rawText for refactor_note');
      return NextResponse.json({ error: 'Content or rawText is required for refactoring' }, { status: 400 });
    }

    console.log('[AI_ASSIST] ✅ VALIDATION PASSED');
    console.log('[AI_ASSIST] Ready to process action:', action, 'with safeContent length:', safeContent.length);

    let result = '';
    console.log('[AI_ASSIST] Processing action:', action);

    switch (action) {
      case 'fix_grammar':
        result = await fixGrammar(safeSelectedText || safeContent);
        break;
      
      case 'generate_code':
        result = await generateCode(safeSelectedText || safeContent);
        break;
      
      case 'summarize':
        result = await summarizeContent(safeContent);
        break;
      
      case 'generate_content_from_title':
        console.log('[AI_ASSIST] 🔄 Processing generate_content_from_title');
        console.log('[AI_ASSIST] Title received:', JSON.stringify(title));
        console.log('[AI_ASSIST] Title type:', typeof title);
        console.log('[AI_ASSIST] Title length:', title?.length || 0);
        console.log('[AI_ASSIST] Safe content (should be empty):', JSON.stringify(safeContent));
        
        result = await generateContentFromTitle(title);
        
        console.log('[AI_ASSIST] ✅ generateContentFromTitle completed');
        console.log('[AI_ASSIST] Generated result length:', result?.length || 0);
        console.log('[AI_ASSIST] Generated result preview:', result?.substring(0, 100) + '...');
        break;
      
      case 'refactor_note':
        result = await refactorNote(safeRawText || safeContent);
        break;
      
      default:
        console.log('[AI_ASSIST] Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log('[AI_ASSIST] Action completed successfully, result length:', result.length);

    // If noteId is provided, we could optionally save the AI result to the database
    if (noteId && (action === 'summarize')) {
      // Add summary to the top of the note content
      const updatedContent = `${result}\n\n---\n\n${safeContent}`;
      
      await sql`
        UPDATE notes 
        SET content = ${updatedContent}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${noteId} AND user_id = ${userId}
      `;
    }

    const response = NextResponse.json({ result, action });
    console.log('[AI_ASSIST] === REQUEST COMPLETED SUCCESSFULLY ===');
    return response;
  } catch (error) {
    console.error('[AI_ASSIST] === ERROR OCCURRED ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Simple grammar fixing function
async function fixGrammar(text: string): Promise<string> {
  // This is a simplified implementation
  // In a real app, you'd integrate with a proper grammar checking API
  
  let fixed = text;
  
  // Basic fixes
  fixed = fixed.replace(/\bim\b/gi, "I'm");
  fixed = fixed.replace(/\bdont\b/gi, "don't");
  fixed = fixed.replace(/\bcant\b/gi, "can't");
  fixed = fixed.replace(/\bwont\b/gi, "won't");
  fixed = fixed.replace(/\bit\s+is\b/gi, "it's");
  fixed = fixed.replace(/\byour\s+are\b/gi, "you're");
  
  // Capitalize first letter of sentences
  fixed = fixed.replace(/(^|[.!?]\s+)(\w)/g, (match, start, letter) => {
    return start + letter.toUpperCase();
  });
  
  // Add period at end if missing
  if (!fixed.match(/[.!?]$/)) {
    fixed += '.';
  }
  
  return fixed;
}

// Code generation function
async function generateCode(request: string): Promise<string> {
  // This is a simplified implementation
  // In a real app, you'd integrate with an AI code generation API
  
  const lowerRequest = request.toLowerCase();
  
  if (lowerRequest.includes('sort') && lowerRequest.includes('array')) {
    return '```javascript\n// Sort array in ascending order\nfunction sortArray(arr: number[]) {\n  return arr.sort((a: number, b: number) => a - b);\n}\n\n// Example usage\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconst sorted = sortArray(numbers);\nconsole.log(sorted); // [11, 12, 22, 25, 34, 64, 90]\n```';
  }
  
  if (lowerRequest.includes('filter') && lowerRequest.includes('array')) {
    return '```javascript\n// Filter array elements\nfunction filterArray<T>(arr: T[], condition: (item: T) => boolean): T[] {\n  return arr.filter(condition);\n}\n\n// Example usage\nconst numbers = [1, 2, 3, 4, 5, 6];\nconst evenNumbers = filterArray(numbers, (num: number) => num % 2 === 0);\nconsole.log(evenNumbers); // [2, 4, 6]\n```';
  }
  
  if (lowerRequest.includes('map') && lowerRequest.includes('array')) {
    return '```javascript\n// Map array elements\nfunction mapArray<T, U>(arr: T[], transform: (item: T) => U): U[] {\n  return arr.map(transform);\n}\n\n// Example usage\nconst numbers = [1, 2, 3, 4, 5];\nconst doubled = mapArray(numbers, (num: number) => num * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]\n```';
  }
  
  if (lowerRequest.includes('fetch') && lowerRequest.includes('api')) {
    return '```javascript\n// Fetch data from API\nasync function fetchData(url: string): Promise<any> {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) {\n      throw new Error(\'Network response was not ok\');\n    }\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Error fetching data:\', error);\n    throw error;\n  }\n}\n\n// Example usage\nfetchData(\'https://api.example.com/data\')\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n```';
  }
  
  // Default response
  const functionName = request.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'example';
  return '```javascript\n// ' + request + '\n// Here\'s a basic implementation\n\nfunction ' + functionName + '() {\n  // Your code here\n  console.log(\'Hello, World!\');\n}\n\n// Call the function\n' + functionName + '();\n```';
}

// Content summarization function
async function summarizeContent(content: string): Promise<string> {
  // This is a simplified implementation
  // In a real app, you'd integrate with a proper summarization API
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length <= 3) {
    return `**TL;DR:** ${content}`;
  }
  
  // Simple extractive summarization - take first few sentences
  const summarySentences = sentences.slice(0, Math.min(2, sentences.length));
  const summary = summarySentences.join('. ') + '.';
  
  return `**TL;DR:** ${summary}`;
}

// Content generation from title function
async function generateContentFromTitle(title: string): Promise<string> {
  console.log('[AI_GENERATE] generateContentFromTitle called with:', title);
  
  // This is a simplified implementation
  // In a real app, you'd integrate with a proper AI content generation API
  
  if (!title || title.trim().length === 0) {
    console.log('[AI_GENERATE] No title provided');
    return 'Please provide a title to generate content.';
  }

  const cleanTitle = title.trim();
  console.log('[AI_GENERATE] Clean title:', cleanTitle);
  const lowerTitle = cleanTitle.toLowerCase();
  
  try {
    // Java programming
    if (lowerTitle.includes('java') && lowerTitle.includes('sort')) {
      return `# ${cleanTitle}

## Overview
This Java program demonstrates how to sort an array using different sorting algorithms.

## Implementation

\`\`\`java
import java.util.Arrays;

public class ArraySorter {
    public static void main(String[] args) {
        int[] numbers = {64, 34, 25, 12, 22, 11, 90};
        
        System.out.println("Original array: " + Arrays.toString(numbers));
        
        // Using built-in sort
        Arrays.sort(numbers);
        System.out.println("Sorted array: " + Arrays.toString(numbers));
    }
}
\`\`\`

## Key Points
- \`Arrays.sort()\` uses a dual-pivot quicksort algorithm
- Time complexity: O(n log n) average case
- In-place sorting

## Usage
Compile and run the program to see the sorting in action.`;
    }
    
    // JavaScript/React
    if ((lowerTitle.includes('react') || lowerTitle.includes('javascript')) && lowerTitle.includes('component')) {
      return `# ${cleanTitle}

## Overview
This React component demonstrates best practices for building reusable UI components.

## Implementation

\`\`\`jsx
import React, { useState, useEffect } from 'react';

const MyComponent = ({ title, children }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Component logic here
  }, []);
  
  return (
    <div className="component-wrapper">
      <h1>{title}</h1>
      {children}
    </div>
  );
};

export default MyComponent;
\`\`\`

## Key Concepts
- Functional components with hooks
- Props and children
- State management
- Effect hooks for lifecycle methods

## Best Practices
- Use descriptive prop names
- Keep components focused and reusable
- Handle loading and error states`;
    }
    
    // Python
    if (lowerTitle.includes('python') && (lowerTitle.includes('function') || lowerTitle.includes('script'))) {
      return `# ${cleanTitle}

## Overview
This Python script demonstrates clean code practices and proper function structure.

## Implementation

\`\`\`python
def main():
    """Main function to orchestrate the program."""
    data = get_user_input()
    processed_data = process_data(data)
    display_results(processed_data)

def get_user_input():
    """Collect input from user."""
    return input("Enter data: ")

def process_data(data):
    """Process the input data."""
    return data.upper()

def display_results(data):
    """Show the processed results."""
    print(f"Result: {data}")

if __name__ == "__main__":
    main()
\`\`\`

## Key Features
- Modular function design
- Clear documentation
- Proper error handling
- Main execution guard`;
    }
    
    // API/Tutorial content
    if (lowerTitle.includes('api') || lowerTitle.includes('tutorial') || lowerTitle.includes('guide')) {
      return `# ${cleanTitle}

## Introduction
This guide provides a comprehensive overview of ${lowerTitle}.

## Prerequisites
- Basic understanding of the topic
- Required tools or software installed
- Development environment setup

## Step-by-Step Process

### Step 1: Setup
Begin by setting up your environment and understanding the requirements.

### Step 2: Implementation
Follow the implementation guidelines with code examples.

### Step 3: Testing
Ensure everything works correctly with proper testing.

### Step 4: Deployment
Deploy your solution following best practices.

## Best Practices
- Write clean, maintainable code
- Include proper documentation
- Test thoroughly
- Consider security implications

## Conclusion
This ${lowerTitle} provides a solid foundation for your project. Remember to iterate and improve based on feedback.`;
    }
    
    // Default content generation
    const topic = cleanTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    return `# ${cleanTitle}

## Overview
This document covers ${topic.toLowerCase()} and provides practical insights.

## Key Concepts
- Understanding the fundamentals
- Best practices and common patterns
- Real-world applications

## Implementation Guide

### Getting Started
1. Set up your development environment
2. Understand the requirements
3. Plan your approach

### Core Implementation
- Follow established patterns
- Write clean, maintainable code
- Include proper error handling

### Testing & Validation
- Write comprehensive tests
- Validate against requirements
- Perform user acceptance testing

## Tips & Best Practices
- Start with a simple implementation
- Iterate based on feedback
- Document your decisions
- Consider scalability

## Conclusion
This ${topic.toLowerCase()} serves as a starting point. Continue learning and improving your skills.`;
  } catch (error) {
    console.error('[AI_GENERATE] Error in generateContentFromTitle:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Note refactoring function - Chaos to Clarity
async function refactorNote(rawText: string): Promise<string> {
  console.log('=== REFACTOR NOTE DEBUG ===');
  console.log('RawText received:', rawText);
  console.log('RawText length:', rawText?.length || 0);
  console.log('RawText type:', typeof rawText);
  
  // This is a simplified implementation
  // In a real app, you'd integrate with a proper AI refactoring API
  
  if (!rawText || rawText.trim().length === 0) {
    console.log('No content to refactor - returning error message');
    return 'No content to refactor.';
  }

  console.log('Starting refactoring process...');
  
  // Clean and structure the raw text
  let cleaned = rawText.trim();
  console.log('Cleaned text length:', cleaned.length);
  console.log('Cleaned text preview:', cleaned.substring(0, 100) + '...');
  
  // Basic text cleaning and structuring
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n'); // Normalize line breaks
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '• '); // Convert bullets to consistent format
  
  // Split into sentences and analyze content
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = cleaned.split(/\s+/);
  
  // Determine content type and structure accordingly
  const isCodeRelated = /\b(function|class|var|let|const|import|export|if|for|while|return)\b/i.test(cleaned);
  const isListHeavy = (cleaned.match(/^\s*[-*+]\s+/gm) || []).length > 2;
  const hasTechnicalTerms = /\b(API|database|server|client|framework|library|function|method|variable|constant)\b/i.test(cleaned);
  
  let structured = '';
  
  if (isCodeRelated) {
    // Code-focused restructuring
    structured = `# Technical Implementation\n\n`;
    structured += `## Overview\n${sentences[0] || 'Technical implementation details.'}\n\n`;
    
    if (sentences.length > 1) {
      structured += `## Key Points\n`;
      sentences.slice(1, Math.min(4, sentences.length)).forEach((sentence, index) => {
        structured += `- ${sentence.trim()}\n`;
      });
      structured += `\n`;
    }
    
    // Look for code patterns and format them
    const codeMatches = cleaned.match(/```[\s\S]*?```/g);
    if (codeMatches) {
      structured += `## Code Examples\n\n`;
      codeMatches.forEach(code => {
        structured += `${code}\n\n`;
      });
    }
    
    // Extract any technical terms as tags
    const techTerms = Array.from(new Set(cleaned.match(/\b(JavaScript|TypeScript|React|Node\.js|Python|Java|SQL|MongoDB|API|REST|GraphQL|AWS|Docker|Kubernetes)\b/gi) || []));
    if (techTerms.length > 0) {
      structured += `## Tags\n${techTerms.map(term => `- ${term}`).join('\n')}\n`;
    }
    
  } else if (isListHeavy) {
    // List-heavy content restructuring
    const lines = cleaned.split('\n').filter(line => line.trim());
    const title = lines[0] || 'Structured Note';
    
    structured = `# ${title}\n\n`;
    structured += `## Summary\n${sentences[0] || 'Organized information and key points.'}\n\n`;
    
    // Process list items
    const listItems = lines.filter(line => /^\s*[-*+]\s+/.test(line));
    if (listItems.length > 0) {
      structured += `## Key Points\n`;
      listItems.forEach(item => {
        structured += `- ${item.replace(/^\s*[-*+]\s+/, '').trim()}\n`;
      });
      structured += `\n`;
    }
    
    // Add remaining content as details
    const remainingLines = lines.filter(line => !/^\s*[-*+]\s+/.test(line) && line !== title);
    if (remainingLines.length > 0) {
      structured += `## Details\n${remainingLines.join('\n')}\n`;
    }
    
  } else if (hasTechnicalTerms) {
    // Technical documentation style
    structured = `# Technical Documentation\n\n`;
    structured += `## Overview\n${sentences[0] || 'Technical documentation and implementation guide.'}\n\n`;
    
    if (sentences.length > 1) {
      structured += `## Implementation\n`;
      sentences.slice(1, Math.min(5, sentences.length)).forEach(sentence => {
        structured += `1. ${sentence.trim()}\n`;
      });
      structured += `\n`;
    }
    
    // Check for specific technical patterns
    if (/\b(setup|install|configure|deploy)\b/i.test(cleaned)) {
      structured += `## Setup Instructions\n`;
      const setupSteps = sentences.filter(s => /\b(setup|install|configure|deploy|run|execute)\b/i.test(s));
      setupSteps.forEach((step, index) => {
        structured += `${index + 1}. ${step.trim()}\n`;
      });
      structured += `\n`;
    }
    
  } else {
    // General content restructuring
    const title = sentences[0] || 'Organized Note';
    structured = `# ${title}\n\n`;
    
    if (sentences.length > 1) {
      structured += `## Summary\n${sentences.slice(1, 3).join('. ')}.\n\n`;
    }
    
    // Group remaining content into logical sections
    const remainingSentences = sentences.slice(3);
    if (remainingSentences.length > 0) {
      structured += `## Details\n`;
      remainingSentences.forEach(sentence => {
        if (sentence.trim().length > 10) {
          structured += `- ${sentence.trim()}\n`;
        }
      });
      structured += `\n`;
    }
  }
  
  // Add final suggestions section
  structured += `---\n\n## Quick Actions\n- [ ] Review and validate content\n- [ ] Add relevant tags\n- [ ] Share or export note\n`;
  
  // Suggest tags based on content analysis
  const suggestedTags = [];
  if (isCodeRelated) suggestedTags.push('code', 'implementation');
  if (hasTechnicalTerms) suggestedTags.push('technical', 'documentation');
  if (isListHeavy) suggestedTags.push('checklist', 'organized');
  if (/\b(todo|task|reminder|deadline)\b/i.test(cleaned)) suggestedTags.push('todo');
  if (/\b(idea|thought|concept|brainstorm)\b/i.test(cleaned)) suggestedTags.push('ideas');
  
  // Add suggested tags
  if (suggestedTags.length > 0) {
    structured += `\n### Suggested Tags\n${suggestedTags.map(tag => `#${tag}`).join(' ')}`;
  }
  
  console.log('=== REFACTOR RESULT ===');
  console.log('Structured result length:', structured.length);
  console.log('Structured result preview:', structured.substring(0, 200) + '...');
  
  return structured;
}