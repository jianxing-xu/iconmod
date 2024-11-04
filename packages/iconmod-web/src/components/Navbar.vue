<script lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies'
import { getSearchResults, isDark } from '../store'
import { showUploadIcon } from '../store/project'
import { resetUser, showLogin, userInfo } from '../store/user'

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cookies = useCookies()

    function onLogout() {
      resetUser()
      cookies.remove('iconmod-token', { path: '/' })
      router.replace('/')
      setTimeout(() => location.reload(), 200)
    }
    return {
      ...getSearchResults(),
      isDark,
      isHomepage: computed(() => route.path === '/'),
      showLogin,
      userInfo,
      showUploadIcon,
      onLogout,
    }
  },
})
</script>

<template>
  <nav
    class="dragging"
    flex="~ gap4 none"
    p4 relative bg-base z-10 border="b base" text-xl
  >
    <!-- In Collections -->
    <RouterLink
      v-if="!isHomepage"
      class="non-dragging"
      icon-button flex-none
      to="/"
    >
      <iconify-icon icon="carbon:arrow-left" />
    </RouterLink>

    <h1
      flex items-center justify-center mra
      text-xl font-light tracking-2px
    >
      <RouterLink to="/">
        Icônmod
      </RouterLink>
    </h1>
    <button v-if="!userInfo?.id" class="icon-button text-4" @click="showLogin">
      Sign In
    </button>
    <button v-else class="icon-button text-4 relative user">
      Hello, {{ userInfo.name }}
      <div class="absolute top-7 left-0 bg-base rd-1 b hidden" @click="onLogout">
        <div class="py1 p2 text-4">
          Logout
        </div>
      </div>
    </button>

    <div class="icon-button">
      <iconify-icon icon="system-uicons:upload-alt" @click="showUploadIcon = true" />
    </div>
    <RouterLink
      class="non-dragging"
      icon-button flex-none
      to="/settings"
      title="Settings"
    >
      <iconify-icon icon="carbon-settings" />
    </RouterLink>
    <DarkSwitcher flex-none />
  </nav>
</template>

<style scoped>
.user:hover > div {
  display: block;
}
</style>
