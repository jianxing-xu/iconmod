<script setup lang="ts">
import { bags, showGlobalTip } from '../store'
import { projects, showAddToProject } from '../store/project'
import { mfetch } from '../utils/http'
import { LoadIconSvgs } from '../utils/pack'

defineEmits(['close'])

const submitting = ref(false)
const selected = ref<number | null>()

async function onSubmit() {
  if (submitting.value || !selected.value)
    return
  submitting.value = true
  try {
    let icons = await LoadIconSvgs(bags.value)
    icons = icons.map(it => ({ ...it, name: it.name.split(':')[1] }))
    await mfetch('/project/addicons', { method: 'POST', body: JSON.stringify({ projectId: selected.value, icons }) })
    showGlobalTip('Add Successful!')
    showAddToProject.value = false
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (_) {}
}
</script>

<template>
  <form class="min-w-500px" @submit.prevent.stop="onSubmit">
    <div class="flex p4">
      <div font-bold>
        Add to project
      </div>
      <iconify-icon icon="material-symbols:close-rounded" icon-button mla @click="$emit('close')" />
    </div>
    <div class="p4 pt0">
      <div
        v-for="p of projects" :key="p.id"
        class="bg-base-2 py2 px3 rd-1 mb2 cursor-pointer"
        :class="{ 'outline outline-primary': selected === p.id }"
        @click="selected === p.id ? selected = null : selected = p.id"
      >
        <div>{{ p.name }}</div>
      </div>
      <div class="mt4">
        <button b border-base bg-base py2 px4 rd-1 flex items-center>
          Confirm
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
