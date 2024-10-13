<script setup lang="ts">
import { userInfo } from '../store/user'
import { mfetch } from '../utils/http'
import Notification from './Notification.vue'

const props = defineProps<{ projectId: number }>()
defineEmits(['close'])
let timer: any

const notice = ref('')
const members = ref<{ userId: number, user: { name: string }, role: number }[]>([])
const userResults = ref<{ id: number, name: string, email: string }[]>([])

function getMembers() {
  mfetch(`/project/members?projectId=${props.projectId}`).then(r => r.json()).then((res) => {
    members.value = (res.data || [])
  }).catch(() => {})
}

function searchUser(e: Event) {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const k = (e.target as HTMLInputElement).value
    if (!k.trim()) {
      userResults.value = []
      return
    }
    mfetch(`/user/search?keyword=${k}`).then(r => r.json()).then((res) => {
      userResults.value = (res.data || []).filter((it: any) => !members?.value.find(m => m?.user?.name === it.name))
    }).catch(() => {})
  }, 400)
}

function onAddUser(id: number, inr: boolean) {
  if (inr) {
    notice.value = 'Already added!'
    setTimeout(() => notice.value = '', 2000)
    return
  }
  mfetch('/project/adduser', {
    method: 'POST',
    body: JSON.stringify({ projectId: props.projectId, userId: id }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => r.json()).then(() => {
    getMembers()
    notice.value = 'Add successful !'
    setTimeout(() => notice.value = '', 2000)
  }).catch(() => {})
}

function onDel(userId: number) {
  mfetch('/project/deluser', {
    method: 'POST',
    body: JSON.stringify({ projectId: props.projectId, userId }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => r.json()).then(() => {
    getMembers()
    notice.value = 'Delete successful!'
    setTimeout(() => notice.value = '', 2000)
  }).catch(() => {})
}

function isMe(name: string) {
  return userInfo.value.name === name
}
function inMember(name: string) {
  return !!members.value.find(it => it.user.name === name)
}

watch(() => props.projectId, () => {
  if (props.projectId)
    getMembers()
})

onMounted(() => {
  getMembers()
})
</script>

<template>
  <div class="min-w-500px">
    <div class="flex p4">
      <div font-bold>
        Member Manager
      </div>
      <iconify-icon icon="material-symbols:close-rounded" icon-button mla @click="$emit('close')" />
    </div>
    <div px4 relative>
      <input class="bg-base-2 rd-2 p1 px2" @input="searchUser">
      <div v-show="userResults.length" w-200px border p2 border-base rd-1 absolute top-10 bg-base shadow shadow-gray>
        <div v-for="u of userResults" :key="u.id" flex items-center>
          <div>{{ u.name }}</div>
          <div icon-button border border-base p1 text-3 rd-1 cursor-pointer mla @click="onAddUser(u.id, inMember(u.name))">
            {{ inMember(u.name) ? 'Added' : 'Add' }}
          </div>
        </div>
      </div>
    </div>
    <div p4>
      <div flex mb2 color-base>
        <div w-300px pr2>
          Name
        </div>
        <div>Role</div>
        <div mla>
          Action
        </div>
      </div>
      <div v-for="u of members" :key="u.userId" flex items-center>
        <div w-300px pr2>
          {{ u.user.name }}{{ isMe(u.user.name) ? '(me)' : '' }}
        </div>
        <div>{{ u.role === 1 ? "Admin" : "Member" }}</div>
        <iconify-icon icon="material-symbols:delete" text-2xl icon-button mla :class="isMe(u.user.name) ? 'hidden' : ''" @click="onDel(u.userId)" />
      </div>
    </div>
    <Notification :value="!!notice">
      {{ notice }}
    </Notification>
  </div>
</template>
