'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

type Message = { role: 'user' | 'assistant'; content: string };

// 3D Robot Component
const Robot = () => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group position={[0, 0, 0]}>
        {/* Head */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#4fd1c7" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 2, 1]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.3, 1.7, 0.4]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.3, 1.7, 0.4]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Arms */}
        <mesh position={[2, 0.5, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color="#60a5fa" metalness={0.2} roughness={0.7} />
        </mesh>
        <mesh position={[-2, 0.5, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color="#60a5fa" metalness={0.2} roughness={0.7} />
        </mesh>
      </group>
    </Float>
  );
};

// 3D Scene Component
const Scene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Robot />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm DevLife. Ready to grind? 🚀" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is only supported in Chrome/Edge.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* Glassmorphism Chat UI */}
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto p-4">
        {/* Header */}
        <header className="p-4 border-b border-gray-800 flex items-center gap-3 bg-gray-900/50 backdrop-blur-lg rounded-xl mb-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="p-2 bg-blue-600 rounded-lg"><Bot size={24} /></div>
          <div>
            <h1 className="font-bold text-lg text-cyan-400">DevLife Agent</h1>
            <p className="text-xs text-green-400">● Online (Groq Llama 3)</p>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black/50 backdrop-blur-lg rounded-xl border border-gray-800">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600/80 text-white rounded-br-none backdrop-blur-sm' 
                  : 'bg-gray-800/80 text-gray-200 rounded-bl-none backdrop-blur-sm'
              }`}>
                <p className="font-mono text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-cyan-400 text-sm ml-4">
              <Loader2 className="animate-spin h-4 w-4" /> 
              <span className="font-mono">Thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/50 backdrop-blur-lg rounded-xl border border-gray-800 mt-4">
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={toggleVoice}
              className={isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-gray-800 hover:bg-gray-700"}
            >
              <Mic className="h-5 w-5 text-white" />
            </Button>
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="bg-gray-900/80 border-gray-700 text-white focus-visible:ring-cyan-400 font-mono"
            />
            <Button onClick={handleSend} className="bg-cyan-500 hover:bg-cyan-600">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}