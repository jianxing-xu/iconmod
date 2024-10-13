import { userInfo } from '../store/user'

const tokenInter = async function (res: Response) {
  const resp = await res.clone().json()
  if (resp.error?.code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE') {
    userInfo.value = null
  }
  if (resp.code === 400) {
    throw new Error(`server error${res.text()}`)
  }
}

export async function mfetch(url: string, opts?: RequestInit) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts?.headers || {}),
  }
  const init = Object.assign({
    headers,
    credentials: 'include',
  }, opts ?? {})
  const _url = url?.startsWith('http://') || url?.startsWith('https://') ? url : import.meta.env.VITE_ICON_PROVIDER + url
  const res = await fetch(_url, init)

  try {
    await tokenInter(res)
  }
  catch (error) {
    return Promise.reject(error)
  }

  return res
}
