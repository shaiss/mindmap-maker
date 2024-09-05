import { NextApiRequest, NextApiResponse } from 'next';

interface MindMapNode {
  id: string;
  content: string;
  priority: 'A' | 'B' | 'C';
  children: MindMapNode[];
}

let mindMap: MindMapNode = {
  id: 'root',
  content: 'Weekly Tasks',
  priority: 'A',
  children: [
    {
      id: '1',
      content: 'Task 1',
      priority: 'A',
      children: []
    },
    {
      id: '2',
      content: 'Task 2',
      priority: 'B',
      children: []
    }
  ]
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(mindMap);
  } else if (req.method === 'POST') {
    mindMap = req.body;
    res.status(200).json({ message: 'Mind map updated successfully' });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}