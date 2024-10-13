<script setup lang="ts">
import type { InputHTMLAttributes } from 'vue'
import { useSearchUser } from '../utils/useSearchUser'
import { userInfo } from '../store/user'
import { mfetch } from '../utils/http'

defineEmits(['close'])

const router = useRouter()
const { userResults, onSearch } = useSearchUser()

const submitting = ref(false)
const formData = ref({
  projectName: '',
  projectPrefix: '',
  users: new Map<string, { name: string, id: number, email: string }>(),
})

async function onSubmit() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    await (await mfetch('/project/create', {
      method: 'POST',
      body: JSON.stringify(({
        name: formData.value.projectName,
        prefix: formData.value.projectPrefix,
        userIds: [...formData.value.users.values()].map(it => it.id),
      })),
    })).json()
    router.push({ path: `/project/${formData.value.projectPrefix}` })
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (_) {}
}

function onKeyDown(e: KeyboardEvent) {
  const value = (e.target as HTMLInputElement).value
  if (e.code === 'Backspace') {
    if (!value.trim()) {
      let lastKey: string = ''
      for (const key of formData.value.users.keys()) {
        lastKey = key
      }
      formData.value.users.delete(lastKey)
    }
  }
}
</script>

<template>
  <form class="min-w-500px" @submit.prevent.stop="onSubmit">
    <div class="flex p4">
      <div font-bold>
        Create Project
      </div>
      <iconify-icon icon="material-symbols:close-rounded" icon-button mla @click="$emit('close')" />
    </div>
    <div class="p4">
      <div class="mb4">
        <label for="projectName" class="block mb2px">Project Name <b text-red vertical-middle>*</b></label>
        <input
          id="projectName" v-model="formData.projectName" class="bg-base-2 rd-2 p1 px2 wfull min-h-40px"
          required minlength="4" maxlength="30" @input="(e) => formData.projectName = (e.target as HTMLInputElement).value?.replace(/[^a-zA-Z]/g, '')"
        >
      </div>
      <div class="mb4">
        <label for="projectPrefix" class="block mb2px">Project Prefix <b text-red vertical-middle>*</b></label>
        <input
          id="projectPrefix" v-model="formData.projectPrefix" class="bg-base-2 rd-2 p1 px2 wfull min-h-40px"
          required @input="(e) => formData.projectPrefix = (e.target as HTMLInputElement).value?.replace(/[^a-z-]/g, '')"
        >
      </div>
      <div class="mb4 flex flex-col relative">
        <label for="searchUser" class="block mb2px">Add Member By Search</label>

        <div class="search-user-parent bg-base-2 rd-2 wfull mb1 min-h-40px flex flex-wrap">
          <div v-if="userInfo?.id" h30px leading-30px mt1 ml1 px2 bg-base-2>
            {{ userInfo.name }}(owner)
          </div>

          <div v-for="[, u] in formData.users" :key="u.id" h30px leading-30px mt1 ml1 px2 bg-base-2 @click="formData.users.delete(u.name)">
            {{ u.name }}
          </div>
          <input
            id="searchUser" class="bg-transparent pl1 outline-none flex-1"
            @keydown="onKeyDown" @input="e => onSearch((e.target as InputHTMLAttributes).value)"
          >
        </div>
        <div
          v-for="u of userResults" :key="u.name" class="bg-gray-8 p2 rd-1 absolute top-17 wfull"
          @click="formData.users.has(u.name) ? formData.users.delete(u.name) : formData.users.set(u.name, u)"
        >
          {{ u.name }}
        </div>
      </div>
      <div>
        <button b border-base bg-base py2 px4 rd-1 flex items-center>
          Create
          <iconify-icon v-show="submitting" icon="svg-spinners:270-ring-with-bg" class="ml-1" />
        </button>
      </div>
    </div>
  </form>
</template>

<style>
.search-user-parent:has(#searchUser:focus) {
  outline: white 1px solid;
}
</style>
