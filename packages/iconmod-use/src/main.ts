import App from './App.svelte'
import { setConfig } from './pkg'
import './App.css'

setConfig({
  provider: 'http://118.26.38.32/iconmod-api',
  assetPath: 'assets/iconmod',
})

const app = new App({
  target: document.getElementById('app')!,
})

export default app
