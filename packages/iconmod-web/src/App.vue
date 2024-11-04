<script setup lang='ts'>
import AddIconToProjectDialog from './components/AddIconToProjectDialog.vue'
import UploadIconsDialog from './components/UploadIconsDialog.vue'
import { specialTabs } from './data'
import { useThemeColor } from './hooks'
import { useIconAction } from './hooks/icon_action'
import { activeMode, bags, showHelp, useCurrentCollection } from './store'
import { globaTip } from './store/global'
import { showAddToProject, showCreateProject, showUploadIcon } from './store/project'
import { initUser } from './store/user'

const { style } = useThemeColor()
const { onSelect, current, onCopy } = useIconAction()
const collection = useCurrentCollection()

const showBag = ref(false)

initUser()
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-base" :style="style">
    <div class="h-full flex-auto overflow-overlay">
      <RouterView />
    </div>
    <Progress />

    <!-- Mode -->
    <div
      class="fixed top-0 right-0 pl-4 pr-2 py-1 rounded-l-full bg-primary text-white shadow mt-16 cursor-pointer transition-transform duration-300 ease-in-out"
      :style="activeMode !== 'normal' ? {} : { transform: 'translateX(120%)' }"
      @click="activeMode = 'normal'"
    >
      {{ activeMode === 'select' ? 'Multiple select' : 'Name copying mode' }}
      <Icon icon="carbon:close" class="inline-block text-xl align-text-bottom" />
    </div>

    <!-- Bag -->
    <Modal :value="showBag" direction="right" @close="showBag = false">
      <Bag
        v-if="showBag"
        @close="showBag = false"
        @select="onSelect"
      />
    </Modal>
    <!-- Details -->
    <Modal :value="!!current" @close="current = ''">
      <IconDetail
        :icon="current" :show-collection="specialTabs.includes(collection?.id as string)"
        @close="current = ''"
        @copy="onCopy"
      />
    </Modal>

    <Notification :value="!!globaTip">
      <Icon icon="mdi:check" class="inline-block mr-2 font-xl align-middle" />
      <span class="align-middle">{{ globaTip }}</span>
    </Notification>

    <!-- Help -->
    <ModalDialog :value="showHelp" @close="showHelp = false">
      <HelpPage />
    </ModalDialog>

    <!-- CreateProject -->
    <ModalDialog :value="showCreateProject" @close="showCreateProject = false">
      <CreateProjectDialog v-if="showCreateProject" @close="showCreateProject = false" />
    </ModalDialog>

    <!-- AddBagIconsToProject -->
    <ModalDialog :value="showAddToProject" @close="showAddToProject = false">
      <AddIconToProjectDialog v-if="showAddToProject" @close="showAddToProject = false" />
    </ModalDialog>
    <!-- UploadIconToProject -->
    <ModalDialog :value="showUploadIcon" @close="showUploadIcon = false">
      <UploadIconsDialog v-if="showUploadIcon" @close="showUploadIcon = false" />
    </ModalDialog>

    <!-- Bag Fab -->
    <FAB
      v-if="bags.length"
      icon="carbon:shopping-bag"
      :number="bags.length"
      @click="showBag = true"
    />

    <!-- Login Dialog -->
    <LoginDialog />
  </div>
</template>
