import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatInterfaceProps {
  mindMap: MindMapNode | null;
  updateMindMap: (newMindMap: MindMapNode) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mindMap, updateMindMap }) => {
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mindMap }),
      });
      const data = await response.json();
      setAiResponse(data.response);
      setSuggestions(data.suggestions);
      
      // Add this console log to check the received mindMapData
      console.log('Received mindMapData:', data.mindMapData);

      // Ensure mindMapData is not undefined before updating
      if (data.mindMapData) {
        updateMindMap(data.mindMapData);
      } else {
        console.error('Received undefined mindMapData from AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setMessage('');
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-grow overflow-hidden">
        <CardHeader>
          <CardTitle>AI Chat</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <ScrollArea className="h-[calc(100%-4rem)] pr-4">
            {aiResponse && (
              <div className="mb-4">
                <h3 className="font-bold">AI Response:</h3>
                <p className="whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
            {suggestions.length > 0 && (
              <div>
                <h3 className="font-bold">Suggestions:</h3>
                <ul className="list-disc pl-5">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <span className="font-semibold">{suggestion.action}</span>
                      {suggestion.id && ` (ID: ${suggestion.id})`}
                      {suggestion.content && `: ${suggestion.content}`}
                      {suggestion.priority && ` (Priority: ${suggestion.priority})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <form onSubmit={handleSubmit} className="mt-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="mb-2"
        />
        <Button type="submit" className="w-full">Send</Button>
      </form>
    </div>
  );
};

export default ChatInterface;