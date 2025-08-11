const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create WebSocket server
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Sample data - only file tree for IDE
const sampleData = {
  fileTree: [
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
  ]
};

// Terminal management
const terminals = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  // Create a new terminal for this connection
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  // Set the working directory to the backend project directory
  const backendDir = __dirname;
  console.log('Terminal working directory:', backendDir);
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: backendDir, // Use backend directory instead of process.cwd()
    env: {
      ...process.env,
      PWD: backendDir,
      TERM: 'xterm-256color'
    }
  });

  const terminalId = Date.now().toString();
  terminals.set(terminalId, { ptyProcess, ws });

  console.log(`Created terminal with ID: ${terminalId} in directory: ${backendDir}`);

  // Send terminal ID to client
  ws.send(JSON.stringify({ type: 'terminal-id', id: terminalId }));

  // Handle terminal data from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message from client:', data);
      
      if (data.type === 'terminal-input') {
        const terminal = terminals.get(data.terminalId);
        if (terminal) {
          console.log(`Writing to terminal ${data.terminalId}:`, data.data);
          terminal.ptyProcess.write(data.data);
        } else {
          console.log(`Terminal ${data.terminalId} not found`);
        }
      } else if (data.type === 'terminal-resize') {
        const terminal = terminals.get(data.terminalId);
        if (terminal) {
          console.log(`Resizing terminal ${data.terminalId} to ${data.cols}x${data.rows}`);
          terminal.ptyProcess.resize(data.cols, data.rows);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  // Send terminal output to client
  ptyProcess.on('data', (data) => {
    console.log(`Terminal ${terminalId} output:`, data);
    ws.send(JSON.stringify({
      type: 'terminal-output',
      data: data
    }));
  });

  // Handle terminal close
  ptyProcess.on('exit', () => {
    console.log(`Terminal ${terminalId} exited`);
    ws.send(JSON.stringify({
      type: 'terminal-exit',
      code: 0
    }));
    terminals.delete(terminalId);
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`WebSocket closed for terminal ${terminalId}`);
    const terminal = terminals.get(terminalId);
    if (terminal) {
      terminal.ptyProcess.kill();
      terminals.delete(terminalId);
    }
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// File tree endpoints
app.get('/api/file-tree', (req, res) => {
  res.json(sampleData.fileTree);
});

app.get('/api/file-tree/:fileId', (req, res) => {
  const findFile = (nodes, fileId) => {
    for (const node of nodes) {
      if (node.id === fileId) {
        return node;
      }
      if (node.children) {
        const found = findFile(node.children, fileId);
        if (found) return found;
      }
    }
    return null;
  };

  const file = findFile(sampleData.fileTree, req.params.fileId);
  if (file) {
    res.json(file);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Update file content endpoint
app.put('/api/file-tree/:fileId', (req, res) => {
  const { content } = req.body;
  
  const updateFile = (nodes, fileId, newContent) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === fileId) {
        nodes[i] = { ...nodes[i], content: newContent };
        return true;
      }
      if (nodes[i].children) {
        if (updateFile(nodes[i].children, fileId, newContent)) {
          return true;
        }
      }
    }
    return false;
  };

  if (updateFile(sampleData.fileTree, req.params.fileId, content)) {
    res.json({ success: true, message: 'File updated successfully' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`WebSocket server: ws://localhost:${PORT}`);
  console.log(`Terminal working directory: ${__dirname}`);
}); 