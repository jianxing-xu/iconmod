import App from './App.svelte'
import { setProviderApi } from './lib/components/iconmod.config'
import './app.css'

const app = new App({
  target: document.getElementById('app')!,
})
setProviderApi('http://118.26.38.32/iconmod-api')

export default app
