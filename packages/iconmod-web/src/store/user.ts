import { mfetch } from '../utils/http'
import { getOwnProejcts } from './project'

export const showLoginDialog = ref(false)
export const isSignIn = ref(false)
export const userInfo = useStorage<Partial<{ name: string, email: string, id: number }>>('userInfo', null)

export function showLogin() {
  showLoginDialog.value = true
  isSignIn.value = true
}
export function hideLogin() {
  showLoginDialog.value = false
}

export function getUserInfo() {
  return mfetch('/user/info').then(res => res.json()).then((res) => {
    userInfo.value = res.data
  }).catch(() => {})
}

export async function initUser() {
  await getUserInfo()
  await getOwnProejcts()
}
