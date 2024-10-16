import { mfetch } from '../utils/http'
import { getOwnProejcts } from './project'

export const showLoginDialog = ref(false)
export const userInfo = useStorage<Partial<{ name: string, email: string, id: number }>>('userInfo', null)
export const isSignIn = computed(() => !!userInfo?.value?.id)

export function showLogin() {
  showLoginDialog.value = true
}
export function hideLogin() {
  showLoginDialog.value = false
}

export function getUserInfo() {
  return mfetch('/user/info').then(res => res.json()).then((res) => {
    userInfo.value = res.data
  }).catch(() => {})
}

export function resetUser() {
  userInfo.value = null
}

export async function initUser() {
  await getUserInfo()
  await getOwnProejcts()
}
