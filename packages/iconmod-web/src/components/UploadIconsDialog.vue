<script setup lang="ts">
import { buildParsedSVG, iconToHTML, parseSVGContent } from '@iconify/utils'
import { Tooltip } from 'floating-vue'
import { showGlobalTip } from '../store'
import { getOwnProejcts, projects, showUploadIcon } from '../store/project'
import { mfetch } from '../utils/http'
import { REMOVE_ICON_CHAT, REMOVE_ICON_PRE, adjustIconname, clearSvgs, convertSvgShapesToPath } from '../utils/icons'
import { useDragTarget } from '../utils/useDragTarget'
import { useThemeColor } from '../hooks'
import { KEYS } from '../utils/bus'

defineEmits(['close'])
let incrementID = 0

const route = useRoute()
const { style } = useThemeColor()
const { emit } = useEventBus(KEYS.REFRESH_PROJECT_ICONS)

const submitting = ref(false)
const selected = ref<number | null>()

const uploadTip = ref('')
const iconsTip = ref('')

const dragTarget = ref()
const dragOver = ref(false)
const dropColor = ref(true)

const icons = ref<{ id: number, name: string, svg: string }[]>([])
const repeatNames = ref<Record<string, 1>>({})

const canSubmit = computed(() => {
  return !submitting.value && selected.value && Object.keys(repeatNames.value).length === 0 && icons.value.length
})

