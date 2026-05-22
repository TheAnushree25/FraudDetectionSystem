import React, { useState, useEffect } from 'react';
import { 
  Activity, Network, Cpu, Sliders, Shield, Search, 
  Terminal, ShieldCheck, ShieldAlert
} from 'lucide-react';
import LiveMonitorView from './components/LiveMonitorView';
import ThreatNetworkView from './components/ThreatNetworkView';
import ModelAIView from './components/ModelAIView';
import RulesEngineView from './components/RulesEngineView';
import ReviewQueueView from './components/ReviewQueueView';

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lifted global statistics updated in real-time
  const [globalStats, setGlobalStats] = useState({
    scanned: 1248,
    blocked: 142,
    accuracy: 99.4,
    falsePositives: 1.8
  });

  // Pending case counter
  const [pendingCount, setPendingCount] = useState(4);

  // Dynamic Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Increment Scanned Volume periodically to simulate real-time ML operations
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalStats(prev => {
        const increment = Math.floor(Math.random() * 2) + 1; // 1-2 transactions
        const isBlocked = Math.random() > 0.82; // block rate simulation
        return {
          ...prev,
          scanned: prev.scanned + increment,
          blocked: isBlocked ? prev.blocked + 1 : prev.blocked,
          accuracy: parseFloat((99.2 + Math.random() * 0.4).toFixed(2)),
          falsePositives: parseFloat((1.6 + Math.random() * 0.4).toFixed(2))
        };
      });
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // Handlers for manual review cases
  const handleApproveCase = (amount) => {
    setPendingCount(prev => Math.max(prev - 1, 0));
    setGlobalStats(prev => ({
      ...prev,
      scanned: prev.scanned + 1,
      // Marking safe decreases false positives rate
      falsePositives: parseFloat(Math.max(prev.falsePositives - 0.15, 1.1).toFixed(2)),
      accuracy: parseFloat(Math.min(prev.accuracy + 0.05, 99.9).toFixed(2))
    }));
  };

  const handleDeclineCase = (amount) => {
    setPendingCount(prev => Math.max(prev - 1, 0));
    setGlobalStats(prev => ({
      ...prev,
      scanned: prev.scanned + 1,
      blocked: prev.blocked + 1,
      // Declining suspicious targets reinforces ML decision vectors
      accuracy: parseFloat(Math.min(prev.accuracy + 0.08, 99.9).toFixed(2))
    }));
  };

  // Render view based on active tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'monitor':
        // Pass global stats down so the KPIs match perfectly
        return <LiveMonitorView globalStats={globalStats} />;
      case 'threat':
        return <ThreatNetworkView />;
      case 'model':
        return <ModelAIView />;
      case 'rules':
        return <RulesEngineView />;
      case 'review':
        return (
          <ReviewQueueView 
            onApprove={handleApproveCase} 
            onDecline={handleDeclineCase} 
          />
        );
      default:
        return <LiveMonitorView globalStats={globalStats} />;
    }
  };

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Shield size={24} />
          </div>
          <div>
            <span className="brand-name">NFraud Detect <span className="brand-sub">AI Monitoring Suite</span></span>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'monitor' ? 'active' : ''}`}
                onClick={() => setActiveTab('monitor')}
              >
                <Activity size={18} />
                <span>Live Monitor</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'threat' ? 'active' : ''}`}
                onClick={() => setActiveTab('threat')}
              >
                <Network size={18} />
                <span>Threat Network</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'model' ? 'active' : ''}`}
                onClick={() => setActiveTab('model')}
              >
                <Cpu size={18} />
                <span>Model AI / XAI</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'rules' ? 'active' : ''}`}
                onClick={() => setActiveTab('rules')}
              >
                <Sliders size={18} />
                <span>Rules Engine</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveTab('review')}
                style={{ position: 'relative' }}
              >
                <ShieldAlert size={18} color={pendingCount > 0 ? 'var(--yellow-accent)' : 'var(--text-secondary)'} />
                <span>Review Queue</span>
                {pendingCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--yellow-accent)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 0 8px var(--yellow-glow)'
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} color="var(--cyan-accent)" />
            <span>NODE CONTEXT: ACTIVE</span>
          </div>
          <div className="sidebar-footer-row">
            <span>VERSION</span>
            <span className="sidebar-footer-val">v4.8.1-BETA</span>
          </div>
          <div className="sidebar-footer-row">
            <span>PING RATE</span>
            <span className="sidebar-footer-val" style={{ color: 'var(--cyan-accent)' }}>12ms (Optimal)</span>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="dashboard-main">
        
        {/* Top Header */}
        <header className="top-header">
          <div className="header-title-area">
            <h1>
              <ShieldCheck size={22} color="var(--cyan-accent)" style={{ filter: 'drop-shadow(0 0 5px var(--cyan-glow))' }} />
              FRAUD DETECTION SHIELD
            </h1>
            <p>Predictive Enterprise ML Engine • Human-in-the-Loop Gateway</p>
          </div>

          <div className="header-controls">
            
            {/* Search Bar */}
            <div className="search-bar-container">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search transaction ID, device, IP..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* TensorFlow Status */}
            <div className="system-status-indicator">
              <div className="status-dot"></div>
              <span>TensorFlow Backend: ONLINE</span>
            </div>

            {/* Live Scanned Telemetry */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="system-telemetry-item">
                <span className="telemetry-label">Scanned Volume</span>
                <span className="telemetry-value cyan">{globalStats.scanned.toLocaleString()} TXs</span>
              </div>
              <div className="system-telemetry-item">
                <span className="telemetry-label">Clock Sync</span>
                <span className="telemetry-value" style={{ fontFamily: 'var(--font-mono)' }}>{currentTime}</span>
              </div>
            </div>

          </div>
        </header>

        {/* View Frame */}
        <div style={{ flex: 1 }}>
          {renderActiveView()}
        </div>

      </main>
    </div>
  );
}
