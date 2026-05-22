import React, { useState } from 'react';
import { 
  ShieldAlert, UserCheck, UserX, Globe, Smartphone, 
  Clock, ShieldCheck, ArrowRight, ShieldAlert as WarningIcon
} from 'lucide-react';

const INITIAL_QUEUE = [
  { id: 'TX-9011', user: 'Dianne Watson', amount: 3500.00, device: 'Rooted Android Emulator', location: 'Lagos, NG', risk: 84, time: '3m ago', reason: 'Emulator signature + Proxy location match', vpn: true },
  { id: 'TX-9012', user: 'James Peterson', amount: 1200.00, device: 'Dell Latitude XPS', location: 'London, UK', risk: 72, time: '7m ago', reason: 'High velocity value spike from normal user pattern', vpn: false },
  { id: 'TX-9013', user: 'Amelie Dubois', amount: 5800.00, device: 'iPhone 12 Sandbox', location: 'Paris, FR', risk: 78, time: '11m ago', reason: 'VPN active + Overseas routing path mismatch', vpn: true },
  { id: 'TX-9014', user: 'Alexander Kovalev', amount: 4200.00, device: 'MacBook Air', location: 'Vladivostok, RU', risk: 81, time: '15m ago', reason: 'Hosting ISP node exit + First time login speed', vpn: true }
];

export default function ReviewQueueView({ onApprove, onDecline }) {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [actionedId, setActionedId] = useState(null);
  const [actionedType, setActionedType] = useState(''); // 'approved' or 'declined'

  const handleAction = (id, type) => {
    setActionedId(id);
    setActionedType(type);

    const targetTx = queue.find(t => t.id === id);

    setTimeout(() => {
      // Trigger global state callbacks
      if (type === 'approve') {
        onApprove(targetTx.amount);
      } else {
        onDecline(targetTx.amount);
      }

      // Remove from visual queue
      setQueue(prev => prev.filter(t => t.id !== id));
      setActionedId(null);
      setActionedType('');
    }, 800);
  };

  return (
    <div className="view-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={22} color="var(--yellow-accent)" style={{ filter: 'drop-shadow(0 0 5px var(--yellow-glow))' }} />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Coordinated Review Queue (Manual Case Verification)</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Human-in-the-Loop decision gateway. Review suspicious transactions flagged by XGBoost models and update active weights
            </p>
          </div>
        </div>
      </div>

      {/* Main Review Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
          <span className="panel-title">
            Pending Case Logs ({queue.length})
          </span>
          <span className="panel-subtitle" style={{ color: 'var(--yellow-accent)' }}>Critical Action Required</span>
        </div>

        {queue.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} color="var(--cyan-accent)" style={{ marginBottom: '14px', filter: 'drop-shadow(0 0 8px var(--cyan-glow))' }} />
            <h3>Case Queue Clear!</h3>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>All transactions have been classified. Zero pending reviews in active buffer.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <th style={{ padding: '12px 8px' }}>Case Reference</th>
                  <th style={{ padding: '12px 8px' }}>User Context</th>
                  <th style={{ padding: '12px 8px' }}>Device Signature</th>
                  <th style={{ padding: '12px 8px' }}>Network Location</th>
                  <th style={{ padding: '12px 8px' }}>XGBoost Score</th>
                  <th style={{ padding: '12px 8px' }}>Attribution Trigger</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Review Decision</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const isActioning = actionedId === item.id;
                  
                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        background: isActioning 
                          ? (actionedType === 'approve' ? 'rgba(6, 182, 212, 0.05)' : 'rgba(239, 68, 68, 0.05)')
                          : 'transparent',
                        opacity: isActioning ? 0.75 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Case ID */}
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.id}
                      </td>

                      {/* User & Amount */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.user}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>

                      {/* Device */}
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Smartphone size={13} style={{ opacity: 0.6 }} />
                          <span>{item.device}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe size={13} style={{ opacity: 0.6 }} />
                          <span>{item.location} {item.vpn && <span style={{ color: 'var(--purple-accent)', fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>(VPN)</span>}</span>
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        <span style={{ 
                          color: 'var(--red-accent)',
                          background: 'var(--red-dim)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {item.risk}% Risk
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', maxWidth: '240px', lineHeight: '1.3' }}>
                        {item.reason}
                      </td>

                      {/* Decision buttons */}
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        {isActioning ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: actionedType === 'approve' ? 'var(--cyan-accent)' : 'var(--red-accent)' }}>
                            <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                            <span>{actionedType === 'approve' ? 'MARKING SAFE...' : 'BLOCKING TARGET...'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                              onClick={() => handleAction(item.id, 'approve')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--cyan-dim)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--cyan-accent)', fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease'
                              }}
                              className="approve-btn"
                              title="Approve transaction and mark false alarm"
                            >
                              <UserCheck size={13} />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => handleAction(item.id, 'decline')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--red-dim)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--red-accent)', fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease'
                              }}
                              className="decline-btn"
                              title="Decline transaction and block user"
                            >
                              <UserX size={13} />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual review tip card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px' }}>
          <WarningIcon size={20} color="var(--yellow-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Why Manual Review Matters</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
              ML decision boundary calculations might trigger a False Positive (Type I) on safe buyers during network router spikes or holiday travel. Approving a flagged transaction decreases false alarm rates and retraining weights immediately.
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px' }}>
          <ShieldCheck size={20} color="var(--cyan-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Coordinated Rettigen Sync</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
              Declining a suspicious case immediately confirms fraud state (True Positive). This feeds direct classification telemetry back into the SMOTE pipeline to retrain high-risk edge cases in the next batch epoch.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
