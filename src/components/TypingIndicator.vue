<template>
  <!-- Typing Indicator -->
  <q-chat-message
    v-if="users.length > 0"
    bg-color="grey-3"
    text-color="grey-8"
    @click="handleClick"
    style="cursor: pointer;"
  >
    <template v-slot:name>{{ typingMessage }}</template>
    
    <template v-slot:avatar>
      <!-- Stacked Avatars for Multiple Typers -->
      <div class="avatar-stack">
        <template v-for="(user, index) in displayedUsers" :key="user.userId">
          <img
            v-if="user.avatarUrl"
            class="q-message-avatar q-message-avatar--received stacked-avatar"
            :src="user.avatarUrl"
            :alt="user.nickName"
            :style="{ 
              zIndex: displayedUsers.length - index,
              marginLeft: index > 0 ? '-12px' : '0',
              border: '2px solid white'
            }"
          >
          <q-avatar
            v-else
            :style="{ 
              zIndex: displayedUsers.length - index,
              marginLeft: index > 0 ? '-12px' : '0',
              border: '2px solid white'
            }"
            class="stacked-avatar"
            color="grey"
            text-color="white"
            size="40px"
          >
            {{ user.nickName.charAt(0).toUpperCase() }}
          </q-avatar>
        </template>
        
        <div 
          v-if="users.length > 3" 
          class="overflow-badge"
          :style="{ 
            zIndex: 0,
            marginLeft: '-12px'
          }"
        >
          +{{ users.length - 3 }}
        </div>
      </div>
    </template>
    
    <!-- Typing dots -->
    <q-spinner-dots size="2rem" color="grey-7" />
  </q-chat-message>
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
      default: 3
    }
  },
  computed: {
    displayedUsers(): TypingIndicator[] {
      return this.users.slice(0, this.maxPreview)
    },
    typingMessage(): string {
      const count = this.users.length
      if (count === 0) return ''
      if (count === 1) return `${this.users[0]?.nickName} píše`
      if (count === 2) return `${this.users[0]?.nickName} a ${this.users[1]?.nickName} píšu`
      if (count === 3) {
        return `${this.users[0]?.nickName}, ${this.users[1]?.nickName} a ${this.users[2]?.nickName} píšu`
      }
      return `${this.users[0]?.nickName}, ${this.users[1]?.nickName} a ${count - 2} ďalší píšu`
    }
  },
  methods: {
    handleClick() {
      this.$emit('showAll')
    }
  }
})
</script>

<style scoped>
.avatar-stack {
  display: flex;
  align-items: center;
  position: relative;
}

.stacked-avatar {
  transition: transform 0.2s;
}

.stacked-avatar:hover {
  transform: scale(1.1);
}

.overflow-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  background-color: #9e9e9e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}
</style>