async function onSubmit() {
  if (!canSubmit.value)
    return
  submitting.value = true
  try {
    const res = await mfetch('/project/upload', { method: 'POST', body: JSON.stringify({ projectId: selected.value, icons: icons.value }) }).then(r => r.json())
    if (res?.data?.hasSame) {
      repeatNames.value = res.data?.names
      iconsTip.value = 'Already has same name icon in project, please check'
      return
    }
    showGlobalTip('Add Successful!')
    getOwnProejcts()
    if (route.name === 'project-id') {
      // refresh project icon
      emit()
    }
    showUploadIcon.value = false
    icons.value = []
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (_) {

  }
  finally {
    submitting.value = false
  }
}
useDragTarget(dragTarget, (e) => {
  const files = e.dataTransfer?.files
  onFilechange(files)
  setTimeout(() => dragOver.value = false)
})

async function onFilechange(files: FileList | null | undefined) {
  const finalFiles = []
  for (let index = 0; index < (files?.length || 0); index++) {
    const f = files?.item(index)
    if (f?.type !== 'image/svg+xml')
      continue
    finalFiles.push(f)
  }
  if (finalFiles.length === 0) {
    uploadTip.value = 'All files not svg'
  }
  else {
    showGlobalTip('Auto filter not the svg file.')
  }
  processSVG(finalFiles)
}
async function processSVG(files: File[]) {
  try {
    uploadTip.value = ''
    try {
      const texts = await Promise.all(files.map(it => it.text()))
      const svgs = files.map((it, i) => ({
        id: ++incrementID,
        name: it.name.replace('.svg', ''),
        svg: texts[i],
      }))
      // clean svg remove some useless attrs,style,tags
      const [cleanedSvgs, errs] = await clearSvgs(svgs, dropColor.value)
      // convert soem shape to path
      const convertSvgs = cleanedSvgs.map((it: any) => ({ ...it, svg: convertSvgShapesToPath(it.svg) }))
      icons.value.push(...convertSvgs)
      if (!convertSvgs?.length) {
        uploadTip.value = `Parse svg error ${errs.map((e: any) => e?.message || JSON.stringify(e || '')).join(',')}`
      }
    }
    catch (error: any) {
      uploadTip.value = `Parse svg error ${error?.message || JSON.stringify(error || '')}`
    }
  }
  catch (error: any) {
    showGlobalTip(`Parse icon error${error?.toString()}`)
  }
  finally {
    onCheckName()
  }
}
function buildSvg(svg: string) {
  const icon = buildParsedSVG(parseSVGContent(svg) as any)
  if (!icon) {
    return 'icon convert failed'
  }
  const { body, ...attrs } = icon
  return iconToHTML(icon.body, { ...(attrs.attributes), width: '1em', height: '1em' })
}

// check
function onCheckName() {
  const m: Record<string, 1> = {}
  const _set = new Set()
  icons.value.forEach((ic) => {
    if (_set.has(ic.name)) {
      m[ic.name] = 1
    }
    else {
      _set.add(ic.name)
    }
  })
  repeatNames.value = m
  if (Object.keys(m).length) {
    iconsTip.value = 'If there is an icon of the same name, please modify'
  }
  else {
    iconsTip.value = ''
  }
}
function adjustName(name: string, i: number) {
  const cleaned = adjustIconname(name)
  icons.value[i].name = cleaned
}

watch([() => projects.value.length, showUploadIcon], ([v, s]) => {
  if (v > 0 && s) {
    selected.value = projects.value[0].id
  }
})
</script>

<template>
  <form class="w-760px" @submit.prevent.stop="onSubmit">
    <div class="flex p4">
      <div font-bold>
        Upload icons
      </div>
      <iconify-icon icon="material-symbols:close-rounded" icon-button cursor-pointer mla @click="$emit('close')" />
    </div>
    <div class="p4 pt0">
      <label mb2 block text-14px flex items-center>
        <span>Drag svg to there</span>
        <input v-model="dropColor" type="checkbox" ml4 bg-base cursor-pointer>
        <span ml1 cursor-pointer>drop color</span>
        <Tooltip>
          <iconify-icon icon="material-symbols:help-center" text-5 ml1 cursor-pointer />
          <template #popper>
            <div :style="style">Remove the color to upload, example: fill, stroke colors. If your icon is a multi -color icon, it is recommended to cancel the check</div>
          </template>
        </Tooltip>
      </label>
      <div text-base>
        Icon drawing rule reference:
        <a icon-button target="_blank" href="https://www.iconfont.cn/help/detail?spm=a313x.help_article_detail.i1.de97f49b6.ad683a81E8BPF0&helptype=draw">Iconfont rule</a>
      </div>
      <div h20 wfull rd-1 b border-dashed border-white flex relative :class="{ 'border-2': dragOver }">
        <iconify-icon icon="mdi:add" ma text-6 />
        <input ref="dragTarget" type="file" multiple max="10" wfull hfull absolute top-0 left-0 opacity-0 @change="e => onFilechange((e.target as HTMLInputElement).files)" @dragenter="dragOver = true" @dragleave="dragOver = false">
      </div>
      <div text-red>
        {{ uploadTip }}
      </div>
    </div>
    <div class="p4 pt0">
      <div>Icons*</div>
      <div flex gap2 flex-wrap max-h-50vh overflow-auto>
        <div v-for="(icon, i) of icons" :key="icon.id" flex flex-col items-center bg-base-2 rd-1 relative class="icon-item">
          <div p2 text-20 border-box v-html="buildSvg(icon.svg)" />
          <input
            v-model="icon.name" bg-base-2 py1 px2 w-24 outline-none b :class="{ 'border-red': !!repeatNames[icon.name] }"
            max="10" oninput="value=value?.replace(/[^a-z-]/g, '')" @blur="onCheckName" @blur.stop="adjustName(icon.name, i)"
          >
          <iconify-icon class="trash" icon="mdi:trash" hidden text-8 cursor-pointer icon-button absolute top-0 right-0 z-999 @click="icons.splice(i, 1)" />
        </div>
      </div>
      <div text-red>
        {{ iconsTip }}
      </div>
    </div>
    <div class="p4 pt0">
      <label mb2 text-14px block>
        To project*
      </label>
      <div
        v-for="p of projects" :key="p.id"
        class="bg-base-2 py2 px3 rd-1 mb2 cursor-pointer"
        :class="{ 'outline outline-primary': selected === p.id }"
        @click="selected === p.id ? selected = null : selected = p.id"
      >
        <div>{{ p.name }}</div>
      </div>
      <div class="mt4">
        <button b bg-base py2 px4 rd-1 flex items-center :class="{ 'opacity-50': !canSubmit }">
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
.icon-item:hover .trash {
  display: block;
}
</style>
