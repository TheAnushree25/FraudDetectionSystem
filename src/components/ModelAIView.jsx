import React, { useState } from 'react';
import { 
  Cpu, TrendingUp, Info, HelpCircle, ArrowRight,
  Shield, CheckCircle, AlertTriangle, Play
} from 'lucide-react';

const SHAP_MOCK_DATA = {
  highRisk: {
    id: 'TX-8040 (Elena R.)',
    finalRisk: 99,
    base: 10,
    features: [
      { name: 'Base Risk Probability', val: 10, type: 'neutral', label: '10%' },
      { name: 'Amount > $5k (High Vol)', val: 20, type: 'positive', label: '+20% risk' },
      { name: 'Device ID Spoofing Profile', val: 35, type: 'positive', label: '+35% risk' },
      { name: 'VPN/Proxy Active Exit IP', val: 15, type: 'positive', label: '+15% risk' },
      { name: 'Impossible Velocity Signature', val: 24, type: 'positive', label: '+24% risk' },
      { name: 'Trusted Account Age', val: -5, type: 'negative', label: '-5% risk' }
    ]
  },
  medRisk: {
    id: 'TX-8037 (Marcus V.)',
    finalRisk: 21,
    base: 10,
    features: [
      { name: 'Base Risk Probability', val: 10, type: 'neutral', label: '10%' },
      { name: 'Amount > $3k', val: 8, type: 'positive', label: '+8% risk' },
      { name: 'VPN Active (Corporate Node)', val: 15, type: 'positive', label: '+15% risk' },
      { name: 'Biometric Verified Device', val: -8, type: 'negative', label: '-8% risk' },
      { name: 'Known Location Match', val: -4, type: 'negative', label: '-4% risk' }
    ]
  },
  lowRisk: {
    id: 'TX-8039 (Sarah J.)',
    finalRisk: 3,
    base: 10,
    features: [
      { name: 'Base Risk Probability', val: 10, type: 'neutral', label: '10%' },
      { name: 'Amount < $200 (Low Vol)', val: -5, type: 'negative', label: '-5% risk' },
      { name: 'Device Fingerprint Match', val: -6, type: 'negative', label: '-6% risk' },
      { name: 'Standard ISP Gateway', val: -3, type: 'negative', label: '-3% risk' },
      { name: 'FaceID Handshake Complete', val: -4, type: 'negative', label: '-4% risk' }
    ]
  }
};

