'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Mic, Plus, Search, SendHorizontal, Home } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplianceCard, VideoCard } from "../components/ContentCards";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('Gauss');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await generateBotResponse(inputMessage);
      
      const botMessage = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBotResponse = async (message) => {
    const GEMINI_API_KEY = 'AIzaSyBbbkbGOCylzw9Kgt9y8SqNvdQoO0wCb9Q'; // Replace with your actual key
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // Structured prompt to analyze user needs and format response
    const prompt = `
      Analyze the following user message and respond appropriately:
      "${message}"

      Instructions:
      1. First, determine if the user is expressing any needs, problems, or lifestyle requirements that could be addressed by home appliances.
      2. If YES, analyze if a Samsung appliance or SmartThings integration could help them.
      3. Format your response as a JSON object with the following structure:

      {
        "needsAppliance": boolean,
        "text": "Your natural conversational response",
        "content": [
          {
            "type": "appliance" or "video",
            "data": {
              // appliance or video details
            }
          }
        ]
      }

      Rules:
      - Only include "content" array if you're recommending Samsung appliances or SmartThings
      - Keep your text response natural and conversational
      - For appliances, only recommend Samsung products
      - For videos, focus on SmartThings integration and usage
      - If the user's query doesn't relate to home appliances or automation, just return a simple response with needsAppliance: false

      Example responses:

      For non-appliance queries:
      {
        "needsAppliance": false,
        "text": "Your helpful response..."
      }

      For appliance-related queries:
      {
        "needsAppliance": true,
        "text": "Your helpful response...",
        "content": [
          {
            "type": "appliance",
            "data": {
              "name": "Samsung Product Name",
              "brand": "Samsung",
              "price": price,
              "features": ["feature1", "feature2", ...]
            }
          },
          {
            "type": "video",
            "data": {
              "title": "Video Title",
              "channel": "Channel Name",
              "description": "Video description"
            }
          }
        ]
      }
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await response.json();
      let parsedResponse;
      
      try {
        // Try to parse the response as JSON
        parsedResponse = JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (parseError) {
        // If parsing fails, return a simple text response
        return {
          needsAppliance: false,
          text: data.candidates[0].content.parts[0].text
        };
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCategoryClick = (category) => {
    let prompt = '';
    
    switch (category) {
      case 'Interior Design':
        prompt = 'I need help with interior design ideas for my home. I want to create a modern and comfortable living space with smart home integration.';
        break;
      case 'Exercise Ideas':
        prompt = 'I want to set up a smart home gym and would love recommendations for equipment and devices that can track my fitness progress.';
        break;
      case 'Appliances':
        prompt = 'I need recommendations for home appliances that would fit my lifestyle. I want to focus on energy efficiency and smart features.';
        break;
      case 'Hosting a Party':
        prompt = 'I want to upgrade my home entertainment setup for hosting parties. Looking for smart appliances and devices that can help create the perfect atmosphere.';
        break;
      case 'Creativity':
        prompt = 'I want to make my home more conducive to creative activities. What smart solutions can help me set up an inspiring environment?';
        break;
      case 'Save on Bills':
        prompt = 'I want to reduce my utility bills. What smart home appliances and automation can help me save energy and money?';
        break;
      default:
        prompt = 'How can smart home technology improve my daily life?';
    }
    
    setInputMessage(prompt);
    // Automatically send the message after setting it
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Model selector */}
      <div className="w-full border-b">
        <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <Home className="h-5 w-5" />
                Home
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-lg gap-2">
                  {selectedModel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedModel('Gauss')}>Gauss</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel('LoRA')}>LoRA</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedModel('HomeAI')}>HomeAI</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl space-y-8">
              <div className="text-center space-y-6 py-12">
                <h1 className="text-4xl font-bold tracking-tight">How can we help improve your quality of life?</h1>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
            <div className="p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-2xl p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {typeof message.content === 'string' 
                      ? message.content 
                      : (
                        <div className="space-y-4">
                          <p>{message.content.text}</p>
                          {message.content.content && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {message.content.content.map((item, idx) => (
                                <div key={idx}>
                                  {item.type === 'appliance' && <ApplianceCard appliance={item.data} />}
                                  {item.type === 'video' && <VideoCard video={item.data} />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Input area */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <Button variant="ghost" size="icon" className="absolute left-2">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute left-12">
                <Search className="h-5 w-5" />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-24 pr-12 py-6 text-lg rounded-2xl"
                placeholder="Message..."
              />
              {inputMessage.trim() ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="absolute right-2">
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {["Interior Design", "Exercise Ideas", "Appliances", "Hosting a Party", "Creativity", "Save on Bills"].map(
                (category) => (
                  <Button
                    key={category}
                    variant="outline"
                    className="rounded-full hover:bg-muted"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full border-t">
        <div className="max-w-3xl mx-auto p-4">
          <p className="text-center text-sm text-muted-foreground">
            This is just a concept page. I&apos;m not selling anything.
          </p>
        </div>
      </div>
    </div>
  );
}