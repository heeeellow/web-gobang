const BASE_URL = 'http://1.95.61.131:5555/api'; // 改成你的服务器实际地址

export async function post(path, data) {
  return fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    
    body: JSON.stringify(data)
  }).then(res => res.json());
}

export async function get(path) {
  return fetch(BASE_URL + path, {
    credentials: 'include',
  }).then(res => res.json());
}
