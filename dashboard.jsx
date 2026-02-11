import { useState, useEffect } from "react";

// ── Data Engine ───────────────────────────────────────────────
function gen(prev) {
  const now = Date.now();
  const btc = (prev?.oracle?.price || 97400) + (Math.random() - 0.48) * 80;
  const open = prev?.open ? [...prev.open] : [];
  const closed = prev?.closed ? [...prev.closed] : [];

  if (open.length < 3 && Math.random() > 0.55) {
    const d = Math.random() > 0.45 ? "UP" : "DOWN";
    const conf = 0.6 + Math.random() * 0.4;
    const ep = 0.4 + Math.random() * 0.2;
    const sz = parseFloat((5 + Math.random() * 20).toFixed(2));
    const exp = new Date(now + 900000 - Math.random() * 600000);
    open.push({ id: `${Date.now()}${d[0]}`, d, conf, ep, sz, btc: btc.toFixed(2), t: new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), exp: exp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), expTs: exp.getTime(), uPnl: 0 });
  }

  const still = [];
  for (const p of open) {
    if (now > p.expTs) {
      const w = Math.random() < 0.54;
      closed.unshift({ ...p, win: w, pnl: w ? p.sz * 0.8 : -p.sz, ct: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
    } else {
      p.uPnl = p.sz * ((Math.random() - 0.48) * 0.15);
      still.push(p);
    }
  }

  const wins = closed.filter(p => p.win).length, losses = closed.length - wins;
  const rPnl = closed.reduce((s, p) => s + p.pnl, 0);
  const cap = 1000 + rPnl;
  const eq = prev?.eq || [{ t: now - 3600000, v: 1000 }];
  eq.push({ t: now, v: cap + still.reduce((s, p) => s + p.uPnl, 0) });
  if (eq.length > 200) eq.shift();

  const sig = () => ({ d: Math.random() > 0.5 ? "UP" : "DN", s: Math.random() * 0.8 + 0.2 });
  const min = new Date().getMinutes(), sec = new Date().getSeconds();
  const secs = Math.max(0, (((Math.floor(min / 15) + 1) * 15 - min - 1) * 60 + (60 - sec)) % 900 - 60);
  const arbHit = Math.random() > 0.93;
  const windowOpen = btc - (Math.random() - 0.5) * 100;
  const drift = ((btc - windowOpen) / windowOpen) * 100;

  return {
    open: still, closed: closed.slice(0, 50), eq,
    oracle: { price: btc.toFixed(2), chainlink: (btc + Math.random() * 5 - 2.5).toFixed(2), src: 3 },
    sigs: { pvo: { d: drift > 0 ? "UP" : "DN", s: Math.min(1, Math.abs(drift) / 0.2), v: drift }, mom: sig(), rsi: { ...sig(), val: (30 + Math.random() * 40).toFixed(1) }, macd: sig(), ema: sig() },
    stats: { wins, losses, wr: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0.0", pnl: rPnl.toFixed(2), cap: cap.toFixed(2), total: wins + losses, wagered: closed.reduce((s, p) => s + p.sz, 0).toFixed(2) },
    risk: { dt: wins + losses, streak: Math.floor(Math.random() * 3) },
    secs, arbHit, windowOpen: windowOpen.toFixed(2), drift: drift.toFixed(4),
  };
}

// ── Spark ─────────────────────────────────────────────────────
function Spark({ data, w = 500, h = 60 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.v);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - mn) / rng) * (h - 8) - 4}`).join(" ");
  const up = vals[vals.length - 1] >= vals[0];
  const c = up ? "#16a34a" : "#dc2626";
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity=".15" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sf)" />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#1e293b", accent, border }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: `2px solid ${border || "#e2e8f0"}`, position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />}
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Signal Row ────────────────────────────────────────────────
function SigRow({ label, d, s, extra }) {
  const up = d === "UP";
  const pct = Math.round(s * 100);
  const c = up ? "#16a34a" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: up ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: c, flexShrink: 0 }}>{up ? "▲" : "▼"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{label}</div>
        {extra && <div style={{ fontSize: 10, color: "#94a3b8" }}>{extra}</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{d} {pct}%</div>
    </div>
  );
}

// ── Trade Row ─────────────────────────────────────────────────
function TradeRow({ p, closed = false }) {
  const up = p.d === "UP";
  const pnl = closed ? (p.pnl || 0) : (p.uPnl || 0);
  const pc = pnl >= 0 ? "#16a34a" : "#dc2626";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "56px 50px 1fr 56px 64px 56px", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12, alignItems: "center" }}>
      <span style={{ color: "#94a3b8" }}>{closed ? p.ct : p.t}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ width: 18, height: 18, borderRadius: 4, background: up ? "#dcfce7" : "#fee2e2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: up ? "#16a34a" : "#dc2626" }}>{up ? "▲" : "▼"}</span>
        <span style={{ fontWeight: 600, color: "#334155", fontSize: 11 }}>{p.d}</span>
      </span>
      <span style={{ color: "#64748b" }}>${p.sz.toFixed(2)} <span style={{ color: "#cbd5e1" }}>@</span> {p.ep.toFixed(3)}</span>
      <span style={{ color: "#94a3b8", textAlign: "right" }}>{(p.conf * 100).toFixed(0)}%</span>
      <span style={{ fontWeight: 700, color: pc, textAlign: "right" }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</span>
      {closed
        ? <span style={{ textAlign: "right", fontWeight: 700, fontSize: 10, padding: "2px 6px", borderRadius: 4, background: p.win ? "#dcfce7" : "#fee2e2", color: p.win ? "#16a34a" : "#dc2626", display: "inline-block" }}>{p.win ? "WIN" : "LOSS"}</span>
        : <span style={{ textAlign: "right", fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>{p.exp}</span>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────
function Toggle({ label, on, onClick, color = "#16a34a" }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${on ? color : "#e2e8f0"}`, background: on ? `${color}10` : "#fff", cursor: "pointer", transition: "all .2s" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: on ? color : "#cbd5e1", transition: "all .2s" }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: on ? color : "#94a3b8" }}>{label}</span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [d, setD] = useState(() => gen(null));
  const [tick, setTick] = useState(0);
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState("open");
  const [arb, setArb] = useState(true);
  const [hedge, setHedge] = useState(false);

  useEffect(() => {
    if (!on) return;
    const iv = setInterval(() => { setD(p => gen(p)); setTick(t => t + 1); }, 3000);
    return () => clearInterval(iv);
  }, [on]);

  const pnl = parseFloat(d.stats.pnl);
  const pnlC = pnl >= 0 ? "#16a34a" : "#dc2626";
  const uPnl = d.open.reduce((s, p) => s + p.uPnl, 0);
  const tm = `${Math.floor(d.secs / 60)}:${String(d.secs % 60).padStart(2, "0")}`;
  const tmC = d.secs < 60 ? "#dc2626" : d.secs < 240 ? "#f59e0b" : "#16a34a";

  return (
    <div style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#1e293b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>

      {/* ── Hero Banner ── */}
      <div style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 40%, #0d9488 100%)", padding: "20px 28px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.01em" }}>BTC-15M</span>
              <span style={{ padding: "2px 8px", borderRadius: 12, background: "rgba(255,255,255,0.15)", fontSize: 10, fontWeight: 700, letterSpacing: ".04em" }}>ORACLE</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 12, background: on ? "rgba(255,255,255,0.2)" : "rgba(255,100,100,0.3)", marginLeft: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: on ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>{on ? "LIVE" : "OFF"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Toggle label="ARB" on={arb} onClick={() => setArb(!arb)} color="#fff" />
              <Toggle label="HEDGE" on={hedge} onClick={() => setHedge(!hedge)} color="#fff" />
              <button onClick={() => setOn(!on)} style={{ padding: "5px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>{on ? "STOP" : "START"}</button>
            </div>
          </div>

          {/* Hero stat */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginBottom: 4 }}>Total Profit · Cycle {tick}</div>
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{pnl >= 0 ? "+" : ""}${d.stats.pnl}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{d.stats.total} Bets Placed · ${d.stats.wagered} Wagered</div>
          </div>

          {/* Hero sub-stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { l: "Win Rate", v: `${d.stats.wr}%` },
              { l: "BTC Price", v: `$${parseFloat(d.oracle.price).toLocaleString()}` },
              { l: "Next Entry", v: tm },
              { l: "Avg Profit/Bet", v: d.stats.total > 0 ? `$${(pnl / d.stats.total).toFixed(2)}` : "$0.00" },
            ].map(x => (
              <div key={x.l} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>{x.l}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 24px" }}>

        {/* ── Stat Cards Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <StatCard label="Bankroll" value={`$${parseFloat(d.stats.cap).toLocaleString()}`} sub="Available balance" accent="#16a34a" border="#bbf7d0" />
          <StatCard label="Realized P&L" value={`${pnl >= 0 ? "+" : ""}$${d.stats.pnl}`} color={pnlC} sub={`${d.stats.wins}W – ${d.stats.losses}L`} accent={pnlC} border={pnl >= 0 ? "#bbf7d0" : "#fecaca"} />
          <StatCard label="Unrealized" value={`${uPnl >= 0 ? "+" : ""}$${uPnl.toFixed(2)}`} color={uPnl >= 0 ? "#16a34a" : "#dc2626"} sub={`${d.open.length} open positions`} border="#e2e8f0" />
          <StatCard label="Window Open" value={`$${parseFloat(d.windowOpen).toLocaleString()}`} sub={`Drift: ${d.drift > 0 ? "+" : ""}${d.drift}%`} accent="#6366f1" border="#c7d2fe" />
          <StatCard label="Daily Risk" value={`${d.risk.dt}/20`} color="#f59e0b" sub={`Streak: ${d.risk.streak}`} accent="#f59e0b" border="#fde68a" />
        </div>

        {/* Arb alert */}
        {arb && d.arbHit && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💰</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Arbitrage Detected</div>
              <div style={{ fontSize: 11, color: "#a16207" }}>UP + DOWN &lt; 0.98 · Buying both sides · ~2.3% edge</div>
            </div>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Equity */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Equity Curve</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: pnlC }}>{pnl >= 0 ? "+" : ""}{d.stats.pnl}</span>
              </div>
              <Spark data={d.eq} />
            </div>

            {/* Trades */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px", flex: 1 }}>
              <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
                {[{ id: "open", l: `Open (${d.open.length})` }, { id: "closed", l: `History (${d.closed.length})` }].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    padding: "6px 16px", border: "none", background: tab === t.id ? "#f1f5f9" : "none",
                    borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
                    color: tab === t.id ? "#1e293b" : "#94a3b8", transition: "all .15s",
                  }}>{t.l}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "56px 50px 1fr 56px 64px 56px", fontSize: 10, fontWeight: 600, color: "#94a3b8", padding: "0 0 6px", borderBottom: "1.5px solid #e2e8f0", letterSpacing: ".03em", textTransform: "uppercase" }}>
                <span>Time</span><span>Dir</span><span>Size</span><span style={{ textAlign: "right" }}>Conf</span><span style={{ textAlign: "right" }}>P&L</span><span style={{ textAlign: "right" }}>{tab === "closed" ? "Result" : "Exp"}</span>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {tab === "open"
                  ? (d.open.length === 0
                    ? <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Waiting for entry window...</div>
                    : d.open.map(p => <TradeRow key={p.id} p={p} closed={false} />))
                  : (d.closed.length === 0
                    ? <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No history yet</div>
                    : d.closed.map((p, i) => <TradeRow key={i} p={p} closed={true} />))
                }
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Signals */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Signal Array</div>
              <SigRow label="Price vs Open" d={d.sigs.pvo.d} s={d.sigs.pvo.s} extra={`Drift: ${d.sigs.pvo.v > 0 ? "+" : ""}${d.sigs.pvo.v.toFixed(4)}%`} />
              <SigRow label="Momentum" d={d.sigs.mom.d} s={d.sigs.mom.s} />
              <SigRow label="RSI" d={d.sigs.rsi.d} s={d.sigs.rsi.s} extra={`RSI: ${d.sigs.rsi.val}`} />
              <SigRow label="MACD" d={d.sigs.macd.d} s={d.sigs.macd.s} />
              <SigRow label="EMA Cross" d={d.sigs.ema.d} s={d.sigs.ema.s} />
              <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                Price vs Open has <span style={{ fontWeight: 700, color: "#6366f1" }}>35% weight</span> · anchored to Chainlink BTC/USD resolution oracle
              </div>
            </div>

            {/* Engines */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Engines</div>
              {[
                { n: "Directional", on: true, c: "#16a34a" },
                { n: "Arbitrage", on: arb, c: "#f59e0b" },
                { n: "Hedge", on: hedge, c: "#6366f1" },
              ].map(m => (
                <div key={m.n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.on ? m.c : "#e2e8f0", transition: "all .2s" }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: m.on ? "#334155" : "#94a3b8" }}>{m.n}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: m.on ? `${m.c}15` : "#f1f5f9", color: m.on ? m.c : "#94a3b8" }}>{m.on ? "ACTIVE" : "OFF"}</span>
                </div>
              ))}
            </div>

            {/* Config */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Config</div>
              {[
                ["Market", "BTC 15m Up/Down"],
                ["Oracle", "Chainlink BTC/USD"],
                ["Confidence", "≥ 60%"],
                ["Max Trade", "$25"],
                ["Kelly", "0.25×"],
                ["Fee Threshold", "~1.5%"],
                ["Arb Threshold", "0.98"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace", color: "#475569" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "#cbd5e1" }}>
          BTC-15M-ORACLE v2.0 · Chainlink resolution · entries :59/:14/:29/:44 · py-clob-client
        </div>
      </div>
    </div>
  );
}
