import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant helping to create and modify mind maps. 
Your responses should be in the following format:
1. A brief textual response to the user's query.
2. A mermaid diagram representing the mind map.
3. A list of suggested changes to the mind map, if any.

Each suggestion should be in the format:
- action: 'add' | 'update' | 'delete'
- id: string (for update and delete actions)
- content: string (for add and update actions)
- priority: 'A' | 'B' | 'C' (for add and update actions)`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { message, mindMap } = req.body;
      console.log('Received message:', message);
      console.log('Current mind map:', mindMap);
      console.log('API Key:', process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing');

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Current mind map: ${JSON.stringify(mindMap)}
User message: ${message}
Please provide a response, updated mermaid diagram, and any suggested changes to the mind map.`
          }
        ]
      });

      console.log('AI response:', response.content);

      // Parse the AI response
      const textResponse = response.content[0].text;
      const mermaidMatch = textResponse.match(/```mermaid([\s\S]*?)```/);
      const mermaidDiagram = mermaidMatch ? mermaidMatch[1].trim() : '';
      const suggestionsMatch = textResponse.match(/Suggested changes:([\s\S]*?)$/);
      const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : '';

      console.log('Mermaid diagram:', mermaidDiagram);

      const suggestions = parseSuggestions(suggestionsText);
      const mindMapData = convertMermaidToMindMap(mermaidDiagram);

      console.log('Parsed mind map data:', JSON.stringify(mindMapData, null, 2));

      // Extract the text response without the mermaid diagram and suggestions
      const cleanResponse = textResponse
        .replace(/```mermaid[\s\S]*?```/, '')
        .replace(/Suggested changes:[\s\S]*$/, '')
        .trim();

      // Add this console log to check the parsed AI response
      console.log('Parsed AI response:', { response: cleanResponse, mindMapData, suggestions });

      res.status(200).json({ 
        response: cleanResponse,
        mindMapData,
        suggestions
      });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function convertMermaidToMindMap(mermaidDiagram: string | undefined): MindMapNode {
  if (!mermaidDiagram) {
    return {
      id: '0',
      content: 'Root',
      priority: 'A',
      children: []
    };
  }

  const lines = mermaidDiagram.split('\n');
  const rootNode: MindMapNode = {
    id: '0',
    content: lines[0].replace('mindmap', '').trim() || 'Web3 History',
    priority: 'A',
    children: []
  };

  const nodeMap = new Map<string, MindMapNode>();
  nodeMap.set('0', rootNode);

  let currentParent = rootNode;
  let currentIndentation = 0;

  lines.slice(1).forEach((line) => {
    const indentation = line.search(/\S/);
    const content = line.trim();

    if (content) {
      if (indentation === currentIndentation) {
        // Sibling node
        const newNode: MindMapNode = {
          id: `${currentParent.id}_${currentParent.children.length}`,
          content,
          priority: 'B',
          children: []
        };
        currentParent.children.push(newNode);
        nodeMap.set(newNode.id, newNode);
      } else if (indentation > currentIndentation) {
        // Child node
        const parentNode = currentParent.children[currentParent.children.length - 1] || currentParent;
        const newNode: MindMapNode = {
          id: `${parentNode.id}_${parentNode.children.length}`,
          content,
          priority: 'C',
          children: []
        };
        parentNode.children.push(newNode);
        nodeMap.set(newNode.id, newNode);
        currentParent = parentNode;
        currentIndentation = indentation;
      } else {
        // Go back up the tree
        while (indentation < currentIndentation && currentParent.id !== '0') {
          const parentId = currentParent.id.split('_').slice(0, -1).join('_');
          currentParent = nodeMap.get(parentId) || rootNode;
          currentIndentation -= 2;
        }
        const newNode: MindMapNode = {
          id: `${currentParent.id}_${currentParent.children.length}`,
          content,
          priority: 'B',
          children: []
        };
        currentParent.children.push(newNode);
        nodeMap.set(newNode.id, newNode);
      }
    }
  });

  return rootNode;
}

function parseSuggestions(suggestionsText: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lines = suggestionsText.split('\n');

  lines.forEach((line) => {
    const match = line.match(/- (\w+):\s*(?:id: (\w+),?\s*)?(?:content: ([^,]+),?\s*)?(?:priority: ([ABC]))?/);
    if (match) {
      const [, action, id, content, priority] = match;
      suggestions.push({ 
        action: action as 'add' | 'update' | 'delete', 
        id: id || '', 
        content: content?.trim(), 
        priority: priority as 'A' | 'B' | 'C' | undefined
      });
    }
  });

  return suggestions;
}

// Add these interfaces at the top of the file
interface MindMapNode {
  id: string;
  content: string;
  priority: 'A' | 'B' | 'C';
  children: MindMapNode[];
}

interface Suggestion {
  action: 'add' | 'update' | 'delete';
  id: string;
  content?: string;
  priority?: 'A' | 'B' | 'C';
}