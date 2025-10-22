<template>
  <transition
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <div v-if="users.length > 0" class="typing-preview" @click="handleClick" style="cursor: pointer;">
      <q-icon name="edit" size="xs" class="q-mr-xs" />
      <div
        v-for="user in previewedUsers"
        :key="user.userId"
        class="typing-preview__item"
      >
        <span class="typing-preview__nick">{{ user.nickName }}:</span>
        <span class="typing-preview__text">{{ user.messagePreview }}</span>
      </div>
      <template v-if="users.length > maxPreview">
        <span style="margin-left: 8px;">+{{ users.length - maxPreview }} ďalší...</span>
      </template>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { TypingIndicator } from '../types'

export default defineComponent({
  name: 'TypingIndicator',
  props: {
    users: {
      type: Array as PropType<TypingIndicator[]>,
      default: () => []
    },
    maxPreview: {
      type: Number,
      default: 1
    }
  },
  computed: {
    previewedUsers(): TypingIndicator[] {
      return this.users.slice(0, this.maxPreview)
    }
  },
  methods: {
    handleClick() {
      this.$emit('showAll')
      
    }
  }
})
</script>
