import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RotateCcw } from "lucide-react";

const Tree = dynamic(() => import('react-organizational-chart').then((mod) => mod.Tree), { ssr: false });
const TreeNode = dynamic(() => import('react-organizational-chart').then((mod) => mod.TreeNode), { ssr: false });

interface MindMapNode {
  id: string;
  content: string;
  priority: 'A' | 'B' | 'C';
  children: MindMapNode[];
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
}

interface MindMapProps {
  mindMap: MindMapNode | null;
  updateMindMap: (newMindMap: MindMapNode) => void;
}

const MindMap: React.FC<MindMapProps> = ({ mindMap, updateMindMap }) => {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'A' | 'B' | 'C'>('A');

  const startEditing = (node: MindMapNode) => {
    setEditingNode(node.id);
    setEditContent(node.content);
    setEditPriority(node.priority);
  };

  const saveEdit = () => {
    if (!mindMap || !editingNode) return;

    const updatedMindMap = JSON.parse(JSON.stringify(mindMap));
    const nodeToUpdate = findNode(updatedMindMap, editingNode);
    if (nodeToUpdate) {
      nodeToUpdate.content = editContent;
      nodeToUpdate.priority = editPriority;
      nodeToUpdate.isUpdated = true;
    }

    updateMindMap(updatedMindMap);
    setEditingNode(null);
  };

  const toggleDeleteNode = (nodeId: string) => {
    if (!mindMap) return;

    const updatedMindMap = JSON.parse(JSON.stringify(mindMap));
    const toggleDeleteRecursive = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.isDeleted = !node.isDeleted;
        return true;
      }
      for (const child of node.children) {
        if (toggleDeleteRecursive(child)) return true;
      }
      return false;
    };

    toggleDeleteRecursive(updatedMindMap);
    updateMindMap(updatedMindMap);
  };

  const findNode = (node: MindMapNode, id: string): MindMapNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const renderTreeNodes = (node: MindMapNode) => (
    <TreeNode
      label={
        <Card className={`p-2 ${getPriorityColor(node.priority)} ${getHighlightColor(node)}`}>
          {editingNode === node.id ? (
            <div className="flex flex-col space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full"
              />
              <Select value={editPriority} onValueChange={(value: 'A' | 'B' | 'C') => setEditPriority(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {node.isNew && <span className="mr-2 text-blue-500">+</span>}
                {node.isUpdated && <span className="mr-2 text-yellow-500">↻</span>}
                {node.isDeleted && <span className="mr-2 text-red-500">-</span>}
                <span className={node.isDeleted ? 'line-through' : ''}>{node.content}</span>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={() => startEditing(node)} disabled={node.isDeleted}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleDeleteNode(node.id)}>
                  {node.isDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>
      }
    >
      {node.children && node.children.map((child) => renderTreeNodes(child))}
    </TreeNode>
  );

  const getPriorityColor = (priority: 'A' | 'B' | 'C') => {
    switch (priority) {
      case 'A': return 'bg-red-100';
      case 'B': return 'bg-yellow-100';
      case 'C': return 'bg-green-100';
      default: return '';
    }
  };

  const getHighlightColor = (node: MindMapNode) => {
    if (node.isNew) return 'border-2 border-blue-500';
    if (node.isUpdated) return 'border-2 border-yellow-500';
    if (node.isDeleted) return 'border-2 border-red-500 opacity-50';
    return '';
  };

  if (!mindMap) return <div>No mind map data available</div>;

  console.log('MindMap received:', mindMap);

  return (
    <div className="h-full bg-gray-100 p-4 overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Mind Map</h2>
      <div className="mb-4">
        <span className="mr-4"><span className="text-blue-500 font-bold">+</span> New</span>
        <span className="mr-4"><span className="text-yellow-500 font-bold">↻</span> Updated</span>
        <span><span className="text-red-500 font-bold">-</span> Deleted</span>
      </div>
      <Tree
        lineWidth={'2px'}
        lineColor={'#bbb'}
        lineBorderRadius={'10px'}
        label={<div>{mindMap.content}</div>}
      >
        {mindMap.children.map((child) => renderTreeNodes(child))}
      </Tree>
    </div>
  );
};

export default MindMap;