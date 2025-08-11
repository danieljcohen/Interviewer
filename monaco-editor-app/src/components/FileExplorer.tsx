export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
};

interface FileExplorerProps {
  tree: FileNode[];
  activeFileId: string;
  onSelect: (id: string) => void;
}

export function FileExplorer({
  tree,
  activeFileId,
  onSelect,
}: FileExplorerProps) {
  return (
    <aside className="w-72 border-r border-gray-200 p-3 overflow-y-auto bg-slate-950 text-gray-200">
      <h3 className="m-0 mb-2 text-sm text-gray-400">Files</h3>
      <FileTreeView
        nodes={tree}
        activeFileId={activeFileId}
        onSelect={onSelect}
      />
    </aside>
  );
}

function FileTreeView({
  nodes,
  activeFileId,
  onSelect,
}: {
  nodes: FileNode[];
  activeFileId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="list-none pl-2 m-0">
      {nodes.map((node) => (
        <li key={node.id}>
          {node.type === 'folder' ? (
            <details open>
              <summary className="cursor-pointer text-blue-300 select-none">
                {node.name}
              </summary>
              {node.children && (
                <div className="pl-3">
                  <FileTreeView
                    nodes={node.children}
                    activeFileId={activeFileId}
                    onSelect={onSelect}
                  />
                </div>
              )}
            </details>
          ) : (
            <button
              onClick={() => onSelect(node.id)}
              className={`${node.id === activeFileId ? 'bg-gray-900 text-white' : 'text-gray-200 hover:bg-slate-800'} block w-full text-left border-0 px-2 py-1.5 rounded cursor-pointer`}
            >
              {node.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
