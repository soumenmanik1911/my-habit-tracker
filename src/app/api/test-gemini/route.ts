import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const testPrompt = 'Hello';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('Gemini test response:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error testing Gemini:', error);
    return NextResponse.json({ error: 'Failed to test Gemini API' }, { status: 500 });
  }
}