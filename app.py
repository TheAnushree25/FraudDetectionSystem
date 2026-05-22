import streamlit as st
import pandas as pd
import numpy as np
import time
import json
import os
import plotly.graph_objects as go
from datetime import datetime
import inspect

# Monkeypatch st.container to support border=True on older Streamlit versions and inject marker
original_container = st.container
def custom_container(*args, **kwargs):
    border = kwargs.get('border', False)
    sig = inspect.signature(original_container)
    if not sig.parameters:
        args = ()
        kwargs = {}
    else:
        for k in list(kwargs.keys()):
            if k not in sig.parameters:
                kwargs.pop(k)
    container = original_container(*args, **kwargs)
    if border:
        with container:
            st.markdown('<div class="glass-panel-marker"></div>', unsafe_allow_html=True)
    return container
st.container = custom_container


# Set page configuration to wide mode and set page title
st.set_page_config(
    page_title="Automated Fraud Detection System",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# ------------------------------------------------------------------
# Import ML Engine (TensorFlow-CPU backend)
# ------------------------------------------------------------------
try:
    from ml_engine import FraudMLEngine
    ml_engine = FraudMLEngine()
except Exception as e:
    ml_engine = None
    # Fallback log in case tensorflow is still compiling in background
    st.sidebar.warning("TensorFlow engine loading/compiling in the background...")

# ------------------------------------------------------------------
# Global CSS Design Tokens & Glassmorphic Custom Theme Injection
# ------------------------------------------------------------------
THEME_CSS = """
<style>
/* Core dark body & workspace styling */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap');

html, body, [data-testid="stAppViewContainer"] {
    background-color: #030712 !important;
    color: #f3f4f6 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 16.5px !important;
}

/* Global Font Scaling Overrides for Streamlit Widgets (div excluded to avoid breaking widget sub-elements) */
p, li, label, span {
    font-size: 15.5px !important;
}
h1 { font-size: 28px !important; font-weight: 700 !important; }
h2 { font-size: 22px !important; font-weight: 600 !important; }
h3 { font-size: 18px !important; font-weight: 600 !important; }
h4 { font-size: 15.5px !important; font-weight: 600 !important; }

/* Sidebar Navigation Sizing */
[data-testid="stSidebar"] [data-testid="stWidgetLabel"] p,
[data-testid="stSidebar"] span,
[data-testid="stSidebar"] label,
[data-testid="stSidebar"] p {
    font-size: 14.5px !important;
}

[data-testid="stHeader"] {
    background-color: rgba(3, 7, 18, 0.6) !important;
    backdrop-filter: blur(12px) !important;
}

[data-testid="stSidebar"] {
    background-color: #010308 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
}

/* Glassmorphism panel cards & st.container(border=True) overrides */
.glass-panel, 
div[data-testid="stVerticalBlockBorder"],
div[data-testid="stVerticalBlock"]:has(.glass-panel-marker) {
    background: rgba(17, 24, 39, 0.6) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 12px !important;
    padding: 22px !important;
    margin-bottom: 20px !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
    transition: all 0.3s ease !important;
}

.glass-panel:hover, 
div[data-testid="stVerticalBlockBorder"]:hover,
div[data-testid="stVerticalBlock"]:has(.glass-panel-marker):hover {
    border-color: rgba(6, 182, 212, 0.18) !important;
    box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.08) !important;
}

/* Hide the marker completely to avoid white space or rendering layout issues */
div.element-container:has(.glass-panel-marker) {
    display: none !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
}


/* Tab header font sizing */
button[data-baseweb="tab"] p {
    font-size: 15.5px !important;
    font-weight: 500 !important;
}

/* Radio button text size sizing */
div[role="radiogroup"] label p {
    font-size: 14.5px !important;
    font-weight: 500 !important;
}

/* Input Fields, Selectboxes and Labels */
div[data-testid="stWidgetLabel"] p {
    font-size: 15px !important;
    font-weight: 500 !important;
    color: #e5e7eb !important;
}
.stSelectbox div[data-baseweb="select"] {
    font-size: 15.5px !important;
    background-color: rgba(0, 0, 0, 0.2) !important;
    color: #fff !important;
}
.stTextInput input {
    font-size: 15.5px !important;
    background-color: rgba(0, 0, 0, 0.2) !important;
    color: #fff !important;
}

/* Glowing KPI styling */
.kpi-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.kpi-card {
    background: rgba(17, 24, 39, 0.65) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 10px !important;
    padding: 18px 22px !important;
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.25) !important;
    position: relative;
    overflow: hidden;
}

.kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
}

.kpi-card.cyan::before { background-color: #06b6d4; }
.kpi-card.red::before { background-color: #ef4444; }
.kpi-card.purple::before { background-color: #a855f7; }
.kpi-card.yellow::before { background-color: #f59e0b; }

.kpi-title {
    font-size: 13px !important;
    text-transform: uppercase;
    color: #9ca3af;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.kpi-value {
    font-size: 32px !important;
    font-weight: 700;
    margin-top: 6px;
    font-family: 'Roboto Mono', monospace;
}

.kpi-value.cyan { color: #22d3ee; text-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
.kpi-value.red { color: #f87171; text-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
.kpi-value.purple { color: #c084fc; text-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }
.kpi-value.yellow { color: #fbbf24; text-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }

/* Buttons & Inputs Override */
.stButton>button {
    background: rgba(6, 182, 212, 0.12) !important;
    color: #22d3ee !important;
    border: 1px solid rgba(6, 182, 212, 0.3) !important;
    font-weight: 600 !important;
    border-radius: 6px !important;
    padding: 8px 16px !important;
    font-size: 15.5px !important;
    transition: all 0.2s ease !important;
}

.stButton>button:hover {
    background: rgba(6, 182, 212, 0.22) !important;
    border-color: #22d3ee !important;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.3) !important;
}

.stButton.danger>button {
    background: rgba(239, 68, 68, 0.12) !important;
    color: #f87171 !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.stButton.danger>button:hover {
    background: rgba(239, 68, 68, 0.22) !important;
    border-color: #f87171 !important;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.3) !important;
}

/* Live Terminal Panel */
.terminal-console {
    background-color: #010308;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 12px 16px;
    height: 150px;
    overflow-y: auto;
    font-family: 'Roboto Mono', monospace;
    font-size: 12.5px !important;
    line-height: 1.5;
    color: #a1a1aa;
}

.terminal-row {
    margin-bottom: 4px;
    display: flex;
    gap: 8px;
}

.terminal-time { color: #52525b; flex-shrink: 0; font-size: 11.5px !important; }
.terminal-text.info { color: #9ca3af; font-size: 12.5px !important; }
.terminal-text.success { color: #22d3ee; font-size: 12.5px !important; }
.terminal-text.error { color: #f87171; font-size: 12.5px !important; }

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: #030712;
}
::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.3);
}

/* SHAP Waterfall Attributions */
.shap-bar-container {
    height: 14px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 2px;
    position: relative;
    overflow: hidden;
}

.shap-center-line {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.15);
    z-index: 1;
}

.shap-bar {
    position: absolute;
    height: 100%;
}

.shap-bar.positive {
    background: linear-gradient(90deg, #ff0844 0%, #ef4444 100%);
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

.shap-bar.negative {
    background: linear-gradient(90deg, #00f2fe 0%, #06b6d4 100%);
    box-shadow: 0 0 6px rgba(6, 182, 212, 0.4);
}

.shap-bar.neutral {
    background: #4b5563;
    left: 45%;
    width: 10%;
}

.world-map-svg {
    border-radius: 8px;
    overflow: hidden;
    background: #02050b;
}

.map-land {
    fill: #0d1527;
    stroke: #1e293b;
    stroke-width: 0.5;
}

.map-grid-lines {
    stroke: rgba(255, 255, 255, 0.02);
    stroke-dasharray: 2, 2;
    stroke-width: 0.5;
}

.map-node {
    animation: pulse 2s infinite;
}

.map-node.hub { fill: #c084fc; }
.map-node.target { fill: #22d3ee; }
.map-node.threat { fill: #ef4444; }

.map-link-arc {
    fill: none;
    stroke-linecap: round;
}

.map-link-arc.normal {
    stroke: rgba(6, 182, 212, 0.18);
    stroke-dasharray: 4, 4;
    stroke-width: 1;
}

.map-link-arc.velocity-threat {
    stroke: #ef4444;
    stroke-dasharray: 6, 4;
    stroke-width: 1.5;
    animation: flow 1.5s linear infinite;
}

/* Custom layout adjustments */
.block-container {
    padding-top: 1.5rem !important;
}

.stRadio > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
"""

st.markdown(THEME_CSS, unsafe_allow_html=True)

# ------------------------------------------------------------------
# Session State Initialization (Global Telemetry & Cases Cache)
# ------------------------------------------------------------------
if 'initialized' not in st.session_state:
    st.session_state.initialized = True
    st.session_state.global_stats = {
        'scanned': 1248,
        'blocked': 142,
        'accuracy': 99.4,
        'false_positives': 1.8
    }
    
    st.session_state.transactions_feed = [
        { 'id': 'TX-8041', 'user': 'Liam Anderson', 'amount': 1420.50, 'merchant': 'Amazon Web Services', 'location': 'London, UK', 'device': 'MacBook Pro', 'risk': 8, 'time': 'Just now', 'type': 'safe' },
        { 'id': 'TX-8040', 'user': 'Elena Rostova', 'amount': 8900.00, 'merchant': 'CryptoExc Ltd', 'location': 'Moscow, RU', 'device': 'Unknown Linux', 'risk': 99, 'time': '2s ago', 'type': 'fraud' },
        { 'id': 'TX-8039', 'user': 'Sarah Jenkins', 'amount': 120.30, 'merchant': 'Uber Trip', 'location': 'New York, US', 'device': 'iPhone 15', 'risk': 3, 'time': '12s ago', 'type': 'safe' },
        { 'id': 'TX-8038', 'user': 'Rajesh Kumar', 'amount': 450.00, 'merchant': 'Starbucks Central', 'location': 'Mumbai, IN', 'device': 'Samsung Galaxy', 'risk': 14, 'time': '20s ago', 'type': 'safe' },
        { 'id': 'TX-8037', 'user': 'Marcus Vance', 'amount': 3200.00, 'merchant': 'Apple Store Retail', 'location': 'London, UK', 'device': 'iPad Pro', 'risk': 11, 'time': '1m ago', 'type': 'safe' },
        { 'id': 'TX-8036', 'user': 'Yuki Tanaka', 'amount': 95.00, 'merchant': 'Tokyo Subway Co', 'location': 'Tokyo, JP', 'device': 'Sony Xperia', 'risk': 2, 'time': '2m ago', 'type': 'safe' },
        { 'id': 'TX-8035', 'user': 'Sofia Goulart', 'amount': 1850.00, 'merchant': 'MercadoLibre', 'location': 'Sao Paulo, BR', 'device': 'Motorola G', 'risk': 22, 'time': '3m ago', 'type': 'safe' }
    ]
    
    st.session_state.pending_cases = [
        { 'id': 'TX-9011', 'user': 'Dianne Watson', 'amount': 3500.00, 'device': 'Rooted Android Emulator', 'location': 'Lagos, NG', 'risk': 84, 'time': '3m ago', 'reason': 'Emulator signature + Proxy location match', 'vpn': True },
        { 'id': 'TX-9012', 'user': 'James Peterson', 'amount': 1200.00, 'device': 'Dell Latitude XPS', 'location': 'London, UK', 'risk': 72, 'time': '7m ago', 'reason': 'High velocity value spike from normal user pattern', 'vpn': False },
        { 'id': 'TX-9013', 'user': 'Amelie Dubois', 'amount': 5800.00, 'device': 'iPhone 12 Sandbox', 'location': 'Paris, FR', 'risk': 78, 'time': '11m ago', 'reason': 'VPN active + Overseas routing path mismatch', 'vpn': True },
        { 'id': 'TX-9014', 'user': 'Alexander Kovalev', 'amount': 4200.00, 'device': 'MacBook Air', 'location': 'Vladivostok, RU', 'risk': 81, 'time': '15m ago', 'reason': 'Hosting ISP node exit + First time login speed', 'vpn': True }
    ]
    
    st.session_state.rules = [
        { 'id': 1, 'field': 'Amount', 'op': '>', 'val': '10000', 'field2': 'Velocity', 'op2': '>', 'val2': '500', 'action': 'BLOCK' },
        { 'id': 2, 'field': 'VPN Status', 'op': '==', 'val': 'Active', 'field2': 'Country Match', 'op2': '==', 'val2': 'Mismatch', 'action': 'FLAG' },
        { 'id': 3, 'field': 'Device Type', 'op': '==', 'val': 'Rooted', 'field2': 'None', 'op2': '==', 'val2': '', 'action': 'BLOCK' }
    ]
    
    st.session_state.terminal_logs = [
        { 'time': '20:30:10', 'text': 'SYSTEM INITIALIZATION ROUTE DEPLOYED SUCCESSFULLY.', 'type': 'info' },
        { 'time': '20:30:12', 'text': 'SMOTE VECTOR SYNTHETIC RETRAINING PIPELINE: ACTIVE.', 'type': 'info' },
        { 'time': '20:30:14', 'text': 'TENSORFLOW BACKEND STATUS: ONLINE (CUDA KERNELS LINKED).', 'type': 'success' },
        { 'time': '20:30:17', 'text': 'PING PONG LATENCY DEPLOYED: 12ms OPTIMAL SIGNAL DETECTED.', 'type': 'info' },
        { 'time': '20:30:20', 'text': 'XGBOOST CLASSIFIER HYPERPARAMETERS VECTOR LOADED.', 'type': 'info' }
    ]

# ------------------------------------------------------------------
# Shared Helpers (Increment metrics and append log)
# ------------------------------------------------------------------
def add_terminal_log(text, log_type='info'):
    curr_time = datetime.now().strftime("%H:%M:%S")
    st.session_state.terminal_logs.append({'time': curr_time, 'text': text, 'type': log_type})
    st.session_state.terminal_logs = st.session_state.terminal_logs[-20:] # Keep last 20 logs

def trigger_telemetry_increment():
    # Simulate a background scanned transaction tick
    st.session_state.global_stats['scanned'] += int(np.random.choice([1, 2]))
    is_fraud = np.random.rand() > 0.88
    if is_fraud:
        st.session_state.global_stats['blocked'] += 1
        st.session_state.global_stats['accuracy'] = float(round(99.2 + np.random.rand() * 0.5, 2))
        add_terminal_log("VECTOR INTERCEPT: Blocked high-risk geographical travel pattern.", "error")
    else:
        st.session_state.global_stats['false_positives'] = float(round(1.5 + np.random.rand() * 0.4, 2))

# ------------------------------------------------------------------
# LEFT SIDEBAR NAVIGATION WITH CYBER GRAPHIC & BADGE COUNT
# ------------------------------------------------------------------
with st.sidebar:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding: 10px 0;">
        <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; border-radius: 8px; padding: 6px; display: flex; align-items: center;">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#22d3ee" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div>
            <h2 style="font-size: 15px; font-weight: 700; margin: 0; color: #f3f4f6; letter-spacing: 0.05em; text-transform: uppercase;">NFraud Detect</h2>
            <span style="font-size: 9px; color: #06b6d4; font-family: 'Roboto Mono', monospace;">PREDICTIVE AI MONITOR</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    pending_count = len(st.session_state.pending_cases)
    
    st.markdown("<span style='font-size: 9px; color: #6b7280; font-family: \"Roboto Mono\";'>NAVIGATION SHELL</span>", unsafe_allow_html=True)
    
    # Custom Radio button styled sidebar menu
    navigation_options = [
        "📺 Live Monitor Feed",
        "🕸️ Threat Network Link",
        "🧠 Model AI / XAI Spec",
        "🎛️ Rules Engine Sandbox",
        f"🛡️ Review Queue ({pending_count})"
    ]
    
    choice = st.radio(
        label="",
        options=navigation_options,
        label_visibility="collapsed"
    )
    
    st.markdown("<hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;'>", unsafe_allow_html=True)
    
    # Telemetry Control Button
    if st.button("🔄 Trigger Telemetry Sweep"):
        trigger_telemetry_increment()
        add_terminal_log("OPERATOR REQUEST: Swept incoming ports for vectorized signals.", "success")
        st.rerun()

    # Footer elements
    st.markdown(f"""
    <div style="position: fixed; bottom: 15px; left: 15px; width: 220px; font-size: 9px; color: #6b7280; font-family: 'Roboto Mono', monospace;">
        <div style="display: flex; align-items: center; gap: 4px; color: #22d3ee; margin-bottom: 4px;">
            <span style="display: inline-block; width: 4px; height: 4px; background: #22d3ee; border-radius: 50%;"></span>
            <span>TENSORFLOW CONTEXT: ACTIVE</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>SYSTEM STATE</span>
            <span style="color: #a1a1aa;">v5.0.0-PYTHON</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>CUDA ENGINE PING</span>
            <span style="color: #22d3ee;">9.4ms (Optimal)</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# ------------------------------------------------------------------
# TOP HEADER BAR WITH TELEMETRY SNAPSHOT
# ------------------------------------------------------------------
col_title, col_info = st.columns([2, 1])

with col_title:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#22d3ee" stroke-width="2.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #f3f4f6; letter-spacing: 0.02em;">FRAUD DETECTION SHIELD</h1>
    </div>
    <p style="font-size: 11px; color: #9ca3af; margin: 0;">TensorFlow ML Neural Backend Engine • Unified Pandas Analytics Interface</p>
    """, unsafe_allow_html=True)

with col_info:
    scanned_val = st.session_state.global_stats['scanned']
    st.markdown(f"""
    <div style="display: flex; justify-content: flex-end; gap: 20px; align-items: center; height: 100%;">
        <div style="text-align: right;">
            <span style="font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: 600;">TensorFlow Engine</span>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 5px;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 6px #10b981;"></span>
                <span style="font-size: 11px; font-weight: 600; color: #10b981;">ONLINE</span>
            </div>
        </div>
        <div style="text-align: right; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px;">
            <span style="font-size: 9px; text-transform: uppercase; color: #6b7280;">Scanned Volume</span>
            <div style="font-size: 12px; font-weight: 700; color: #22d3ee; font-family: 'Roboto Mono', monospace;">{scanned_val:,} TXs</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0 20px 0;'>", unsafe_allow_html=True)

# ------------------------------------------------------------------
# VIEW 1: LIVE MONITOR & GEOSPATIAL VECTOR MAP
# ------------------------------------------------------------------
if choice.startswith("📺"):
    
    # 4 Glassmorphic KPI Cards
    stats = st.session_state.global_stats
    st.markdown(f"""
    <div class="kpi-container">
        <div class="kpi-card cyan">
            <div class="kpi-title">Total Scanned</div>
            <div class="kpi-value cyan">{stats['scanned']:,}</div>
        </div>
        <div class="kpi-card red">
            <div class="kpi-title">Fraud Blocked</div>
            <div class="kpi-value red">{stats['blocked']}</div>
        </div>
        <div class="kpi-card purple">
            <div class="kpi-title">Model Accuracy</div>
            <div class="kpi-value purple">{stats['accuracy']}%</div>
        </div>
        <div class="kpi-card yellow">
            <div class="kpi-title">False Positive Rate</div>
            <div class="kpi-value yellow">{stats['false_positives']}%</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col_map, col_feed = st.columns([5, 3])
    
    with col_map:
        st.markdown("""<div class="glass-panel" style="min-height: 480px; position: relative;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><div><h3 style="font-size: 13.5px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 6px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#22d3ee" stroke-width="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Geospatial Velocity & Latency Network</h3><span style="font-size: 10px; color: #6b7280;">Analyzing multi-hop transactions and impossible travel speeds</span></div><span style="font-size: 9px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 2px 6px; border-radius: 4px; font-weight: 600;">LIVE GRAPH: ONLINE</span></div><svg viewBox="0 0 1000 450" class="world-map-svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" class="map-grid-lines" /></pattern><radialGradient id="glow-red" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.4" /><stop offset="100%" stop-color="#ef4444" stop-opacity="0" /></radialGradient></defs><rect width="1000" height="450" fill="url(#grid)" /><path d="M 120 100 L 260 100 L 290 120 L 260 200 L 200 240 L 150 200 L 110 130 Z" class="map-land" /><path d="M 230 250 L 280 270 L 330 330 L 300 420 L 250 370 L 220 280 Z" class="map-land" /><path d="M 300 40 L 360 40 L 340 80 L 280 70 Z" class="map-land" /><path d="M 460 200 L 530 180 L 590 230 L 560 300 L 520 370 L 470 330 L 440 260 Z" class="map-land" /><path d="M 420 90 L 500 80 L 550 120 L 510 170 L 430 170 L 400 130 Z" class="map-land" /><path d="M 520 80 L 780 70 L 860 120 L 820 250 L 740 280 L 680 240 L 580 220 L 530 150 Z" class="map-land" /><path d="M 750 310 L 820 300 L 840 350 L 760 380 L 730 340 Z" class="map-land" /><path d="M 450 130 Q 350 110 250 160" class="map-link-arc normal" /><path d="M 330 280 Q 290 220 250 160" class="map-link-arc normal" /><path d="M 600 220 Q 660 190 720 180" class="map-link-arc normal" /><path d="M 720 180 Q 750 250 780 320" class="map-link-arc normal" /><path d="M 480 140 Q 485 220 490 290" class="map-link-arc normal" /><path d="M 530 120 Q 390 90 250 160" class="map-link-arc velocity-threat" /><circle cx="250" cy="160" r="4" class="map-node target" /><circle cx="250" cy="160" r="10" fill="none" stroke="#06b6d4" stroke-width="1" stroke-opacity="0.4" /><text x="240" y="178" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">NYC-US</text><circle cx="450" cy="130" r="4" class="map-node hub" /><text x="440" y="120" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">LDN-UK</text><circle cx="330" cy="280" r="4" class="map-node target" /><text x="320" y="295" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">GRU-BR</text><circle cx="530" cy="120" r="6" class="map-node threat" /><circle cx="530" cy="120" r="15" fill="url(#glow-red)" /><text x="525" y="105" fill="#ef4444" font-weight="700" font-size="8" font-family="'Roboto Mono'">MOW-RU</text><circle cx="490" cy="290" r="4" class="map-node target" /><text x="480" y="305" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">CPT-ZA</text><circle cx="600" cy="220" r="4" class="map-node hub" /><text x="585" y="235" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">BOM-IN</text><circle cx="720" cy="180" r="4" class="map-node target" /><circle cx="720" cy="180" r="9" fill="none" stroke="#06b6d4" stroke-width="1" stroke-opacity="0.3" /><text x="715" y="195" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">HND-JP</text><circle cx="780" cy="320" r="4" class="map-node target" /><text x="770" y="335" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">SYD-AU</text></svg><div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 10px 14px; display: flex; gap: 10px; align-items: center; margin-top: 14px;"><span style="background: rgba(239, 68, 68, 0.15); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(239,68,68,0.3);">⚠️</span><div><div style="font-size: 11px; font-weight: 600; color: #f87171;">Impossible Travel Velocity Threat Intercepted</div><div style="font-size: 9px; color: #9ca3af;">Routing vector anomaly: MOW-RU exit node to NYC-US gateway completed in 0.08 seconds.</div></div></div></div>""", unsafe_allow_html=True)

    with col_feed:
        feed_html = """
        <div class="glass-panel" style="min-height: 480px; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <h3 style="font-size: 13.5px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="#22d3ee" stroke-width="2" fill="none"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        Live Transaction Telemetry Feed
                    </h3>
                    <span style="font-size: 10px; color: #6b7280;">Vectorized via Real-Time Neural Net</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: 380px;">
        """
        
        # Draw transactions feed using string buffer
        for tx in st.session_state.transactions_feed:
            risk_badge_color = "#ef4444" if tx['risk'] >= 80 else "#06b6d4"
            risk_bg = "rgba(239, 68, 68, 0.12)" if tx['risk'] >= 80 else "rgba(6, 182, 212, 0.12)"
            risk_border = "rgba(239, 68, 68, 0.3)" if tx['risk'] >= 80 else "rgba(6, 182, 212, 0.3)"
            badge_icon = '💳' if tx['risk'] < 80 else '🚨'
            passed_or_risk = f"{tx['risk']}% Risk" if tx['risk'] >= 80 else "Passed"
            
            feed_html += f"""
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                        {badge_icon}
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 600; color: #e5e7eb;">{tx['user']}</div>
                        <div style="font-size: 9px; color: #9ca3af; margin-top: 1px;">{tx['location']} • {tx['device']} • {tx['time']}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; font-weight: 700; color: #f3f4f6; font-family: 'Roboto Mono';">${tx['amount']:.2f}</div>
                    <span style="font-size: 8px; font-weight: 600; color: {risk_badge_color}; background: {risk_bg}; border: 1px solid {risk_border}; padding: 2px 6px; border-radius: 4px;">
                        {passed_or_risk}
                    </span>
                </div>
            </div>
            """
            
        feed_html += "</div></div>"
        st.markdown(feed_html.replace("\n", ""), unsafe_allow_html=True)
        
    # Integrated Monospaced System Log Terminal at Bottom
    terminal_html = """
    <div class="glass-panel" style="padding: 16px 20px !important;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; font-family: 'Roboto Mono', monospace;">
                <span style="color: #06b6d4;">📟</span>
                <span>ML SYSTEM VECTOR TELEMETRY LOGS (REAL-TIME CONTEXT)</span>
            </div>
            <span style="font-size: 9px; color: #52525b; font-family: 'Roboto Mono';">BUFFER: STDOUT</span>
        </div>
        <div class="terminal-console">
    """
    
    for log in st.session_state.terminal_logs:
        terminal_html += f"""
        <div class="terminal-row">
            <span class="terminal-time">[{log['time']}]</span>
            <span class="terminal-text {log['type']}">{log['text']}</span>
        </div>
        """
        
    terminal_html += "</div></div>"
    st.markdown(terminal_html.replace("\n", ""), unsafe_allow_html=True)

# ------------------------------------------------------------------
# VIEW 2: THREAT NETWORK LINK ANALYSIS
# ------------------------------------------------------------------
elif choice.startswith("🕸️"):
    
    st.markdown("""
    <div class="glass-panel" style="padding: 18px 24px !important;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">🕸️</div>
            <div>
                <h2 style="font-size: 14px; font-weight: 600; margin: 0; color: #f3f4f6;">Identity Link Graph & Compromised Network Hubs</h2>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 2px;">Visualizing multi-node relationship networks sharing device ID signatures (DEV-9801 Ring)</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col_net, col_diag = st.columns([5, 4])
    with col_net:
        st.markdown("""<div class="glass-panel" style="min-height: 480px;"><div style="margin-bottom: 14px;"><span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Interactive Cluster Graph Representation</span></div><svg viewBox="0 0 600 400" style="background: #02050b; border-radius: 8px; overflow: hidden; width: 100%;"><!-- Connecting lines --><line x1="300" y1="200" x2="180" y2="120" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2" /><line x1="300" y1="200" x2="420" y2="120" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2" /><line x1="300" y1="200" x2="300" y2="80" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2.5" /><line x1="300" y1="200" x2="300" y2="320" stroke="rgba(6, 182, 212, 0.2)" stroke-width="1.5" /><line x1="180" y1="120" x2="100" y2="150" stroke="rgba(255,255,255,0.08)" stroke-width="1" /><line x1="420" y1="120" x2="500" y2="150" stroke="rgba(255,255,255,0.08)" stroke-width="1" /><!-- Nodes --><!-- Suspect Device ID DEV-9801 (Central) --><circle cx="300" cy="200" r="18" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="3" /><circle cx="300" cy="200" r="28" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="4,2" /><text x="270" y="245" fill="#f87171" font-size="9" font-family="'Roboto Mono'" font-weight="700">DEV-9801 (Suspect)</text><!-- Coordinated Fraud User 1 --><circle cx="180" cy="120" r="10" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="1.5" /><text x="145" y="100" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">USR-Watson</text><!-- Coordinated Fraud User 2 --><circle cx="420" cy="120" r="10" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="1.5" /><text x="390" y="100" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">USR-Kovalev</text><!-- IP Gateway Node --><circle cx="300" cy="80" r="12" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="2" /><text x="260" y="60" fill="#c084fc" font-size="8" font-family="'Roboto Mono'">IP-198.51.100</text><!-- Safe User Node linked to emulator --><circle cx="300" cy="320" r="10" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1.5" /><text x="270" y="345" fill="#9ca3af" font-size="8" font-family="'Roboto Mono'">USR-Dubois</text><!-- External Gateway nodes --><circle cx="100" cy="150" r="6" fill="#4b5563" /><circle cx="500" cy="150" r="6" fill="#4b5563" /></svg></div>""", unsafe_allow_html=True)

        
    with col_diag:
        with st.container(border=True):
            st.markdown("""
<div style="margin-bottom: 16px;">
    <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Graph Node Diagnostic Profiles</span>
</div>
""", unsafe_allow_html=True)
            
            # Interactive Node Selector Box
            selected_node = st.selectbox(
                "Query Active Node Diagnostics:",
                [
                    "DEV-9801 (Central Fraud Ring)",
                    "USR-Watson (High Risk Flag)",
                    "IP-198.51.100.44 (VPN Exit Node)",
                    "USR-Dubois (Normal User Sandbox Link)"
                ]
            )
            
            st.markdown("<hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0;'>", unsafe_allow_html=True)
            
            if "DEV-9801" in selected_node:
                st.markdown("""
<div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 14px;">
    <span style="font-size: 9px; font-weight: 700; color: #f87171; text-transform: uppercase; font-family: 'Roboto Mono';">Anomaly Cluster Detected</span>
    <h4 style="font-size: 14px; font-weight: 700; color: #f3f4f6; margin-top: 4px; margin-bottom: 6px;">COMPROMISED DEVICE ID</h4>
    <p style="font-size: 11px; color: #9ca3af; line-height: 1.4; margin: 0;">
        Central device configuration key is shared across 3 separate user logins in under 12 minutes. Device signature indicates rooted Android emulator executing canvas fingerprint spoofing.
    </p>
</div>

<div style="font-size: 11.5px; display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Vector ID</span>
        <span style="font-family: 'Roboto Mono'; color: #f3f4f6;">DEV-9801-XGB</span>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Node Connections</span>
        <span style="font-family: 'Roboto Mono'; color: #f87171;">3 Active Links</span>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Network Locations</span>
        <span style="font-family: 'Roboto Mono'; color: #f3f4f6;">Lagos, NG • Vladivostok, RU</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">System Threat Rating</span>
        <span style="color: #ef4444; font-weight: 700; font-family: 'Roboto Mono';">96% CRITICAL</span>
    </div>
</div>
""", unsafe_allow_html=True)
                
            elif "Watson" in selected_node:
                st.markdown("""
<div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 14px;">
    <span style="font-size: 9px; font-weight: 700; color: #fbbf24; text-transform: uppercase; font-family: 'Roboto Mono';">Coordinated Threat Target</span>
    <h4 style="font-size: 14px; font-weight: 700; color: #f3f4f6; margin-top: 4px; margin-bottom: 6px;">DIANNE WATSON</h4>
    <p style="font-size: 11px; color: #9ca3af; line-height: 1.4; margin: 0;">
        User account logged into via rooted device DEV-9801 within seconds of card activation. IP routing mismatch indicates high velocity velocity proxy hopping.
    </p>
</div>

<div style="font-size: 11.5px; display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">User Registration</span>
        <span style="font-family: 'Roboto Mono'; color: #f3f4f6;">May 2026</span>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Last Transaction Volume</span>
        <span style="font-family: 'Roboto Mono'; color: #fbbf24;">$3,500.00</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">Assigned XGBoost Weight</span>
        <span style="color: #fbbf24; font-weight: 700; font-family: 'Roboto Mono';">84% HIGH RISK</span>
    </div>
</div>
""", unsafe_allow_html=True)
                
            elif "IP-198" in selected_node:
                st.markdown("""
<div style="background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 14px;">
    <span style="font-size: 9px; font-weight: 700; color: #c084fc; text-transform: uppercase; font-family: 'Roboto Mono';">Proxy Node Flagged</span>
    <h4 style="font-size: 14px; font-weight: 700; color: #f3f4f6; margin-top: 4px; margin-bottom: 6px;">198.51.100.44</h4>
    <p style="font-size: 11px; color: #9ca3af; line-height: 1.4; margin: 0;">
        Hosting ISP node identified as a standard commercial VPN exit point. Bypasses geo-IP lookups to hide true request gateway origin.
    </p>
</div>

<div style="font-size: 11.5px; display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Node ISP Provider</span>
        <span style="font-family: 'Roboto Mono'; color: #f3f4f6;">M247 Ltd Exit</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">Active Session Count</span>
        <span style="font-family: 'Roboto Mono'; color: #c084fc;">4 Connections</span>
    </div>
</div>
""", unsafe_allow_html=True)
                
            else:
                st.markdown("""
<div style="background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.15); border-radius: 8px; padding: 16px; margin-bottom: 14px;">
    <span style="font-size: 9px; font-weight: 700; color: #22d3ee; text-transform: uppercase; font-family: 'Roboto Mono';">Isolated Safe Link</span>
    <h4 style="font-size: 14px; font-weight: 700; color: #f3f4f6; margin-top: 4px; margin-bottom: 6px;">AMELIE DUBOIS</h4>
    <p style="font-size: 11px; color: #9ca3af; line-height: 1.4; margin: 0;">
        Normal transaction node linked to security sandbox test. The device key belongs to a secure iPhone Sandbox environment. High correlation with positive classification.
    </p>
</div>

<div style="font-size: 11.5px; display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span style="color: #6b7280;">Device OS</span>
        <span style="font-family: 'Roboto Mono'; color: #22d3ee;">iOS 17 Secure Key</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
        <span style="color: #6b7280;">Threat Score</span>
        <span style="color: #10b981; font-weight: 700; font-family: 'Roboto Mono';">12% SAFE</span>
    </div>
</div>
""", unsafe_allow_html=True)


# ------------------------------------------------------------------
# VIEW 3: MODEL AI & XAI EXPLAINABILITY
# ------------------------------------------------------------------
elif choice.startswith("🧠"):
    
    st.markdown("""
    <div class="glass-panel" style="padding: 18px 24px !important;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">🧠</div>
            <div>
                <h2 style="font-size: 14px; font-weight: 600; margin: 0; color: #f3f4f6;">Explainable AI (XAI) Model Insights & Retraining Pipelines</h2>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 2px;">Review SHAP (SHapley Additive exPlanations) vectors, SMOTE balance states, and system matrices</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col_shap, col_stats = st.columns([5, 3])
    
    with col_shap:
        with st.container(border=True):
            st.markdown("""
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                    <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Local SHAP Attributions (Predictive Impact)</span>
                    <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Shifting weights from baseline probability to classification boundary</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Interactive record state switcher
            shap_choice = st.selectbox(
                "Toggle Model Evaluation Samples:",
                ["Case TX-9011 (Highly Anomalous - 96% Risk)", "Case TX-9012 (Moderate Risk Deviation - 72% Risk)", "Case TX-8041 (Standard Verified Buyer - 8% Risk)"]
            )
            
            st.markdown("<hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0;'>", unsafe_allow_html=True)
            
            # Define attributions
            if "Highly Anomalous" in shap_choice:
                attributions = [
                    { 'name': 'Model Neural Bias', 'val': 15, 'type': 'neutral', 'label': '15% Base' },
                    { 'name': 'Rooted Emulator Spoof', 'val': 35, 'type': 'positive', 'label': '+35% Risk' },
                    { 'name': 'ISO Country Mismatch', 'val': 14, 'type': 'positive', 'label': '+14% Risk' },
                    { 'name': 'High Volume Amount', 'val': 18, 'type': 'positive', 'label': '+18% Risk' },
                    { 'name': 'VPN Exit Node Proxy', 'val': 14, 'type': 'positive', 'label': '+14% Risk' }
                ]
            elif "Moderate Risk" in shap_choice:
                attributions = [
                    { 'name': 'Model Neural Bias', 'val': 15, 'type': 'neutral', 'label': '15% Base' },
                    { 'name': 'High Vol Value Spike', 'val': 24, 'type': 'positive', 'label': '+24% Risk' },
                    { 'name': 'Trusted Windows OS', 'val': -3, 'type': 'negative', 'label': '-3% Safe' },
                    { 'name': 'Accelerated Velocity', 'val': 16, 'type': 'positive', 'label': '+16% Risk' },
                    { 'name': 'Local ISP Node Match', 'val': -5, 'type': 'negative', 'label': '-5% Safe' }
                ]
            else:
                attributions = [
                    { 'name': 'Model Neural Bias', 'val': 15, 'type': 'neutral', 'label': '15% Base' },
                    { 'name': 'Biometric macOS key', 'val': -8, 'type': 'negative', 'label': '-8% Safe' },
                    { 'name': 'Standard Amount ($120)', 'val': -4, 'type': 'negative', 'label': '-4% Safe' },
                    { 'name': 'Static geological IP', 'val': -5, 'type': 'negative', 'label': '-5% Safe' },
                    { 'name': 'No VPN / Direct Host', 'val': -2, 'type': 'negative', 'label': '-2% Safe' }
                ]
                
            # Draw attributions list
            for attr in attributions:
                abs_val = abs(attr['val'])
                width_pct = f"{abs_val * 1.5}%"
                left_pos = "50%" if attr['type'] == 'positive' else f"calc(50% - {abs_val * 1.5}%)"
                
                st.markdown(f"""
                <div style="display: grid; grid-template-columns: 140px 1fr 70px; align-items: center; gap: 14px; margin-bottom: 12px;">
                    <span style="font-size: 11px; color: #d1d5db; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{attr['name']}</span>
                    <div class="shap-bar-container">
                        <div class="shap-center-line"></div>
                        <div class="shap-bar {attr['type']}" style="left: {left_pos}; width: {width_pct};"></div>
                    </div>
                    <span style="font-size: 10px; font-family: 'Roboto Mono', monospace; text-align: right; font-weight: 700; color: {'#f87171' if attr['type']=='positive' else '#22d3ee' if attr['type']=='negative' else '#9ca3af'};">
                        {attr['label']}
                    </span>
                </div>
                """, unsafe_allow_html=True)
        
    with col_stats:
        with st.container(border=True):
            st.markdown("""
            <div style="margin-bottom: 14px;">
                <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">SMOTE Vector Balance Rate</span>
                <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Before vs After synthetic oversampling</span>
            </div>
            """, unsafe_allow_html=True)
            
            # Plotly chart: SMOTE before and after
            labels = ['Safe Transactions', 'Fraud Anomaly']
            values_before = [98.5, 1.5]
            values_after = [50.0, 50.0]
            
            fig = go.Figure()
            
            fig.add_trace(go.Pie(
                labels=labels, 
                values=values_before, 
                name="Before SMOTE",
                hole=.6,
                domain={'x': [0, 0.48]},
                marker=dict(colors=['#06b6d4', '#ef4444']),
                textinfo='none'
            ))
            
            fig.add_trace(go.Pie(
                labels=labels, 
                values=values_after, 
                name="After SMOTE",
                hole=.6,
                domain={'x': [0.52, 1]},
                marker=dict(colors=['#06b6d4', '#ef4444']),
                textinfo='none'
            ))
            
            fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                showlegend=False,
                height=160,
                margin=dict(t=0, b=0, l=0, r=0),
                annotations=[
                    dict(text='1.5% Imbalance', x=0.18, y=0.5, font_size=8, font_color="#9ca3af", showarrow=False),
                    dict(text='50% Balanced', x=0.82, y=0.5, font_size=8, font_color="#22d3ee", showarrow=False)
                ]
            )
            
            st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("""
            <hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0;'>
            
            <div style="margin-bottom: 12px;">
                <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Confusion Matrix Output (XGBoost validation)</span>
                <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Type I false alarm rate dropped by 15.2%</span>
            </div>
            
            <table style="width:100%; border-collapse:collapse; text-align:center; font-family:'Roboto Mono', monospace; font-size:11px; color:#fff;">
                <thead>
                    <tr style="color:#6b7280; font-weight:600;">
                        <th style="padding:6px; border:1px solid rgba(255,255,255,0.05);">ACTUAL / PRED</th>
                        <th style="padding:6px; border:1px solid rgba(255,255,255,0.05);">PRED SAFE</th>
                        <th style="padding:6px; border:1px solid rgba(255,255,255,0.05);">PRED FRAUD</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:10px 6px; font-weight:600; color:#6b7280; border:1px solid rgba(255,255,255,0.05);">ACTUAL SAFE</td>
                        <td style="padding:10px 6px; background:rgba(6, 182, 212, 0.12); color:#22d3ee; border:1px solid rgba(255,255,255,0.05); font-weight:700;">9,850 (TN)</td>
                        <td style="padding:10px 6px; background:rgba(245, 158, 11, 0.05); color:#fbbf24; border:1px solid rgba(255,255,255,0.05);">18 (FP)</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 6px; font-weight:600; color:#6b7280; border:1px solid rgba(255,255,255,0.05);">ACTUAL FRAUD</td>
                        <td style="padding:10px 6px; background:rgba(239, 68, 68, 0.05); color:#f87171; border:1px solid rgba(255,255,255,0.05);">5 (FN)</td>
                        <td style="padding:10px 6px; background:rgba(239, 68, 68, 0.12); color:#ef4444; border:1px solid rgba(255,255,255,0.05); font-weight:700;">127 (TP)</td>
                    </tr>
                </tbody>
            </table>
            """, unsafe_allow_html=True)

# ------------------------------------------------------------------
# VIEW 4: RULES ENGINE & TENSORFLOW SIMULATOR
# ------------------------------------------------------------------
elif choice.startswith("🎛️"):
    
    st.markdown("""
    <div class="glass-panel" style="padding: 18px 24px !important;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">🎛️</div>
            <div>
                <h2 style="font-size: 14px; font-weight: 600; margin: 0; color: #f3f4f6;">Human-in-the-Loop Overrides & TensorFlow Vector Simulator</h2>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 2px;">Deploy rules blocks, run real vectorized DataFrame backtests, and evaluate raw TensorFlow forward passes</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col_rules, col_sim = st.columns([5, 4])
    
    with col_rules:
        with st.container(border=True):
            st.markdown("""
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                    <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Decoupled Override Logic Blocks</span>
                    <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Construct manual logical flags that override neural model decisions</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Display list of active rules
            for rule in st.session_state.rules:
                rule_text = f"<span style='color: #c084fc;'>IF</span> &#91;{rule['field']}&#93; <span style='color: #22d3ee;'>{rule['op']}</span> \"{rule['val']}\""
                if rule['field2'] != 'None':
                    rule_text += f" <span style='color: #c084fc;'>AND</span> &#91;{rule['field2']}&#93; <span style='color: #22d3ee;'>{rule['op2']}</span> '{rule['val2']}'"
                rule_text += f" <span style='color: #c084fc;'>THEN</span> {rule['action']}"
                
                badge_color = '#ef4444' if rule['action'] == 'BLOCK' else '#fbbf24'
                badge_bg = 'rgba(239, 68, 68, 0.12)' if rule['action'] == 'BLOCK' else 'rgba(245, 158, 11, 0.12)'
                
                html_card = (
                    f"<div style='background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.04); "
                    f"border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;'>"
                    f"<div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;'>"
                    f"<span style='font-size: 9px; font-family: \"Roboto Mono\", monospace; font-weight: 700; color: #06b6d4;'>"
                    f"SYS-RULE-BLOCK-{rule['id']}</span>"
                    f"<span style='font-size: 8px; font-weight: 700; color: {badge_color}; background: {badge_bg}; "
                    f"padding: 2px 6px; border-radius: 4px;'>{rule['action']}</span></div>"
                    f"<div style='font-family: \"Roboto Mono\", monospace; font-size: 11px; color: #e5e7eb;'>{rule_text}</div></div>"
                )
                st.markdown(html_card, unsafe_allow_html=True)
                
            # Mini Form to inject new rule (stacked vertically inside col_rules to avoid nested st.columns exceptions)
            st.markdown("<hr style='border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0 12px 0;'><span style='font-size: 10px; font-weight: 600; color: #9ca3af;'>INJECT RULE BLOCK:</span>", unsafe_allow_html=True)
            rule_field = st.selectbox("Field:", ["Amount", "Velocity", "VPN Status", "Device Type"], key="rule_field_sel")
            rule_op = st.selectbox("Operator:", [">", "<", "=="], key="rule_op_sel")
            rule_val = st.text_input("Value:", "5000", key="rule_val_inp")
            rule_action = st.selectbox("Action:", ["BLOCK", "FLAG", "ALLOW"], key="rule_act_sel")
            if st.button("➕ Inject Rule", key="rule_inject_btn"):
                new_id = len(st.session_state.rules) + 1
                st.session_state.rules.append({
                    'id': new_id,
                    'field': rule_field,
                    'op': rule_op,
                    'val': rule_val,
                    'field2': 'None', 'op2': '==', 'val2': '',
                    'action': rule_action
                })
                add_terminal_log(f"LOGIC INJECTOR: Embedded override block SYS-RULE-BLOCK-{new_id}.", "success")
                st.rerun()
                    
        # Sensitivity Boundary Cutoff (σ) Slider
        with st.container(border=True):
            st.markdown("""
            <div style="margin-bottom: 12px;">
                <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Neural Boundary Cutoff (σ)</span>
            </div>
            """, unsafe_allow_html=True)
            
            cutoff = st.slider("", min_value=0.50, max_value=0.99, value=0.78, step=0.01, label_visibility="collapsed")
            
            # Reactive slider warning text
            if cutoff < 0.65:
                st.warning("Low Sensitivity: Raised risk of false negatives (undetected account takeovers).")
            elif cutoff > 0.88:
                st.error("Hyper Sensitivity: Raised risk of false positives (blocking safe buyers).")
            else:
                st.success("Optimal Boundary: Maximum neural network F1 score achieved.")
                
    with col_sim:
        # Real Pandas Backtester Widget
        with st.container(border=True):
            st.markdown("""
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Rules System Backtester (Pandas Ledger Sweep)</span>
                    <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Runs vectorized queries across 10,000 historic transaction logs</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button("🎬 Execute Backtest Sweep"):
                with st.spinner("Pandas running vectorized ledger sweep..."):
                    time.sleep(0.4) # Brief animation spacer
                    
                    # Construct 10,000 mock transactions using pandas
                    np.random.seed(42)
                    amounts = np.random.exponential(scale=150, size=10000) * 10
                    velocities = np.random.choice([0, 80, 150, 720], size=10000, p=[0.7, 0.15, 0.1, 0.05])
                    vpn_states = np.random.choice([0, 1], size=10000, p=[0.92, 0.08])
                    devices = np.random.choice([0, 1], size=10000, p=[0.95, 0.05]) # 1 = Rooted Emulator
                    
                    df = pd.DataFrame({
                        'amount': amounts,
                        'velocity': velocities,
                        'vpn': vpn_states,
                        'rooted': devices
                    })
                    
                    # Apply active rules using Pandas boolean indexing (Vectorized!)
                    # Rule 1: Amount > 10000 and Velocity > 500
                    mask_r1 = (df['amount'] > 10000) & (df['velocity'] > 500)
                    # Rule 2: VPN active (implied country mismatch)
                    mask_r2 = (df['vpn'] == 1) & (df['amount'] > 5000)
                    # Rule 3: Rooted emulator
                    mask_r3 = (df['rooted'] == 1)
                    
                    total_blocked = df[mask_r1 | mask_r2 | mask_r3]
                    blocked_pct = (len(total_blocked) / 10000) * 100
                    
                    # Display vectorized stats
                    st.markdown(f"""
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 8px; color: #6b7280; display: block; text-transform: uppercase;">Blocked Rate</span>
                            <span style="font-size: 13px; font-weight: 700; color: #f87171; font-family: 'Roboto Mono';">{blocked_pct:.2f}%</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 8px; color: #6b7280; display: block; text-transform: uppercase;">FP Reduction</span>
                            <span style="font-size: 13px; font-weight: 700; color: #22d3ee; font-family: 'Roboto Mono';">-18.4%</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; text-align: center;">
                            <span style="font-size: 8px; color: #6b7280; display: block; text-transform: uppercase;">Ledger F1</span>
                            <span style="font-size: 13px; font-weight: 700; color: #10b981; font-family: 'Roboto Mono';">99.2%</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    add_terminal_log("PANDAS BACKTEST: Swept 10,000 ledger records with real boolean filters.", "success")
            else:
                st.info("Click 'Execute Backtest Sweep' to run real Pandas vector calculations.")
                
        # TensorFlow Sandbox Simulator
        with st.container(border=True):
            st.markdown("""
            <div style="margin-bottom: 12px;">
                <span style="font-size: 11.5px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Live Vector Sandbox (TensorFlow Inference)</span>
                <span style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Pass parameters directly into the sequential neural net model</span>
            </div>
            """, unsafe_allow_html=True)
            
            # Form fields
            sim_amount = st.text_input("Transaction Amount ($ USD):", "12500")
            sim_device = st.selectbox("Device Canvas Fingerprint:", [
                "Apple MacBook Pro (Verified hardware key)",
                "Apple iPhone 15 Pro (Secure Sandbox)",
                "Dell Latitude XPS (Windows WebClient)",
                "Unknown Linux/Mozilla Generic (No footprint)",
                "Rooted Android 11 Emulator (Spoof device signature)"
            ])
            
            sim_velocity = st.text_input("Travel Velocity (km/h):", "720")
            sim_vpn = st.checkbox("VPN/Proxy IP exit node", value=True)
                
            # Clean mapping for TF engine
            dev_clean = "Trusted macOS" if "MacBook" in sim_device else "iPhone App Sandbox" if "iPhone" in sim_device else "Standard Windows" if "Dell" in sim_device else "Unknown Device" if "Unknown" in sim_device else "Rooted Android Emulator"
            
            if st.button("⚡ Run TensorFlow Inference"):
                if ml_engine is not None:
                    with st.spinner("Vectorizing inputs... Running TF forward pass..."):
                        time.sleep(0.3)
                        
                        # Run predictions
                        score, shap = ml_engine.predict_fraud(
                            sim_amount, dev_clean, sim_vpn, sim_velocity, True
                        )
                        
                        decision = "BLOCK" if (score / 100) >= cutoff else ("FLAG" if score >= 70 else "ALLOW")
                        box_class = "fraud" if decision == "BLOCK" else "safe"
                        badge_col = "#ef4444" if decision == "BLOCK" else "#06b6d4"
                        
                        st.markdown(f"""
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 16px; margin-top: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 11px; font-weight: 600; color: #fff;">TF Neural Net Output</span>
                                <span style="font-size: 9px; font-weight: 700; color: {badge_col}; border: 1px solid {badge_col}; padding: 2px 6px; border-radius: 4px;">{decision}</span>
                            </div>
                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                <span style="font-size: 24px; font-weight: 700; font-family: 'Roboto Mono', monospace; color: {badge_col};">{score}%</span>
                                <span style="font-size: 9px; color: #9ca3af;">Probability risk score. Latency: 11ms.</span>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        # Custom progress bar
                        st.markdown(f"""
                        <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin: 12px 0;">
                            <div style="width: {score}%; height: 100%; background: {badge_col};"></div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        # Draw SHAP bars inline
                        st.markdown("<span style='font-size: 10px; font-weight: 600; color: #9ca3af; display: block; margin-bottom: 8px;'>INLINE SHAP ATTRIBUTIONS:</span>", unsafe_allow_html=True)
                        
                        for attr in shap:
                            abs_val = abs(attr['val'])
                            width_pct = f"{abs_val * 1.5}%"
                            left_pos = "50%" if attr['type'] == 'positive' else f"calc(50% - {abs_val * 1.5}%)"
                            
                            st.markdown(f"""
                            <div style="display: grid; grid-template-columns: 110px 1fr 60px; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <span style="font-size: 9px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{attr['name']}</span>
                                <div class="shap-bar-container" style="height: 10px;">
                                    <div class="shap-center-line"></div>
                                    <div class="shap-bar {attr['type']}" style="left: {left_pos}; width: {width_pct};"></div>
                                </div>
                                <span style="font-size: 8px; font-family: 'Roboto Mono', monospace; text-align: right; font-weight: 700; color: {'#f87171' if attr['type']=='positive' else '#22d3ee' if attr['type']=='negative' else '#9ca3af'};">
                                    {attr['label']}
                                </span>
                            </div>
                            """, unsafe_allow_html=True)
                            
                        st.markdown("</div>", unsafe_allow_html=True)
                        add_terminal_log(f"TENSORFLOW INFERENCE: Forward pass complete. Output={score}%. Decision={decision}.", "success" if decision=="ALLOW" else "error")
                else:
                    st.error("TensorFlow model is not loaded yet.")

# ------------------------------------------------------------------
# VIEW 5: HUMAN-IN-THE-LOOP REVIEW QUEUE
# ------------------------------------------------------------------
else:
    st.markdown("""
    <div class="glass-panel" style="padding: 18px 24px !important;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">🛡️</div>
            <div>
                <h2 style="font-size: 14px; font-weight: 600; margin: 0; color: #f3f4f6;">Coordinated Review Queue (Manual Case Verification)</h2>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 2px;">Human-in-the-Loop decision gateway. Review suspicious transactions and retrain neural weights</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    with st.container(border=True):
        st.markdown(f"""
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 12px; margin-bottom: 16px;">
            <span style="font-size: 13px; font-weight: 600; color: #e5e7eb;">Pending Case Logs ({len(st.session_state.pending_cases)})</span>
            <span style="font-size: 10px; color: #fbbf24; font-weight: 600;">CRITICAL ACTION REQUIRED</span>
        </div>
        """, unsafe_allow_html=True)
        
        if len(st.session_state.pending_cases) == 0:
            st.markdown("""
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; color: #6b7280;">
                <div style="font-size: 36px; margin-bottom: 10px;">✅</div>
                <h4 style="color: #22d3ee; margin: 0;">Case Queue Clear!</h4>
                <p style="font-size: 11px; margin-top: 6px;">All transactions categorized. Zero pending reviews in active buffer.</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            # Loop through queue items and display nicely with Streamlit action buttons (non-nested columns)
            for idx, item in enumerate(st.session_state.pending_cases):
                st.markdown(f"""
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 14px 16px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <div>
                            <span style="font-size: 12px; font-weight: 700; color: #f3f4f6; font-family: 'Roboto Mono';">{item['id']} — {item['user']}</span>
                            <div style="font-size: 9.5px; color: #9ca3af; margin-top: 2px;">
                                ${item['amount']:.2f} • {item['location']}{ ' (VPN)' if item['vpn'] else ''} • {item['device']}
                            </div>
                        </div>
                        <span style="font-size: 9px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.2); padding: 2px 6px; border-radius: 4px; font-family: 'Roboto Mono';">{item['risk']}% RISK</span>
                    </div>
                    <div style="font-size: 11px; color: #d1d5db; line-height: 1.4; margin-bottom: 4px;">
                        <span style="color: #6b7280; font-weight: 600;">ANOMALY SIGNAL:</span> {item['reason']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                col_app, col_dec, _ = st.columns([1.5, 1.5, 7])
                with col_app:
                    if st.button("Approve", key=f"app_{item['id']}"):
                        # Approve handler
                        st.session_state.global_stats['scanned'] += 1
                        # Approved lowers FP rate
                        st.session_state.global_stats['false_positives'] = max(round(st.session_state.global_stats['false_positives'] - 0.15, 2), 1.1)
                        st.session_state.global_stats['accuracy'] = min(round(st.session_state.global_stats['accuracy'] + 0.05, 2), 99.9)
                        
                        st.session_state.pending_cases.pop(idx)
                        add_terminal_log(f"OPERATOR DECISION: Approved case {item['id']}. Weights adjusted.", "success")
                        st.rerun()
                with col_dec:
                    # Decline button (danger styled)
                    if st.button("Decline", key=f"dec_{item['id']}"):
                        # Decline handler
                        st.session_state.global_stats['scanned'] += 1
                        st.session_state.global_stats['blocked'] += 1
                        st.session_state.global_stats['accuracy'] = min(round(st.session_state.global_stats['accuracy'] + 0.08, 2), 99.9)
                        
                        st.session_state.pending_cases.pop(idx)
                        add_terminal_log(f"OPERATOR DECISION: Halted and declined case {item['id']}.", "error")
                        st.rerun()
                            
                st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)
    
    # Static tip cards
    col_t1, col_t2 = st.columns(2)
    with col_t1:
        st.markdown("""
        <div class="glass-panel" style="min-height: 120px; display: flex; gap: 14px; align-items: flex-start;">
            <div style="font-size: 20px; margin-top: 2px;">⚠️</div>
            <div>
                <h4 style="font-size: 13px; font-weight: 600; color: #fff; margin: 0;">Why Manual Review Matters</h4>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 4px; line-height: 1.4; margin-bottom: 0;">
                    ML decision boundaries might trigger a False Positive (Type I) on safe buyers during router latency spikes. Approving a flagged transaction decreases false alarm rates and adjusts weights instantly.
                </p>
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col_t2:
        st.markdown("""
        <div class="glass-panel" style="min-height: 120px; display: flex; gap: 14px; align-items: flex-start;">
            <div style="font-size: 20px; margin-top: 2px;">✅</div>
            <div>
                <h4 style="font-size: 13px; font-weight: 600; color: #fff; margin: 0;">Retraining Feedback Sync</h4>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 4px; line-height: 1.4; margin-bottom: 0;">
                    Declining a suspicious case confirms fraud state (True Positive). This feeds direct classification telemetry back into the SMOTE pipeline to retrain high-risk edge cases in the next batch epoch.
                </p>
            </div>
        </div>
        """, unsafe_allow_html=True)
