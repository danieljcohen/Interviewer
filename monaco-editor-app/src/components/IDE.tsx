import { useMemo, useState } from 'react';
import { FileExplorer, type FileNode } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';

// TODO: @danieljcohen0 - Make this dynamic - stored somewhere
const initialTree: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'src/index.ts',
        name: 'index.ts',
        type: 'file',
        content:
          `export const greet = (name: string) => ` +
          '`Hello, ${name}!`' +
          `\n\nconsole.log(greet('World'))\n`,
      },
      {
        id: 'src/utils',
        name: 'utils',
        type: 'folder',
        children: [
          {
            id: 'src/utils/math.ts',
            name: 'math.ts',
            type: 'file',
            content: `export function add(a: number, b: number): number {\n  return a + b\n}\n\nexport function mul(a: number, b: number): number {\n  return a * b\n}\n`,
          },
        ],
      },
    ],
  },
];

function flattenFiles(tree: FileNode[]): FileNode[] {
  const files: FileNode[] = [];
  const walk = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file') files.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(tree);
  return files;
}

export function IDE() {
  const [tree, setTree] = useState<FileNode[]>(initialTree);
  const files = useMemo(() => flattenFiles(tree), [tree]);
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id ?? '');

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId),
    [files, activeFileId]
  );

  const handleContentChange = (value?: string) => {
    if (!activeFile) return;
    const update = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.type === 'file' && n.id === activeFile.id) {
          return { ...n, content: value ?? '' };
        }
        if (n.children) return { ...n, children: update(n.children) };
        return n;
      });
    setTree((prev) => update(prev));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden max-h-screen max-w-screen">
      {/* Header */}
      <header className="bg-slate-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <h1 className="text-gray-200 font-medium text-sm">Monaco Editor IDE</h1>
        <div className="text-gray-400 text-xs">
          {activeFile ? `Editing: ${activeFile.name}` : 'No file selected'}
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          tree={tree}
          activeFileId={activeFileId}
          onSelect={setActiveFileId}
        />
        <MonacoEditor
          activeFile={activeFile}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
