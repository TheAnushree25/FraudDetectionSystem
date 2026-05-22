import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, Search, 
  MapPin, Clock, DollarSign, Smartphone, ShieldAlert, Cpu, Terminal
} from 'lucide-react';

const INITIAL_TRANSACTIONS = [
  { id: 'TX-8041', user: 'Liam Anderson', amount: 1420.50, merchant: 'Amazon Web Services', location: 'London, UK', device: 'MacBook Pro', risk: 8, time: 'Just now', type: 'safe' },
  { id: 'TX-8040', user: 'Elena Rostova', amount: 8900.00, merchant: 'CryptoExc Ltd', location: 'Moscow, RU', device: 'Unknown Linux', risk: 99, time: '2s ago', type: 'fraud' },
  { id: 'TX-8039', user: 'Sarah Jenkins', amount: 120.30, merchant: 'Uber Trip', location: 'New York, US', device: 'iPhone 15', risk: 3, time: '12s ago', type: 'safe' },
  { id: 'TX-8038', user: 'Rajesh Kumar', amount: 450.00, merchant: 'Starbucks Central', location: 'Mumbai, IN', device: 'Samsung Galaxy', risk: 14, time: '20s ago', type: 'safe' },
  { id: 'TX-8037', user: 'Marcus Vance', amount: 3200.00, merchant: 'Apple Store Retail', location: 'London, UK', device: 'iPad Pro', risk: 11, time: '1m ago', type: 'safe' },
  { id: 'TX-8036', user: 'Yuki Tanaka', amount: 95.00, merchant: 'Tokyo Subway Co', location: 'Tokyo, JP', device: 'Sony Xperia', risk: 2, time: '2m ago', type: 'safe' },
  { id: 'TX-8035', user: 'Sofia Goulart', amount: 1850.00, merchant: 'MercadoLibre', location: 'Sao Paulo, BR', device: 'Motorola G', risk: 22, time: '3m ago', type: 'safe' }
];

const NEW_MOCK_TRANSACTIONS = [
  { user: 'Daniel Schmidt', amount: 85.20, merchant: 'Lufthansa Airlines', location: 'Frankfurt, DE', device: 'iPhone 13', risk: 5, type: 'safe' },
  { user: 'Chen Wei', amount: 12500.00, merchant: 'Global FX Broker', location: 'Beijing, CN', device: 'Unknown Device', risk: 96, type: 'fraud' },
  { user: 'Olivia Brown', amount: 45.90, merchant: 'Netflix Subscription', location: 'Chicago, US', device: 'Apple TV', risk: 1, type: 'safe' },
  { user: 'Amina Diop', amount: 1200.00, merchant: 'Dakar Telecom', location: 'Dakar, SN', device: 'Huawei P40', risk: 18, type: 'safe' },
  { user: 'Nikolai Volkov', amount: 6200.00, merchant: 'Moscow Lux Retail', location: 'Moscow, RU', device: 'iPhone 15 Pro', risk: 99, type: 'fraud' },
  { user: 'Chloe Smith', amount: 310.00, merchant: 'ASOS Fashion', location: 'Sydney, AU', device: 'Google Pixel 8', risk: 4, type: 'safe' },
  { user: 'David Kim', amount: 980.00, merchant: 'Seoul Electro Mart', location: 'Seoul, KR', device: 'Samsung Fold', risk: 9, type: 'safe' }
];

const INITIAL_LOGS = [
  { time: '20:20:10', text: 'SYSTEM INITIALIZATION ROUTE DEPLOYED SUCCESSFULLY.', type: 'info' },
  { time: '20:20:12', text: 'SMOTE VECTOR SYNTHETIC RETRAINING PIPELINE: ACTIVE.', type: 'info' },
  { time: '20:20:14', text: 'TENSORFLOW BACKEND STATUS: ONLINE (CUDA KERNELS LINKED).', type: 'success' },
  { time: '20:20:17', text: 'PING PONG LATENCY DEPLOYED: 12ms OPTIMAL SIGNAL DETECTED.', type: 'info' },
  { time: '20:20:20', text: 'XGBOOST CLASSIFIER HYPERPARAMETERS VECTOR LOADED.', type: 'info' }
];

