import { useState } from 'react';

interface TestRunnerProps {
  isVisible: boolean;
  activeFileContent: string;
}

interface JobSubmission {
  code: string;
  input: string;
  expectedOutput: string;
  language?: string;
}

interface JobResponse {
  success: boolean;
  jobId: string;
  messageId: string;
  message: string;
}

export function TestRunner({ isVisible, activeFileContent }: TestRunnerProps) {
  const [input, setInput] = useState('2\n3');
  const [expectedOutput, setExpectedOutput] = useState('5');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  // Hardcoded API URL - you can update this to your actual API Gateway URL
  const apiUrl = 'https://your-api-gateway-url.execute-api.region.amazonaws.com/prod';

  const runTest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      // Use the current code from the active file
      const currentCode = activeFileContent || '// No code to test';

      const jobData: JobSubmission = {
        code: currentCode,
        input,
        expectedOutput,
        language: 'typescript'
      };

      console.log('Submitting job:', jobData);

      const response = await fetch(`${apiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jobResponse: JobResponse = await response.json();
      
      console.log('Job submitted successfully:', jobResponse);

      // For now, we'll simulate the test result since we haven't implemented the job processor yet
      // In a real implementation, you'd poll for the job status or use WebSockets
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isPassing = Math.random() > 0.3; // Simulated result

      setResult({
        isPassing,
        actualOutput: isPassing ? expectedOutput : 'Wrong Answer',
        executionTime: Math.random() * 100 + 50,
        jobId: jobResponse.jobId,
        message: `Job submitted successfully (ID: ${jobResponse.jobId})`
      });

    } catch (error) {
      console.error('Test execution error:', error);
      setResult({
        isPassing: false,
        actualOutput: 'Error',
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-600">
        <h3 className="text-white text-sm font-medium">Test Runner</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs">Test Configuration</span>
            <button
              onClick={runTest}
              disabled={isRunning}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                isRunning
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isRunning ? 'Running...' : 'Run Test'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1">Input</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-20 bg-slate-700 text-slate-200 text-xs p-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Enter test input..."
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs mb-1">
                Expected Output
              </label>
              <textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                className="w-full h-20 bg-slate-700 text-slate-200 text-xs p-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Enter expected output..."
              />
            </div>
          </div>

          {/* Test Result */}
          {result && (
            <div
              className={`text-xs p-3 rounded ${
                result.error
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : result.isPassing
                  ? 'bg-green-900/50 text-green-300 border border-green-700'
                  : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {result.error ? '✗ Error' : result.isPassing ? '✓ Passed' : '✗ Failed'}
                </span>
                {!result.error && (
                  <span className="text-slate-400">
                    {result.executionTime.toFixed(0)}ms
                  </span>
                )}
              </div>
              {result.error ? (
                <div className="mt-2 text-xs">
                  <div>Error: {result.error}</div>
                </div>
              ) : !result.isPassing ? (
                <div className="mt-2 text-xs">
                  <div>Expected: {expectedOutput}</div>
                  <div>Actual: {result.actualOutput}</div>
                </div>
              ) : null}
              {result.jobId && (
                <div className="mt-2 text-xs text-slate-400">
                  {result.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
