import React, { useState } from 'react';
import { Send } from 'lucide-react';

const PERPLEXITY_API_KEY = "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";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatProps {
  courseId: string;
  lectureId?: string;
}

export function Chat({ courseId, lectureId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const getChromaResults = async (chroma_input: string) => {
    // THIS IS A PLACEHOLDER FUNCTION, NEEDS TO BE INTEGRATED 
    // WITH CHROMA DB/API
    console.log(chroma_input);
    chroma_input = chroma_input.replace(/ /g, '+');
    return "no information so far";
  }

  const getVLMresults = async (vlm_input: string) => {
    // THIS IS A PLACEHOLDER FUNCTION, NEEDS TO BE INTEGRATED 
    // WITH VLM API
    vlm_input = vlm_input.replace(/ /g, '+');
    console.log(vlm_input);
    return "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC";
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      
    };

    const chroma_db_results = await getChromaResults(input);
    const vlmImage = await getVLMresults(input);

    setMessages([...messages, userMessage]);
    setInput('');
    console.log(input);

    // Simulate AI response
    setTimeout(() => {

      const options = {
        method: 'POST',
        headers: {Authorization: 'Bearer ' + PERPLEXITY_API_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-chat',
          messages: [
            {role: 'system', content: [
              {'type': 'text', 'text': 'Be precise and concise. You have both some context and an image to create your response.'},
              {'type': 'text', 'text': 'Use this prior knowledge to answer the question' + chroma_db_results},
              {'type': 'image', 'image':  vlmImage},
            ]},
            {role: 'user', content: input},
          ],
          max_tokens: 123,
          temperature: 0.2,
          top_p: 0.9,
          search_domain_filter: null,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: '<string>',
          top_k: 0,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1,
          response_format: null,
        }),
      };
      
      fetch('https://api.perplexity.ai/chat/completions', options)
        .then(response => response.json())
        .then((response) => {
          const AIRespone = response.choices[0].message.content;
          console.log('AI Response:', AIRespone);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: AIRespone,
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        })
        .catch(err => console.error(err));
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white/90'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-white hover:from-violet-700 hover:to-indigo-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
