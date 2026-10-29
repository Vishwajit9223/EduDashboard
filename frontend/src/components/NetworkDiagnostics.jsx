/**
 * Network Diagnostics Component
 * Helps debug connection issues between frontend and backend
 */

import React, { useState, useEffect } from 'react';
import { checkServerHealth, getNetworkDiagnostics } from '../services/api';
import '../styles/NetworkDiagnostics.css';

const NetworkDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results = await getNetworkDiagnostics();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run diagnostics on mount
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return null;
  }

  const isHealthy = diagnostics.health?.isReachable && navigator.onLine;
  const statusClass = isHealthy ? 'diagnostic-healthy' : 'diagnostic-warning';

  return (
    <div className={`network-diagnostics ${statusClass}`}>
      <div className="diagnostic-header">
        <span className="diagnostic-status-icon">
          {isHealthy ? '✅' : '⚠️'}
        </span>
        <div className="diagnostic-title">
          <h3>Network Status</h3>
          <p>
            {isHealthy 
              ? 'Connection OK - Backend is reachable' 
              : 'Connection Issues - See details below'}
          </p>
        </div>
        <button 
          className="diagnostic-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {showDetails && (
        <div className="diagnostic-details">
          <div className="diagnostic-section">
            <h4>Frontend</h4>
            <pre>{JSON.stringify(diagnostics.frontend, null, 2)}</pre>
          </div>

          <div className="diagnostic-section">
            <h4>Backend Configuration</h4>
            <pre>{JSON.stringify(diagnostics.backend, null, 2)}</pre>
          </div>

          <div className="diagnostic-section">
            <h4>Backend Health Check</h4>
            {diagnostics.health?.isReachable ? (
              <div className="diagnostic-success">
                <p>✓ Backend is reachable</p>
                <p>Status: {diagnostics.health.status}</p>
                {diagnostics.health.data?.message && (
                  <p>Message: {diagnostics.health.data.message}</p>
                )}
              </div>
            ) : (
              <div className="diagnostic-error">
                <p>✗ Backend is not reachable</p>
                <p>Error: {diagnostics.health?.error}</p>
                <p>Code: {diagnostics.health?.code}</p>
                <div className="diagnostic-hint">
                  <h5>Troubleshooting tips:</h5>
                  <ul>
                    <li>Check if backend server is running: <code>python app.py</code></li>
                    <li>Verify backend is on port 5000</li>
                    <li>Check CORS configuration in backend</li>
                    <li>Open browser DevTools (F12) → Network tab to see actual request errors</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="diagnostic-section">
            <h4>Browser</h4>
            <pre>{JSON.stringify({
              online: navigator.onLine,
              userAgent: navigator.userAgent.substring(0, 100) + '...'
            }, null, 2)}</pre>
          </div>

          <button className="diagnostic-refresh" onClick={runDiagnostics} disabled={loading}>
            {loading ? '⏳ Running...' : '🔄 Refresh'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkDiagnostics;