export default function ModelAIView() {
  const [selectedTxKey, setSelectedTxKey] = useState('highRisk');
  const activeSHAP = SHAP_MOCK_DATA[selectedTxKey];

  return (
    <div className="view-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Top Description Area */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={22} color="var(--cyan-accent)" style={{ filter: 'drop-shadow(0 0 5px var(--cyan-glow))' }} />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Model Explainability (XAI) & Synthetic Oversampling</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Deconstructing neural network decision boundary calculations using SHAP values, and evaluating SMOTE balance outcomes
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: SHAP Waterfall & SMOTE comparison */}
      <div className="model-ai-grid">
        
        {/* Left Side: Interactive SHAP Waterfall Diagram */}
        <div className="glass-panel shap-panel">
          <div className="panel-header">
            <div>
              <span className="panel-title">
                <Cpu size={16} /> Explainable AI (SHAP) Waterfall Chart
              </span>
              <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                Weighting individual transaction features in the final probability score
              </div>
            </div>

            {/* Quick selector for simulated records */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setSelectedTxKey('highRisk')}
                style={{
                  background: selectedTxKey === 'highRisk' ? 'var(--red-dim)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedTxKey === 'highRisk' ? 'var(--red-accent)' : 'var(--border-color)',
                  color: selectedTxKey === 'highRisk' ? 'var(--red-accent)' : 'var(--text-secondary)',
                  borderStyle: 'solid', borderWidth: '1px', borderRadius: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 8px', cursor: 'pointer'
                }}
              >
                High Risk (99%)
              </button>
              <button 
                onClick={() => setSelectedTxKey('medRisk')}
                style={{
                  background: selectedTxKey === 'medRisk' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedTxKey === 'medRisk' ? 'var(--yellow-accent)' : 'var(--border-color)',
                  color: selectedTxKey === 'medRisk' ? 'var(--yellow-accent)' : 'var(--text-secondary)',
                  borderStyle: 'solid', borderWidth: '1px', borderRadius: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 8px', cursor: 'pointer'
                }}
              >
                Medium Risk (21%)
              </button>
              <button 
                onClick={() => setSelectedTxKey('lowRisk')}
                style={{
                  background: selectedTxKey === 'lowRisk' ? 'var(--cyan-dim)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedTxKey === 'lowRisk' ? 'var(--cyan-accent)' : 'var(--border-color)',
                  color: selectedTxKey === 'lowRisk' ? 'var(--cyan-accent)' : 'var(--text-secondary)',
                  borderStyle: 'solid', borderWidth: '1px', borderRadius: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 8px', cursor: 'pointer'
                }}
              >
                Safe Passed (3%)
              </button>
            </div>
          </div>

          {/* Active Record Display */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Target Frame: <span style={{ color: 'var(--text-primary)' }}>{activeSHAP.id}</span></span>
            <span>Probability Result: <strong style={{ color: activeSHAP.finalRisk >= 80 ? 'var(--red-accent)' : activeSHAP.finalRisk >= 20 ? 'var(--yellow-accent)' : 'var(--cyan-accent)' }}>{activeSHAP.finalRisk}%</strong></span>
          </div>

          {/* SHAP Chart Rows */}
          <div className="shap-chart-container">
            {activeSHAP.features.map((feature, idx) => {
              const absVal = Math.abs(feature.val);
              // Calculate left align offset in percentage for waterfall logic
              // Simple visualization: center at 50%. Negatives extend left, Positives extend right.
              const isPositive = feature.type === 'positive';
              const isNegative = feature.type === 'negative';
              const widthPct = `${absVal * 1.5}%`;
              const leftPos = isPositive ? '50%' : `calc(50% - ${absVal * 1.5}%)`;

              return (
                <div key={idx} className="shap-bar-row">
                  <span className="shap-feature-name">{feature.name}</span>
                  <div className="shap-track">
                    {/* Zero reference line at 50% */}
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.15)', zIndex: 1 }}></div>
                    {/* Waterfall Bar */}
                    <div 
                      className={`shap-bar ${feature.type}`}
                      style={{ 
                        left: feature.type === 'neutral' ? '35%' : leftPos,
                        width: feature.type === 'neutral' ? '15%' : widthPct
                      }}
                    ></div>
                  </div>
                  <span className={`shap-val-text ${feature.type}`}>
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '20px', paddingTop: '12px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
            <span><strong style={{ color: 'var(--red-accent)' }}>■ Red Bars</strong> Increase risk probability score</span>
            <span><strong style={{ color: 'var(--cyan-accent)' }}>■ Cyan Bars</strong> Decrease risk probability score</span>
          </div>
        </div>

        {/* Right Side: SMOTE Impact Comparative Ring Charts */}
        <div className="glass-panel smote-panel">
          <div className="panel-header">
            <div>
              <span className="panel-title">
                <TrendingUp size={16} /> SMOTE Class Balancing Impact
              </span>
              <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                Resampling extreme data imbalance for high-precision validation
              </div>
            </div>
          </div>

          <div className="smote-charts-comparison">
            {/* Donut Chart 1: BEFORE SMOTE */}
            <div className="donut-chart-box">
              <span className="donut-chart-title">Before SMOTE (Imbalanced)</span>
              <div className="donut-visual-container">
                <svg className="donut-svg" width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="45" className="donut-underlay" />
                  {/* Safe: 99.1% (Circumference = 2*pi*45 = 282.7) */}
                  <circle 
                    cx="60" cy="60" r="45" 
                    className="donut-segment safe" 
                    strokeDasharray="280.1 282.7"
                  />
                  {/* Fraud: 0.9% */}
                  <circle 
                    cx="60" cy="60" r="45" 
                    className="donut-segment fraud" 
                    strokeDasharray="2.6 282.7"
                    strokeDashoffset="-280.1"
                  />
                </svg>
                <div className="donut-center-text">
                  <span className="donut-center-pct">99.1:0.9</span>
                  <span className="donut-center-lbl">Ratio</span>
                </div>
              </div>
              
              <div className="donut-legend">
                <div className="donut-legend-item">
                  <div className="legend-color safe"></div>
                  <span>Safe (99,100)</span>
                </div>
                <div className="donut-legend-item">
                  <div className="legend-color threat"></div>
                  <span>Fraud (900)</span>
                </div>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', lineHeight: '1.4' }}>
                Highly skewed training distribution. Model suffers from extreme bias toward false passes.
              </p>
            </div>

            {/* Donut Chart 2: AFTER SMOTE */}
            <div className="donut-chart-box" style={{ borderColor: 'rgba(6, 182, 212, 0.25)' }}>
              <span className="donut-chart-title" style={{ color: 'var(--cyan-accent)' }}>After SMOTE (Synthetic Balance)</span>
              <div className="donut-visual-container">
                <svg className="donut-svg" width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="45" className="donut-underlay" />
                  {/* Safe: 50.0% (stroke-dasharray = 141.35) */}
                  <circle 
                    cx="60" cy="60" r="45" 
                    className="donut-segment safe" 
                    strokeDasharray="141.35 282.7"
                  />
                  {/* Fraud: 50.0% */}
                  <circle 
                    cx="60" cy="60" r="45" 
                    className="donut-segment fraud" 
                    strokeDasharray="141.35 282.7"
                    strokeDashoffset="-141.35"
                  />
                </svg>
                <div className="donut-center-text">
                  <span className="donut-center-pct">50:50</span>
                  <span className="donut-center-lbl" style={{ color: 'var(--cyan-accent)' }}>Balanced</span>
                </div>
              </div>

              <div className="donut-legend">
                <div className="donut-legend-item">
                  <div className="legend-color safe"></div>
                  <span>Safe (99k)</span>
                </div>
                <div className="donut-legend-item">
                  <div className="legend-color threat"></div>
                  <span>Synth Fraud (99k)</span>
                </div>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', lineHeight: '1.4' }}>
                Synthetic oversampling creates uniform learning vectors, removing false negative bypass vectors.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Area: Confusion Matrix and performance improvements */}
      <div className="matrix-section">
        
        {/* Heatmap Grid */}
        <div className="glass-panel matrix-panel">
          <div className="panel-header">
            <div>
              <span className="panel-title">
                <Shield size={16} /> Validation Confusion Matrix Heatmap
              </span>
              <div className="panel-subtitle" style={{ marginTop: '4px' }}>
                Detailed classification distribution on 100,000 resampled transactions
              </div>
            </div>
          </div>

          <div className="matrix-heatmap">
            {/* Headers */}
            <div></div>
            <div className="matrix-label-top">Predicted Safe</div>
            <div className="matrix-label-top">Predicted Fraud</div>

            {/* Row 1 */}
            <div className="matrix-label-left-1">Actual Safe</div>
            {/* TN */}
            <div className="matrix-cell cyan-strong">
              <span className="matrix-cell-val">96,400</span>
              <span className="matrix-cell-lbl">True Negative (TN)</span>
            </div>
            {/* FP */}
            <div className="matrix-cell red-weak">
              <span className="matrix-cell-val">1,800</span>
              <span className="matrix-cell-lbl">False Positive (FP)</span>
            </div>

            {/* Row 2 */}
            <div className="matrix-label-left-2">Actual Fraud</div>
            {/* FN */}
            <div className="matrix-cell red-weak">
              <span className="matrix-cell-val">142</span>
              <span className="matrix-cell-lbl">False Negative (FN)</span>
            </div>
            {/* TP */}
            <div className="matrix-cell red-strong">
              <span className="matrix-cell-val">1,658</span>
              <span className="matrix-cell-lbl">True Positive (TP)</span>
            </div>
          </div>
        </div>

        {/* Model Accuracy Metrics Card */}
        <div className="glass-panel matrix-card-stat">
          <div className="panel-header" style={{ marginBottom: '10px' }}>
            <span className="panel-title">Model Quality Analytics</span>
          </div>

          <div className="matrix-stat-row">
            <span className="matrix-stat-label">Model Sensitivity (Recall)</span>
            <span className="matrix-stat-val green">92.1%</span>
          </div>
          <div className="matrix-stat-row">
            <span className="matrix-stat-label">False Positive Rate</span>
            <span className="matrix-stat-val" style={{ color: 'var(--cyan-accent)' }}>1.8%</span>
          </div>
          <div className="matrix-stat-row">
            <span className="matrix-stat-label">False Positive Reduction Rate</span>
            <span className="matrix-stat-val green">-15.4%</span>
          </div>
          <div className="matrix-stat-row">
            <span className="matrix-stat-label">ROC-AUC Score</span>
            <span className="matrix-stat-val green">0.994</span>
          </div>
          <div className="matrix-stat-row">
            <span className="matrix-stat-label">F1-Score</span>
            <span className="matrix-stat-val green">95.6%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--cyan-dim)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '6px', marginTop: '16px', fontSize: '11px' }}>
            <Info size={14} color="var(--cyan-accent)" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              The <strong>15.4% reduction in false positives</strong> stems from SMOTE integration, allowing higher merchant conversion rates without boosting risk vectors.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
