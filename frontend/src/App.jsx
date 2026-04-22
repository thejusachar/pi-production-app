import { useState, useEffect, useCallback } from 'react'

// In production the Nginx proxy forwards /api → backend.
// In dev Vite's proxy does the same (see vite.config.js).
const API = '/api'

const STATUS_FLOW = {
  pending:     'in_progress',
  in_progress: 'done',
  done:        null,          // no further transition
}

const STATUS_LABEL = {
  pending:     'Pending',
  in_progress: 'In Progress',
  done:        'Done',
}

const NEXT_LABEL = {
  pending:     '▶ Start',
  in_progress: '✓ Complete',
}

export default function App() {
  const [orders, setOrders]     = useState([])
  const [version, setVersion]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [newProduct, setNewProduct] = useState('')
  const [newQty, setNewQty]         = useState(1)
  const [saving, setSaving]         = useState(false)

  // ── LED state ────────────────────────────────────────────────────────────
  const [ledOn, setLedOn]               = useState(false)
  const [gpioAvailable, setGpioAvailable] = useState(null)
  const [ledBusy, setLedBusy]           = useState(false)

  // ── Fetch orders ────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOrders(await res.json())
      setError('')
    } catch (e) {
      setError('Could not reach the backend. Is Docker running? (' + e.message + ')')
    }
  }, [])

  // ── Fetch LED state ──────────────────────────────────────────────────────
  const fetchLed = useCallback(async () => {
    try {
      const res = await fetch(`${API}/gpio/led`)
      if (!res.ok) return
      const data = await res.json()
      setLedOn(data.on)
      setGpioAvailable(data.gpio_available)
    } catch (_) {}
  }, [])

  // ── Health check + initial load ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setVersion(d.version))
      .catch(() => {})

    fetchOrders().finally(() => setLoading(false))
    fetchLed()

    // Poll LED state every 2 seconds to stay in sync with physical pin
    const interval = setInterval(fetchLed, 2000)
    return () => clearInterval(interval)
  }, [fetchOrders, fetchLed])

  // ── Toggle LED ───────────────────────────────────────────────────────────
  const toggleLed = async () => {
    setLedBusy(true)
    try {
      const res = await fetch(`${API}/gpio/led`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: !ledOn }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLedOn(data.on)
    } catch (e) {
      setError('Failed to control LED: ' + e.message)
    } finally {
      setLedBusy(false)
    }
  }

  // ── Add order ────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newProduct.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: newProduct.trim(), quantity: Number(newQty) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const created = await res.json()
      setOrders(prev => [...prev, created])
      setNewProduct('')
      setNewQty(1)
    } catch (e) {
      setError('Failed to create order: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Advance status ───────────────────────────────────────────────────────
  const advanceStatus = async (order) => {
    const next = STATUS_FLOW[order.status]
    if (!next) return
    try {
      const res = await fetch(`${API}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated = await res.json()
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    } catch (e) {
      setError('Failed to update order: ' + e.message)
    }
  }

  // ── Delete order ─────────────────────────────────────────────────────────
  const deleteOrder = async (id) => {
    try {
      await fetch(`${API}/orders/${id}`, { method: 'DELETE' })
      setOrders(prev => prev.filter(o => o.id !== id))
    } catch (e) {
      setError('Failed to delete order: ' + e.message)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header>
        <span style={{ fontSize: '1.8rem' }}>🏭</span>
        <h1>Production Order Tracker</h1>
        {version && <span className="version">v{version}</span>}
      </header>

      {error && <div className="notice error">{error}</div>}

      {/* ── LED Control Card ── */}
      <div className="led-card">
        <div className="led-left">
          <div className={`led-bulb ${ledOn ? 'led-on' : 'led-off'}`} />
          <div>
            <div className="led-title">GPIO 21 — LED</div>
            <div className="led-status">{ledOn ? 'ON' : 'OFF'}</div>
            {gpioAvailable === false && (
              <div className="led-mock">⚠ Mock mode (no GPIO hardware)</div>
            )}
          </div>
        </div>
        <button
          className={`btn-toggle ${ledOn ? 'btn-toggle-on' : 'btn-toggle-off'}`}
          onClick={toggleLed}
          disabled={ledBusy}
        >
          {ledBusy ? '…' : ledOn ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>

      {/* ── Add Order Form ── */}
      <div className="add-form">
        <h2>New Production Order</h2>
        <form onSubmit={handleAdd} className="fields">
          <input
            type="text"
            placeholder="Product name (e.g. Gear Assembly A)"
            value={newProduct}
            onChange={e => setNewProduct(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Qty"
            value={newQty}
            min={1}
            onChange={e => setNewQty(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Adding…' : '+ Add Order'}
          </button>
        </form>
      </div>

      {/* ── Orders List ── */}
      <div className="orders-section">
        <h2>Orders ({orders.length})</h2>

        {loading && <div className="notice loading">Loading orders…</div>}

        {!loading && orders.length === 0 && (
          <div className="empty">No production orders yet. Add one above!</div>
        )}

        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <span className="name">{order.product_name}</span>
              <span className="qty">Qty: {order.quantity}</span>
              <span className={`badge ${order.status}`}>{STATUS_LABEL[order.status]}</span>
              <div className="actions">
                {STATUS_FLOW[order.status] && (
                  <button className="btn-sm btn-primary" onClick={() => advanceStatus(order)}>
                    {NEXT_LABEL[order.status]}
                  </button>
                )}
                <button className="btn-sm btn-danger" onClick={() => deleteOrder(order.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