export default function LiveMonitorView({ globalStats }) {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [newTxId, setNewTxId] = useState(null);
  
  // Terminal logs state
  const [logs, setLogs] = useState(INITIAL_LOGS);

  // Auto-scroll ref for terminal
  const terminalEndRef = useRef(null);

  // Internal fallback stats in case props are missing
  const [localStats, setLocalStats] = useState({
    scanned: 1248,
    blocked: 142,
    accuracy: 99.4,
    falsePositives: 1.8
  });

  const activeStats = globalStats || localStats;
  const txCounter = useRef(8042);

  // Auto scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Periodically insert a new transaction & terminal log to simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      const isFraud = Math.random() > 0.75;
      const candidates = NEW_MOCK_TRANSACTIONS.filter(t => isFraud ? t.type === 'fraud' : t.type === 'safe');
      const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
      
      const newTx = {
        ...randomCandidate,
        id: `TX-${txCounter.current++}`,
        time: 'Just now',
        amount: Math.round((randomCandidate.amount * (0.8 + Math.random() * 0.4)) * 100) / 100
      };

      setTransactions(prev => {
        const updated = [newTx, ...prev.map(t => {
          if (t.time === 'Just now') return { ...t, time: '5s ago' };
          if (t.time === '2s ago') return { ...t, time: '7s ago' };
          if (t.time === '5s ago') return { ...t, time: '12s ago' };
          if (t.time === '7s ago') return { ...t, time: '15s ago' };
          if (t.time.endsWith('s ago')) {
            const secs = parseInt(t.time) + 5;
            return { ...t, time: `${secs}s ago` };
          }
          return t;
        })];
        return updated.slice(0, 8); // slightly shorter feed to make room for terminal
      });

      setNewTxId(newTx.id);

      // Add log
      const timeStr = new Date().toLocaleTimeString();
      let logText = '';
      let logType = 'info';

      if (isFraud) {
        logText = `CRITICAL ALERT: Impossible velocity signature on ${newTx.id} (${newTx.user}) at ${newTx.location}! RISK ${newTx.risk}% - HALTING TRANSACTION.`;
        logType = 'error';
      } else {
        logText = `Vector security verification complete for ${newTx.id}: PASSED (Risk ${newTx.risk}%).`;
        logType = 'success';
      }

      setLogs(prev => [
        ...prev,
        { time: timeStr, text: `VECTOR INTERCEPT: Analyzing ${newTx.id} device canvas parameters...`, type: 'info' },
        { time: timeStr, text: logText, type: logType }
      ].slice(-25)); // keep last 25 logs in memory

      if (!globalStats) {
        setLocalStats(prev => ({
          scanned: prev.scanned + 1,
          blocked: isFraud ? prev.blocked + 1 : prev.blocked,
          accuracy: parseFloat((99.2 + Math.random() * 0.4).toFixed(2)),
          falsePositives: parseFloat((1.6 + Math.random() * 0.4).toFixed(2))
        }));
      }

      setTimeout(() => {
        setNewTxId(null);
      }, 800);

    }, 4500);

    return () => clearInterval(interval);
  }, [globalStats]);

  return (
    <div className="view-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Top KPI Row */}
      <div className="kpi-grid">
        {/* KPI 1 */}
        <div className="glass-panel kpi-card cyan">
          <div className="kpi-header">
            <span className="kpi-title">Total Scanned</span>
            <div className="kpi-icon-container">
              <Activity size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{activeStats.scanned.toLocaleString()}</span>
            <span className="kpi-change positive">
              +25.4%
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel kpi-card red">
          <div className="kpi-header">
            <span className="kpi-title">Fraud Blocked</span>
            <div className="kpi-icon-container">
              <Shield size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{activeStats.blocked}</span>
            <span className="kpi-change negative">
              +8.3%
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-title">Model Accuracy</span>
            <div className="kpi-icon-container">
              <Cpu size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{activeStats.accuracy}%</span>
            <span className="kpi-change positive">
              +0.25%
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel kpi-card yellow">
          <div className="kpi-header">
            <span className="kpi-title">False Positive Rate</span>
            <div className="kpi-icon-container">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-body">
            <span className="kpi-value">{activeStats.falsePositives}%</span>
            <span className="kpi-change positive">
              -15.2%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & scrolling feed */}
      <div className="monitor-grid">
        
        {/* Left Side: Geospatial velocity map */}
        <div className="glass-panel map-panel" style={{ minHeight: '400px' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <MapPin size={16} />
                Geospatial Velocity & Latency Network
              </div>
              <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                Analyzing multi-hop transactions and impossible travel speeds
              </div>
            </div>
            <div className="system-status-indicator">
              <div className="status-dot"></div>
              Live Map: ONLINE
            </div>
          </div>

          <div className="map-container" style={{ minHeight: '320px' }}>
            <svg viewBox="0 0 1000 450" className="world-map-svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid-lines" />
                </pattern>
                <radialGradient id="glow-red" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="1000" height="450" fill="url(#grid)" />

              {/* Simplified world map silhouettes */}
              <path d="M 120 100 L 260 100 L 290 120 L 260 200 L 200 240 L 150 200 L 110 130 Z" className="map-land" />
              <path d="M 230 250 L 280 270 L 330 330 L 300 420 L 250 370 L 220 280 Z" className="map-land" />
              <path d="M 300 40 L 360 40 L 340 80 L 280 70 Z" className="map-land" />
              <path d="M 460 200 L 530 180 L 590 230 L 560 300 L 520 370 L 470 330 L 440 260 Z" className="map-land" />
              <path d="M 420 90 L 500 80 L 550 120 L 510 170 L 430 170 L 400 130 Z" className="map-land" />
              <path d="M 520 80 L 780 70 L 860 120 L 820 250 L 740 280 L 680 240 L 580 220 L 530 150 Z" className="map-land" />
              <path d="M 750 310 L 820 300 L 840 350 L 760 380 L 730 340 Z" className="map-land" />

              {/* Glowing Connection Paths */}
              <path d="M 450 130 Q 350 110 250 160" className="map-link-arc normal" />
              <path d="M 330 280 Q 290 220 250 160" className="map-link-arc normal" />
              <path d="M 600 220 Q 660 190 720 180" className="map-link-arc normal" />
              <path d="M 720 180 Q 750 250 780 320" className="map-link-arc normal" />
              <path d="M 480 140 Q 485 220 490 290" className="map-link-arc normal" />
              
              {/* Impossible Velocity Threat Line */}
              <path d="M 530 120 Q 390 90 250 160" className="map-link-arc velocity-threat" />

              {/* Hub Network Nodes */}
              <circle cx="250" cy="160" r="4" className="map-node target" />
              <circle cx="250" cy="160" r="10" fill="none" stroke="var(--cyan-accent)" strokeWidth="1" strokeOpacity="0.4" />
              <text x="240" y="178" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">NYC-US</text>
              
              <circle cx="450" cy="130" r="4" className="map-node hub" />
              <text x="440" y="120" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">LDN-UK</text>
              
              <circle cx="330" cy="280" r="4" className="map-node target" />
              <text x="320" y="295" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">GRU-BR</text>

              <circle cx="530" cy="120" r="6" className="map-node threat" />
              <circle cx="530" cy="120" r="15" fill="url(#glow-red)" />
              <text x="525" y="105" fill="var(--red-accent)" fontWeight="700" fontSize="8" fontFamily="var(--font-mono)">MOW-RU</text>

              <circle cx="490" cy="290" r="4" className="map-node target" />
              <text x="480" y="305" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">CPT-ZA</text>

              <circle cx="600" cy="220" r="4" className="map-node hub" />
              <text x="585" y="235" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">BOM-IN</text>

              <circle cx="720" cy="180" r="4" className="map-node target" />
              <circle cx="720" cy="180" r="9" fill="none" stroke="var(--cyan-accent)" strokeWidth="1" strokeOpacity="0.3" />
              <text x="715" y="195" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">HND-JP</text>

              <circle cx="780" cy="320" r="4" className="map-node target" />
              <text x="770" y="335" fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono)">SYD-AU</text>
            </svg>

            {/* Travel Alert Overlay Badge */}
            <div className="map-alert-badge">
              <ShieldAlert size={20} color="var(--red-accent)" />
              <div className="alert-text-container">
                <span className="alert-main-title">Impossible Travel Alert</span>
                <span className="alert-sub-title">Moscow (RU) to New York (US) in 0.08s</span>
              </div>
            </div>

            {/* Legend */}
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color safe"></div>
                <span>Active Link (Safe)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color threat"></div>
                <span>Fraud Spike / Suspicious Path</span>
              </div>
              <div className="legend-item">
                <div className="legend-color hub"></div>
                <span>Main Routing Gateway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Scrolling Transaction Feed */}
        <div className="glass-panel feed-panel" style={{ minHeight: '400px' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Activity size={16} />
                Live Transaction Telemetry
              </div>
              <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                Scanned via Real-Time Neural Net
              </div>
            </div>
            <Clock size={16} color="var(--text-muted)" />
          </div>

          <div className="feed-container">
            {transactions.map((tx) => {
              const isNew = tx.id === newTxId;
              const isFraud = tx.risk >= 90;
              return (
                <div 
                  key={tx.id} 
                  className={`feed-item ${isFraud ? 'threat' : ''} ${isNew ? 'new-alert' : ''}`}
                >
                  <div className="feed-item-left">
                    <div className="feed-avatar">
                      {isFraud ? <ShieldAlert size={16} /> : <Smartphone size={16} />}
                    </div>
                    <div className="feed-meta">
                      <span className="feed-user">{tx.user}</span>
                      <span className="feed-details">
                        {tx.location} • {tx.device} • {tx.time}
                      </span>
                    </div>
                  </div>
                  <div className="feed-item-right">
                    <span className="feed-amount">${tx.amount.toFixed(2)}</span>
                    <span className={`feed-score-badge ${isFraud ? 'fraud' : 'safe'}`}>
                      {isFraud ? `${tx.risk}% Risk` : 'Passed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Phase 2 Addition: Integrated Monospaced Log Terminal */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            <Terminal size={14} color="var(--cyan-accent)" />
            <span>ML SYSTEM VECTOR TELEMETRY LOGS (REAL-TIME CONTEXT)</span>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BUFFER STREAM: STDOUT</span>
        </div>

        <div style={{
          background: '#010308',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          padding: '12px 16px',
          height: '140px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          {logs.map((log, idx) => {
            let textColor = 'var(--text-secondary)';
            if (log.type === 'error') textColor = 'var(--red-accent)';
            if (log.type === 'success') textColor = 'var(--cyan-accent)';
            if (log.text.includes('VECTOR INTERCEPT')) textColor = 'var(--text-muted)';

            return (
              <div key={idx} style={{ display: 'flex', gap: '10px', color: textColor }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ wordBreak: 'break-all' }}>{log.text}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef}></div>
        </div>
      </div>

    </div>
  );
}
