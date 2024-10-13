<script setup lang="ts">
import type { CollectionInfo, PresentType } from '../data'

defineProps<{
  collections: CollectionInfo[]
  type?: PresentType
}>()
defineEmits(['create'])
</script>

<template>
  <div class="collections-list grid gap2" p2>
    <template
      v-for="(collection, i) of collections"
      :key="collection.id"
    >
      <CollectionEntryProject
        v-if="type === 'project'"
        :collection="collection"
        :type="type"
      />
      <div
        v-if="type === 'project' && i === collections.length - 1"
        flex py3
        justify-center items-center flex-col b b-dashed icon-button hfull cursor-pointer
        @click="$emit('create')"
      >
        <iconify-icon icon="mdi:add-bold" />
        Create Project
      </div>
      <CollectionEntry
        v-if="type !== 'project'"
        :type="type"
        :collection="collection"
      />
    </template>
  </div>
</template>

<style>
.collections-list {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
