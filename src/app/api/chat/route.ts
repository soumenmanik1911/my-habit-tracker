import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // System Prompt for "DevLife" Persona
    const systemMessage = {
      role: "system",
      content: "You are DevLife, a smart productivity companion for an engineering student. You help with coding, study schedules, and habit tracking. Keep responses concise (under 3 sentences) unless asked for details. Be motivating."
    };

    const completion = await groq.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content || "I'm having trouble thinking right now.";
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}