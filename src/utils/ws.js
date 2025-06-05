let ws = null;
let listeners = [];

export function connectWS(token, onMsg) {
  // 连接地址：需后端支持token参数
  ws = new WebSocket(`ws://1.95.61.131:5555/ws?token=${token}`);
  ws.onopen = () => console.log('[WS] Connected');
  ws.onclose = () => console.log('[WS] Closed');
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    listeners.forEach(fn => fn(msg));
    if (onMsg) onMsg(msg);
  };
}

export function onWSMsg(fn) {
  listeners.push(fn);
}

export function sendWSMsg(type, data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

export function closeWS() {
  if (ws) ws.close();
}
