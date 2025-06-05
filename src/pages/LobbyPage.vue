<template>
  <div class="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-300 flex flex-col items-center relative">
    <!-- 背景大标题 -->
    <div class="absolute top-24 left-1/2 -translate-x-1/2 select-none pointer-events-none">
      <span class="text-5xl md:text-7xl font-extrabold text-yellow-400 drop-shadow-lg tracking-widest">游戏大厅</span>
    </div>
    <!-- 顶部栏 -->
    <div class="w-full flex justify-between items-center px-8 py-6">
      <span class="text-lg md:text-2xl font-bold text-yellow-800">欢迎，{{ currentUser?.username || '游客' }}</span>
      <button class="btn-yellow" @click="handleLogout">退出登录</button>
    </div>
    <div class="w-full max-w-6xl pt-24 grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 z-10">
      <!-- 房间列表 -->
      <div class="bg-white/90 rounded-2xl shadow-lg p-6">
      <div class="flex justify-between items-center mb-4">
  <h2 class="text-2xl font-bold text-yellow-800">当前房间</h2>
  <div class="flex gap-2">
    <button class="btn-green" @click="showCreateRoom = true">创建房间</button>
    <button class="btn-yellow" @click="joinBotRoom">人机对战</button>
  </div>
</div>

        <div v-for="room in rooms" :key="room.id" class="mb-4 last:mb-0">
          <div class="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl shadow-sm">
            <span class="font-bold text-lg">{{ room.name }}</span>
            <span class="text-gray-500">({{ room.playerCount }}/2人)</span>
            <span v-if="room.hasPassword" class="ml-2 text-yellow-600 text-sm">🔒有密码</span>
            <span v-if="room.status === 'full'" class="text-blue-600 text-xs ml-2">已满，可观战</span>
            <button v-if="room.status !== 'full'" class="btn-blue ml-auto" @click="joinRoom(room)">
              加入
            </button>
            <button v-else class="btn-gray ml-auto" @click="watchRoom(room)">观战</button>
          </div>
        </div>
      </div>
      <!-- 在线用户列表 -->
      <div class="bg-white/90 rounded-2xl shadow-lg p-6">
        <h2 class="text-2xl font-bold text-yellow-800 mb-4">在线用户</h2>
        <div class="flex flex-wrap gap-3">
          <span v-for="user in onlineUsers" :key="user" class="px-3 py-1 rounded-lg bg-yellow-200 text-yellow-900 font-medium shadow-sm">
            {{ user }}
          </span>
        </div>
        <!-- 人机对战入口 -->
       
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <div v-if="showCreateRoom" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm flex flex-col gap-4">
        <h3 class="text-xl font-bold text-yellow-700 mb-2">创建房间</h3>
        <input v-model="roomName" type="text" placeholder="房间名" class="input" />
        <div class="flex items-center gap-2">
          <input v-model="usePassword" type="checkbox" id="usePassword" />
          <label for="usePassword" class="text-gray-700">设置房间密码</label>
        </div>
        <input v-if="usePassword" v-model="roomPassword" type="password" placeholder="密码" class="input" />
        <div class="flex gap-2 mt-4">
          <button class="btn-yellow flex-1" @click="createRoom">创建</button>
          <button class="btn-gray flex-1" @click="showCreateRoom = false">取消</button>
        </div>
        <p v-if="createError" class="text-red-600 text-sm">{{ createError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '@/utils/api'
import { sendWSMsg, closeWS } from '@/utils/ws'

const router = useRouter()
const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null)

const rooms = ref([])
const onlineUsers = ref([])
const showCreateRoom = ref(false)
const roomName = ref('')
const usePassword = ref(false)
const roomPassword = ref('')
const createError = ref('')

async function fetchRooms() {
  const res = await get('/rooms')
  rooms.value = res.rooms || []
}
async function fetchOnlineUsers() {
  const res = await get('/users/online')
  onlineUsers.value = res.users || []
}

onMounted(() => {
  fetchRooms()
  fetchOnlineUsers()
  setInterval(() => {
    fetchRooms()
    fetchOnlineUsers()
  }, 3000)
})

async function handleLogout() {
  await post('/auth/logout', { username: currentUser.value.username })
  sendWSMsg('logout', { user: currentUser.value.username })
  closeWS()
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  router.push('/login')
}

async function createRoom() {
  if (!roomName.value) {
    createError.value = '请填写房间名'
    return
  }
  const res = await post('/rooms/create', {
    name: roomName.value,
    password: usePassword.value ? roomPassword.value : undefined,
  })
  if (res.success) {
    router.push(`/room/${res.room.id}`)
  } else {
    createError.value = res.message || '创建失败'
  }
}

async function joinRoom(room) {
  let pwd = ''
  if (room.hasPassword) {
    pwd = prompt('请输入房间密码')
  }
  const res = await post('/rooms/join', {
    roomId: room.id,
    password: pwd,
  })
  if (res.success) {
    router.push(`/room/${room.id}`)
  } else {
    alert(res.message || '加入失败')
  }
}

function watchRoom(room) {
  router.push(`/room/${room.id}?spectate=1`)
}

function joinBotRoom() {
  router.push(`/room/bot`)
}
</script>

<style scoped>
.btn-yellow {
  @apply px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl shadow transition;
}
.btn-green {
  @apply px-4 py-2 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl shadow transition;
}
.btn-blue {
  @apply px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition;
}
.btn-gray {
  @apply px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl shadow transition;
}
.input {
  @apply p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg bg-white w-full;
}
</style>
