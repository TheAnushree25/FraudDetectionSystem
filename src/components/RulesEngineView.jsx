import React, { useState, useEffect } from 'react';
import { 
  Sliders, Play, Plus, Trash2, Cpu, Check, AlertTriangle, ShieldCheck, ShieldAlert,
  History, ArrowRight, RefreshCw, BarChart3
} from 'lucide-react';

const INITIAL_RULES = [
  { id: 1, field: 'Amount', op: '>', val: '10000', field2: 'Velocity', op2: '>', val2: '500km/h', action: 'BLOCK' },
  { id: 2, field: 'VPN Status', op: '==', val: 'Active', field2: 'Country Match', op2: '==', val2: 'Mismatch', action: 'FLAG' },
  { id: 3, field: 'Device Type', op: '==', val: 'Rooted', field2: 'None', op2: '==', val2: '', action: 'BLOCK' }
];

export default function RulesEngineView() {
  // Rules State
  const [rules, setRules] = useState(INITIAL_RULES);
  const [newRule, setNewRule] = useState({
    field: 'Amount',
    op: '>',
    val: '1000',
    field2: 'None',
    op2: '==',
    val2: '',
    action: 'BLOCK'
  });

  // Slider State
  const [sensitivity, setSensitivity] = useState(0.78);

  // Backtester State
  const [backtesting, setBacktesting] = useState(false);
  const [backtestStats, setBacktestStats] = useState({
    blockedRate: 1.45,
    fpCaught: 18.2,
    accuracy: 99.1
  });

  // Simulator State
  const [amount, setAmount] = useState('12500');
  const [merchant, setMerchant] = useState('Binance Corp');
  const [device, setDevice] = useState('Rooted Android Emulator');
  const [vpn, setVpn] = useState(true);
  const [velocity, setVelocity] = useState('720');
  
  const [simulating, setSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);

  // Trigger backtest sweep animation on rules modifications
  const runBacktesterSweep = (currentRulesLength) => {
    setBacktesting(true);
    setTimeout(() => {
      setBacktesting(false);
      // Generate realistic stats based on active rules count
      const count = currentRulesLength;
      setBacktestStats({
        blockedRate: parseFloat((0.45 + count * 0.35).toFixed(2)),
        fpCaught: parseFloat((12.5 + count * 2.1).toFixed(1)),
        accuracy: parseFloat((98.4 + count * 0.25).toFixed(2))
      });
    }, 800);
  };

  // Run backtester on initial mount
  useEffect(() => {
    runBacktesterSweep(rules.length);
  }, []);

  // Add rule handler
  const handleAddRule = (e) => {
    e.preventDefault();
    const ruleObj = {
      id: Date.now(),
      ...newRule
    };
    const updated = [...rules, ruleObj];
    setRules(updated);
    runBacktesterSweep(updated.length);
  };

  // Delete rule handler
  const handleDeleteRule = (id) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    runBacktesterSweep(updated.length);
  };

  // Run AI Simulation Calculator
  const handleRunSimulation = (e) => {
    e.preventDefault();
    setSimulating(true);
    setPredictionResult(null);

    const stages = [
      'Tokenizing input vectors...',
      'Comparing with device canvas fingerprint DEV-9801...',
      'Computing geographic routing nodes...',
      'Running SHAP decision boundaries...'
    ];

    let currentStage = 0;
    setSimProgress(stages[0]);

    const stageInterval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setSimProgress(stages[currentStage]);
      } else {
        clearInterval(stageInterval);
        
        // Calculate dynamic fraud score based on inputs
        let score = 5; // base score
        const shapAttributions = [
          { name: 'Base Risk Probability', val: 10, type: 'neutral', label: '10%' }
        ];

        // Amount impact
        const parsedAmount = parseFloat(amount) || 0;
        if (parsedAmount > 10000) {
          score += 20;
          shapAttributions.push({ name: 'Amount > $10k (High Vol)', val: 20, type: 'positive', label: '+20% risk' });
        } else if (parsedAmount > 5000) {
          score += 12;
          shapAttributions.push({ name: 'Amount > $5k (Medium Vol)', val: 12, type: 'positive', label: '+12% risk' });
        } else if (parsedAmount > 1000) {
          score += 5;
          shapAttributions.push({ name: 'Amount > $1k (Standard Vol)', val: 5, type: 'positive', label: '+5% risk' });
        } else if (parsedAmount < 500) {
          score -= 4;
          shapAttributions.push({ name: 'Amount < $500 (Low Vol)', val: -4, type: 'negative', label: '-4% risk' });
        }

        // Device impact
        if (device === 'Rooted Android Emulator') {
          score += 40;
          shapAttributions.push({ name: 'Rooted Android Device ID', val: 40, type: 'positive', label: '+40% risk' });
        } else if (device === 'Unknown Device') {
          score += 22;
          shapAttributions.push({ name: 'Unknown Device Header OS', val: 22, type: 'positive', label: '+22% risk' });
        } else if (device === 'iPhone App Sandbox') {
          score -= 3;
          shapAttributions.push({ name: 'Apple Secure App Sandbox', val: -3, type: 'negative', label: '-3% risk' });
        } else if (device === 'Trusted macOS') {
          score -= 5;
          shapAttributions.push({ name: 'Biometric macOS TouchID', val: -5, type: 'negative', label: '-5% risk' });
        }

        // VPN impact
        if (vpn) {
          score += 18;
          shapAttributions.push({ name: 'VPN/Proxy exit node verified', val: 18, type: 'positive', label: '+18% risk' });
        }

        // Velocity impact
        const parsedVelocity = parseFloat(velocity) || 0;
        if (parsedVelocity > 500) {
          score += 25;
          shapAttributions.push({ name: 'Impossible Velocity (>500km/h)', val: 25, type: 'positive', label: '+25% risk' });
        } else if (parsedVelocity > 100) {
          score += 8;
          shapAttributions.push({ name: 'Moderate Routing Travel Speed', val: 8, type: 'positive', label: '+8% risk' });
        } else if (parsedVelocity === 0) {
          score -= 5;
          shapAttributions.push({ name: 'Static Geological Position', val: -5, type: 'negative', label: '-5% risk' });
        }

        // Cap at 99%, min at 2%
        score = Math.min(Math.max(score, 2), 99);

        // Rules check overrides
        let triggeredRule = null;
        if (parsedAmount > 10000 && parsedVelocity > 500) {
          triggeredRule = 'Rule #1: High value + Impossible Travel velocity -> BLOCK';
          score = Math.max(score, 98);
        } else if (device === 'Rooted Android Emulator') {
          triggeredRule = 'Rule #3: Rooted device configuration -> BLOCK';
          score = Math.max(score, 95);
        } else if (vpn && parsedAmount > 5000) {
          triggeredRule = 'VPN Anonymizer + High Value threshold -> FLAG';
          score = Math.max(score, 85);
        }

        // final decision matching sensitivity
        const actionDecision = (score / 100) >= sensitivity ? 'BLOCK' : (score >= 70 ? 'FLAG' : 'ALLOW');

        setPredictionResult({
          score,
          decision: actionDecision,
          triggeredRule,
          shapAttributions,
          meta: {
            timestamp: new Date().toLocaleTimeString(),
            entropy: (Math.random() * 0.15).toFixed(4)
          }
        });
        setSimulating(false);
      }
    }, 300);
  };

  // Slider warning text matching threshold
  const getSensitivityWarning = () => {
    if (sensitivity < 0.60) {
      return {
        text: 'LOW SENSITIVITY: Model is highly lenient. Elevated risk of false negatives (missed account takeovers).',
        class: 'warning'
      };
    }
    if (sensitivity > 0.88) {
      return {
        text: 'HIGH SENSITIVITY: Model is hyper-strict. Elevated risk of false positives (blocking safe customers).',
        class: 'danger'
      };
    }
    return {
      text: 'OPTIMAL SENSITIVITY: Balanced state. Maximum conversion with secured risk tolerance boundaries.',
      class: 'optimal'
    };
  };

  const warnState = getSensitivityWarning();

  return (
    <div className="view-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sliders size={22} color="var(--cyan-accent)" style={{ filter: 'drop-shadow(0 0 5px var(--cyan-glow))' }} />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Human-in-the-Loop Rules Engine & Simulation</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Create hard check overrides, tune threshold sensitivity, and run live transaction simulation profiles
            </p>
          </div>
        </div>
      </div>

      <div className="rules-engine-layout">
        
        {/* Left Side: Rules Builder & Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Rules Builder Panel */}
          <div className="glass-panel rules-builder-panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={16} /> Decoupled Rules Engine Builder
              </span>
              <span className="panel-subtitle">Overrides Neural Net Decisions</span>
            </div>

            {/* List of rules */}
            <div className="rules-list">
              {rules.map((rule) => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-card-header">
                    <span className="rule-title">SYS-RULE-{rule.id}</span>
                    <button onClick={() => handleDeleteRule(rule.id)} className="rule-delete-btn" title="Delete Rule">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="rule-logical-block">
                    <span className="logical-keyword">IF</span>
                    <span className="logical-var">[{rule.field}]</span>
                    <span className="logical-op">{rule.op}</span>
                    <span className="logical-val">"{rule.val}"</span>
                    
                    {rule.field2 !== 'None' && (
                      <>
                        <span className="logical-keyword">AND</span>
                        <span className="logical-var">[{rule.field2}]</span>
                        <span className="logical-op">{rule.op2}</span>
                        <span className="logical-val">"{rule.val2}"</span>
                      </>
                    )}
                    
                    <span className="logical-keyword">THEN</span>
                    <span className={`logical-action ${rule.action === 'ALLOW' ? 'allow' : ''}`}>
                      {rule.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rule Adder Form */}
            <form onSubmit={handleAddRule} className="rule-adder-form">
              <span className="rule-adder-title">Construct Operational Logic</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Condition 1 */}
                <div className="rule-adder-inputs">
                  <select 
                    className="rule-select"
                    value={newRule.field}
                    onChange={(e) => setNewRule(prev => ({ ...prev, field: e.target.value }))}
                  >
                    <option value="Amount">Amount</option>
                    <option value="Velocity">Velocity</option>
                    <option value="VPN Status">VPN Status</option>
                    <option value="Country Match">Country Match</option>
                    <option value="Device Type">Device Type</option>
                  </select>

                  <select 
                    className="rule-select"
                    value={newRule.op}
                    onChange={(e) => setNewRule(prev => ({ ...prev, op: e.target.value }))}
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                  </select>

                  <input 
                    type="text" 
                    className="rule-input" 
                    value={newRule.val} 
                    onChange={(e) => setNewRule(prev => ({ ...prev, val: e.target.value }))}
                    placeholder="Value..."
                    style={{ gridColumn: 'span 2' }}
                  />
                </div>

                {/* Condition 2 */}
                <div className="rule-adder-inputs">
                  <select 
                    className="rule-select"
                    value={newRule.field2}
                    onChange={(e) => setNewRule(prev => ({ ...prev, field2: e.target.value }))}
                  >
                    <option value="None">[No AND link]</option>
                    <option value="Amount">Amount</option>
                    <option value="Velocity">Velocity</option>
                    <option value="VPN Status">VPN Status</option>
                    <option value="Country Match">Country Match</option>
                    <option value="Device Type">Device Type</option>
                  </select>

                  <select 
                    className="rule-select"
                    value={newRule.op2}
                    onChange={(e) => setNewRule(prev => ({ ...prev, op2: e.target.value }))}
                    disabled={newRule.field2 === 'None'}
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                  </select>

                  <input 
                    type="text" 
                    className="rule-input" 
                    value={newRule.val2} 
                    onChange={(e) => setNewRule(prev => ({ ...prev, val2: e.target.value }))}
                    placeholder="Value..."
                    disabled={newRule.field2 === 'None'}
                    style={{ gridColumn: 'span 2' }}
                  />
                </div>

                {/* Action select */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>THEN ACTION</span>
                    <select 
                      className="rule-select" 
                      style={{ width: '100%' }}
                      value={newRule.action}
                      onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                    >
                      <option value="BLOCK">BLOCK (Strict Reject)</option>
                      <option value="FLAG">FLAG (Review Queue)</option>
                      <option value="ALLOW">ALLOW (Bypass checks)</option>
                    </select>
                  </div>
                  <button type="submit" className="rule-add-btn" style={{ alignSelf: 'flex-end', height: '36px', flex: 1 }}>
                    <Plus size={16} /> Inject Rule Block
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Model Sensitivity Adjuster */}
          <div className="glass-panel">
            <div className="panel-header">
              <span className="panel-title">
                <Sliders size={16} /> Model Sensitivity Threshold Adjuster
              </span>
            </div>

            <div className="sensitivity-panel" style={{ margin: 0 }}>
              <div className="slider-header">
                <span className="slider-label">Neural Boundary Cutoff (σ)</span>
                <span className="slider-value">{sensitivity.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.50" 
                max="0.99" 
                step="0.01" 
                className="custom-range-slider"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              />
              
              <div style={{ marginTop: '16px', fontSize: '11px', display: 'flex', gap: '8px', padding: '10px', borderRadius: '6px', 
                background: warnState.class === 'optimal' ? 'rgba(16, 185, 129, 0.05)' : warnState.class === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${warnState.class === 'optimal' ? 'rgba(16, 185, 129, 0.2)' : warnState.class === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: warnState.class === 'optimal' ? '#10b981' : warnState.class === 'warning' ? 'var(--yellow-accent)' : 'var(--red-accent)'
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{warnState.text}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Backtester Widget & Simulator Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Phase 2 Addition: Interactive Rules Backtester */}
          <div className="glass-panel">
            <div className="panel-header" style={{ marginBottom: '12px' }}>
              <div className="panel-title">
                <History size={16} color="var(--cyan-accent)" />
                <span>Rules System Backtester (Historic Ledger Run)</span>
              </div>
              <div className="system-status-indicator" style={{ display: backtesting ? 'flex' : 'none' }}>
                <RefreshCw size={10} className="spinner" style={{ marginRight: '4px' }} />
                <span>BACKTESTING...</span>
              </div>
            </div>

            {backtesting ? (
              <div style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '60%', background: 'var(--cyan-accent)', borderRadius: '2px', animation: 'arc-flow-normal 0.8s linear infinite' }}></div>
                </div>
                <span>Scanning 10,000 historic transactions against rule logic...</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                
                {/* Stat 1 */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Blocked Volume</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red-accent)', marginTop: '4px', display: 'block' }}>
                    {backtestStats.blockedRate}%
                  </span>
                </div>

                {/* Stat 2 */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>False Positives</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)', marginTop: '4px', display: 'block' }}>
                    -{backtestStats.fpCaught}%
                  </span>
                </div>

                {/* Stat 3 */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Backtest F1</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981', marginTop: '4px', display: 'block' }}>
                    {backtestStats.accuracy}%
                  </span>
                </div>

              </div>
            )}
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '10px', textAlign: 'right' }}>
              TARGET FRAME: 10,000 SHUFFLED LEDGERS
            </div>
          </div>
          
          {/* Transaction Simulator Sandbox */}
          <div className="glass-panel simulator-panel">
            <div className="panel-header">
              <div>
                <span className="panel-title">
                  <Play size={16} /> Live Vector Simulator Sandbox
                </span>
                <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                  Test immediate neural response times and rule priority overrides
                </div>
              </div>
            </div>

            <form onSubmit={handleRunSimulation} className="simulator-form" style={{ margin: 0 }}>
              <div className="form-group">
                <label className="form-label">Transaction Amount ($ USD)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Merchant Node</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Amazon Retail Inc"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Device Canvas Footprint</label>
                <select 
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                >
                  <option value="Trusted macOS">Apple MacBook Pro (Verified hardware key)</option>
                  <option value="iPhone App Sandbox">Apple iPhone 15 Pro (Secure Sandbox)</option>
                  <option value="Standard Windows">Dell Latitude XPS (Windows WebClient)</option>
                  <option value="Unknown Device">Unknown Linux/Mozilla Generic (No footprint)</option>
                  <option value="Rooted Android Emulator">Rooted Android 11 Emulator (Spoof device signature)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Travel Speed Velocity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={velocity}
                    onChange={(e) => setVelocity(e.target.value)}
                    placeholder="0 (Static)"
                  />
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>km/h from previous TX</span>
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '100%' }}>
                    <input 
                      type="checkbox" 
                      checked={vpn}
                      onChange={(e) => setVpn(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--cyan-accent)' }}
                    />
                    <span>VPN/Anonymizer Exit IP</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="sim-run-btn"
                disabled={simulating}
              >
                {simulating ? (
                  <>
                    <div className="spinner"></div>
                    <span>{simProgress}</span>
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    <span>Run AI Prediction</span>
                  </>
                )}
              </button>
            </form>

            {/* Simulator Result Box */}
            {predictionResult && (
              <div className={`prediction-result-box ${predictionResult.decision === 'BLOCK' ? 'fraud' : 'safe'}`} style={{ marginTop: '20px' }}>
                <div className="pred-header">
                  <span className="pred-title">
                    Neural Net Evaluation Output
                  </span>
                  <span className="pred-badge">
                    {predictionResult.decision}
                  </span>
                </div>

                <div className="pred-score-row">
                  <span className="pred-score-value">
                    {predictionResult.score}%
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="pred-score-desc">
                      Calculated fraud risk vector matching current hyperparameters.
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Resolution latency: 14ms • Entropy: {predictionResult.meta.entropy}
                    </span>
                  </div>
                </div>

                <div className="pred-bar-container">
                  <div 
                    className="pred-bar-fill"
                    style={{ width: `${predictionResult.score}%` }}
                  ></div>
                </div>

                {/* Phase 2 Addition: Live Dynamic SHAP attributions in simulation results */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                    <BarChart3 size={12} color="var(--cyan-accent)" /> Dynamic SHAP Attributions for this transaction
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {predictionResult.shapAttributions.map((attr, idx) => {
                      const absVal = Math.abs(attr.val);
                      const isPositive = attr.type === 'positive';
                      const isNegative = attr.type === 'negative';
                      const widthPct = `${absVal * 1.5}%`;
                      const leftPos = isPositive ? '50%' : `calc(50% - ${absVal * 1.5}%)`;

                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attr.name}
                          </span>
                          
                          <div style={{ height: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.15)', zIndex: 1 }}></div>
                            <div 
                              className={`shap-bar ${attr.type}`}
                              style={{ 
                                left: attr.type === 'neutral' ? '40%' : leftPos,
                                width: attr.type === 'neutral' ? '10%' : widthPct,
                                height: '100%'
                              }}
                            ></div>
                          </div>

                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700, color: isPositive ? 'var(--red-accent)' : isNegative ? 'var(--cyan-accent)' : 'var(--text-secondary)' }}>
                            {attr.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rules Override Notice */}
                {predictionResult.triggeredRule && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    <ShieldAlert size={12} color="var(--red-accent)" />
                    <span style={{ color: 'var(--red-accent)' }}>Rule Override: {predictionResult.triggeredRule}</span>
                  </div>
                )}

                {/* Status Action Banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  {predictionResult.decision === 'BLOCK' ? (
                    <>
                      <ShieldAlert size={14} color="var(--red-accent)" />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Transaction halted immediately. Account flagged for manual review queue.
                      </span>
                    </>
                  ) : predictionResult.decision === 'FLAG' ? (
                    <>
                      <AlertTriangle size={14} color="var(--yellow-accent)" />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Transaction approved conditionally. Dispatched to review logs.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} color="var(--cyan-accent)" />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Verified. Passed through ledger safely.
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
