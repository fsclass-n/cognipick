import { useCallback, useEffect, useState } from 'react'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'cognipick.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const toast = (message, type = 'info') => window.dispatchEvent(new CustomEvent('cognipick:toast', { detail: { message, type } }))

export class ApiError extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data }
}

const detailText = (d) => (typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join(', ') : '요청을 처리하지 못했습니다.')

export async function api(path, { method = 'GET', body, silent = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.', 0)
  }
  const data = await res.json().catch(() => null)
  if (method !== 'GET') cache.clear()
  if (!res.ok) {
    const err = new ApiError(detailText(data?.detail), res.status, data)
    if (res.status === 403 && data?.read_only && !silent) toast(err.message, 'warn')
    if (res.status === 401 && token) window.dispatchEvent(new Event('cognipick:unauthorized'))
    throw err
  }
  return data
}

const cache = new Map()
const TTL = 60_000
export const invalidate = () => cache.clear()

/** GET 데이터 훅: loading / error / reload 상태를 일관되게 제공 */
export function useApi(path, enabled = true) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!enabled || !path) return
    let alive = true
    const key = `${tokenStore.get() || ''}|${path}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.t < TTL && tick === 0) { setState({ data: hit.data, loading: false, error: null }); return }
    setState((s) => ({ ...s, loading: true, error: null }))
    api(path, { silent: true })
      .then((data) => { cache.set(key, { data, t: Date.now() }); if (alive) setState({ data, loading: false, error: null }) })
      .catch((error) => alive && setState({ data: null, loading: false, error }))
    return () => { alive = false }
  }, [path, enabled, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

export async function streamChat(message, { onSources, onDelta }) {
  const token = tokenStore.get()
  const res = await fetch(`${API_BASE}/api/tutor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ message }),
  })
  if (!res.ok || !res.body) throw new ApiError('AI 튜터 응답을 받지 못했습니다.', res.status)
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop()
    for (const p of parts) {
      const line = p.replace(/^data: /, '')
      if (line === '[DONE]') return
      try {
        const j = JSON.parse(line)
        if (j.sources) onSources(j.sources)
        if (j.delta) onDelta(j.delta)
      } catch { /* 부분 청크 무시 */ }
    }
  }
}
