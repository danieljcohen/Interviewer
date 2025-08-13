import { useMemo, useState } from 'react';
import { FileExplorer, type FileNode } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';
import { TestRunner } from './TestRunner';

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
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [testRunnerHeight, setTestRunnerHeight] = useState(300);
  const files = useMemo(() => flattenFiles(tree), [tree]);
  
  // Tab management
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Initialize with first file if no tabs are open
  const activeFileId = activeTabId || files[0]?.id || '';
  
  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId),
    [files, activeFileId]
  );

  // Add file to tabs when selected
  const handleFileSelect = (fileId: string) => {
    setActiveTabId(fileId);
    if (!openTabs.includes(fileId)) {
      setOpenTabs(prev => [...prev, fileId]);
    }
  };

  // Close tab
  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(id => id !== fileId);
    setOpenTabs(newTabs);
    
    // If closing active tab, switch to another tab
    if (fileId === activeTabId) {
      const currentIndex = openTabs.indexOf(fileId);
      const nextTab = newTabs[currentIndex] || newTabs[currentIndex - 1] || newTabs[0];
      setActiveTabId(nextTab || '');
    }
  };

  // Get file info for tabs
  const getFileInfo = (fileId: string) => {
    return files.find(f => f.id === fileId);
  };

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
      <header className="bg-slate-900 border-b border-gray-700 px-4 py-3 flex items-center justify-center relative">
        <h1 className="text-white font-bold text-3xl">Interviewer IDE</h1>
        <div className="absolute right-4 flex items-center space-x-4">
          <div className="text-gray-400 text-xs">
            {activeFile ? `Editing: ${activeFile.name}` : 'No file selected'}
          </div>
          <button
            onClick={() => setShowTestRunner(!showTestRunner)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showTestRunner
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showTestRunner ? 'Hide Test Runner' : 'Show Test Runner'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          tree={tree}
          activeFileId={activeFileId}
          onSelect={handleFileSelect}
        />
        <div className="flex flex-col flex-1">
          {/* Tab Bar - only over the code editor */}
          {openTabs.length > 0 && (
            <div className="bg-slate-800 border-b border-gray-700 flex items-center overflow-x-auto">
              {openTabs.map((fileId) => {
                const file = getFileInfo(fileId);
                const isActive = fileId === activeTabId;
                return (
                  <div
                    key={fileId}
                    onClick={() => setActiveTabId(fileId)}
                    className={`flex items-center px-4 py-2 cursor-pointer border-r border-gray-700 min-w-0 ${
                      isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xs truncate max-w-32">{file?.name || 'Unknown'}</span>
                    <button
                      onClick={(e) => handleCloseTab(fileId, e)}
                      className="ml-2 text-gray-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <MonacoEditor
            activeFile={activeFile}
            onContentChange={handleContentChange}
          />
          {showTestRunner && (
            <div
              className="relative border-t border-white"
              style={{ height: `${testRunnerHeight}px` }}
            >
              {/* Resize handle */}
              <div
                className="absolute top-0 left-0 right-0 h-4 bg-slate-800 cursor-row-resize hover:bg-slate-800 z-10"
                onMouseDown={(e) => {
                  console.log('Test Runner resize handle clicked!');
                  e.preventDefault();
                  e.stopPropagation();
                  const startY = e.clientY;
                  const startHeight = testRunnerHeight;

                  const handleMouseMove = (e: MouseEvent) => {
                    const delta = e.clientY - startY;
                    const newHeight = Math.max(
                      200,
                      Math.min(600, startHeight - delta)
                    );
                    setTestRunnerHeight(newHeight);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <span className="text-white text-xs font-bold">⋮⋮⋮</span>
                </div>
              </div>
              <TestRunner 
                isVisible={showTestRunner} 
                activeFileContent={activeFile?.content || ''}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
