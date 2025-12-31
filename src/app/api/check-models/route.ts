import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "❌ API KEY MISSING in .env.local" }, { status: 500 });
  }

  try {
    // Ask Google for the list of models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    // Filter to show only "generateContent" models
    const availableModels = data.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m: any) => m.name);

    return NextResponse.json({ 
      status: "SUCCESS", 
      YOUR_VALID_MODELS: availableModels || data 
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}