import Editor from '@monaco-editor/react';
import type { FileNode } from './FileExplorer';

interface MonacoEditorProps {
  activeFile: FileNode | undefined;
  onContentChange: (value?: string) => void;
}

export function MonacoEditor({
  activeFile,
  onContentChange,
}: MonacoEditorProps) {
  return (
    <main className="flex-1 min-w-0 h-full overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        path={activeFile?.id}
        value={activeFile?.content}
        onChange={onContentChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </main>
  );
}
