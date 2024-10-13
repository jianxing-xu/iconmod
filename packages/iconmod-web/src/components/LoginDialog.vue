<script lang="ts" setup>
import { getOwnProejcts } from '../store/project'
import { hideLogin, isSignIn, showLoginDialog, userInfo } from '../store/user'
import { mfetch } from '../utils/http'

const loading = ref(false)
const formData = ref({
  email: '',
  pwd: '',
})

function onSubmit(e: Event) {
  e.preventDefault()
  if (loading.value)
    return
  loading.value = true
  mfetch('/user/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ ...formData.value }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.json()).then(async (res) => {
    userInfo.value = res.data
    await getOwnProejcts()
    setTimeout(() => {
      location.reload()
    }, 300)
  }).catch(() => {
    userInfo.value = null
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <ModalDialog :value="showLoginDialog">
    <form class="w-500px m-h-300px flex flex-col items-center mb-4 mt0" @submit.stop="onSubmit">
      <div py2 wfull border-b text-center border-gray-8>
        Icon Mod
        <button class="absolute right-4 top-3 icon-button" type="button" @click="hideLogin">
          <iconify-icon icon="material-symbols:close" />
        </button>
      </div>
      <div class="mt4">
        <input v-model="formData.email" placeholder="email" type="email" required class="w-200px h40px rd-2 bg-base-2 outline-none px-2">
      </div>
      <div class="mt3">
        <input v-model="formData.pwd" placeholder="pwd" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" required autocomplete="on" type="password" class="w-200px h40px rd-2 bg-base-2 outline-none px-2">
      </div>
      <button class="text-3 text-right icon-button border-b mt1" type="button" @click="isSignIn = !isSignIn">
        {{ isSignIn ? 'go sign up' : 'go sign in' }}
      </button>
      <div class="mt4 flex gap-4">
        <button v-show="isSignIn" class="icon-button border rd-2 p2 flex items-center">
          Sign in
          <iconify-icon v-show="loading" icon="svg-spinners:270-ring-with-bg" class="ml-1" />
        </button>
        <button v-show="!isSignIn" class="icon-button border rd-2 p2">
          Sign up
        </button>
      </div>
    </form>
  </ModalDialog>
</template>
