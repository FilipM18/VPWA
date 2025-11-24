<template>
  <div v-if="users.length > 0" class="full-width">
    <!-- Typing Indicator -->
    <q-chat-message
      v-if="users.length > 0"
      bg-color="grey-3"
      text-color="grey-8"
      @click="toggleExpanded"
      class="cursor-pointer transition-opacity"
      style="transition: all 0.2s ease"
    >
      <template v-slot:name>
        <div class="row items-center q-gutter-x-sm">
          <span>{{ typingMessage }}</span>
          <q-icon 
            :name="isExpanded ? 'expand_less' : 'expand_more'" 
            size="20px"
            class="transition-all"
            style="transition: transform 0.3s ease; opacity: 0.7"
          />
        </div>
      </template>
      
      <template v-slot:avatar>
        <!-- Stacked Avatars for Multiple Typers -->
        <div class="row items-center relative-position">
          <template v-for="(user, index) in displayedUsers" :key="user.userId">
            <img
              v-if="user.avatarUrl"
              class="q-message-avatar q-message-avatar--received stacked-avatar clickable-avatar"
              :src="user.avatarUrl"
              :alt="user.nickName"
              :style="{ 
                zIndex: displayedUsers.length - index,
                marginLeft: index > 0 ? '-12px' : '0',
                border: '2px solid white'
              }"
              @click.stop="selectUser(user.userId)"
            >
            <q-avatar
              v-else
              :style="{ 
                zIndex: displayedUsers.length - index,
                marginLeft: index > 0 ? '-12px' : '0',
                border: '2px solid white'
              }"
              class="stacked-avatar clickable-avatar"
              color="grey"
              text-color="white"
              size="40px"
              @click.stop="selectUser(user.userId)"
            >
              {{ user.nickName.charAt(0).toUpperCase() }}
            </q-avatar>
          </template>
          
          <q-avatar
            v-if="users.length > 3"
            size="40px"
            color="grey"
            text-color="white"
            class="text-weight-bold text-caption"
            :style="{ 
              zIndex: 0,
              marginLeft: '-12px',
              border: '2px solid white'
            }"
          >
            +{{ users.length - 3 }}
          </q-avatar>
        </div>
      </template>
      
      <!-- Typing dots -->
      <q-spinner-dots size="2rem" color="grey-7" />
    </q-chat-message>

    <!-- Expandable Preview Panel -->
    <q-slide-transition>
      <div v-show="isExpanded" class="animated-slide-in">
        <!-- Show single user detail -->
        <div v-if="selectedUser" class="q-ml-xs">
          <q-chat-message
            :name="selectedUser.nickName"
            bg-color="grey-3"
            text-color="grey-8"
            @click="selectedUserId = null"
            class="cursor-pointer"
          >
            <template v-slot:avatar>
              <q-avatar size="40px">
                <img
                  v-if="selectedUser.avatarUrl"
                  :src="selectedUser.avatarUrl"
                  :alt="selectedUser.nickName"
                >
                <template v-else>
                  {{ selectedUser.nickName.charAt(0).toUpperCase() }}
                </template>
              </q-avatar>
            </template>
            
            <div class="row items-center">
              <span>{{ selectedUser.messagePreview || 'typing...' }}</span>
              <q-spinner-dots size="1.5rem" color="grey-7" class="q-ml-xs" />
            </div>
          </q-chat-message>
        </div>
        
        <!-- List all users -->
        <q-card v-else flat bordered class="rounded-borders shadow-1 bg-white" style="margin-left: 52px">
          <q-card-section class="q-pa-none">
            <q-scroll-area 
              :style="users.length > 4 ? 'height: 200px' : 'height: auto; max-height: 200px'"
            >
              <q-list separator>
                <q-item 
                  v-for="user in users" 
                  :key="user.userId"
                  clickable
                  class="q-pa-md transition-all hover-bg-grey-2"
                  @click="selectUser(user.userId)"
                >
                  <q-item-section avatar>
                    <q-avatar size="36px">
                      <img
                        v-if="user.avatarUrl"
                        :src="user.avatarUrl"
                        :alt="user.nickName"
                      >
                      <template v-else>
                        {{ user.nickName.charAt(0).toUpperCase() }}
                      </template>
                    </q-avatar>
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-grey-9">
                      {{ user.nickName }}
                    </q-item-label>
                    <q-item-label caption class="row items-center text-grey-7 text-italic q-mt-xs animated-pulse">
                      <q-icon name="edit" size="14px" class="q-mr-xs" />
                      {{ user.messagePreview || 'typing...' }}
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <q-icon name="chevron_right" size="20px" color="grey-5" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { TypingUser } from '../types'

export default defineComponent({
  name: 'TypingIndicator',
  props: {
    users: {
      type: Array as PropType<TypingUser[]>,
      default: () => []
    },
    maxPreview: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      isExpanded: false,
      selectedUserId: null as number | null
    }
  },
  computed: {
    displayedUsers(): TypingUser[] {
      return this.users.slice(0, this.maxPreview)
    },
    selectedUser(): TypingUser | null {
      if (!this.selectedUserId) return null
      return this.users.find(u => u.userId === this.selectedUserId) || null
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
  watch: {
    users: {
      handler(newUsers) {
        // Auto-collapse when all users stop typing
        if (newUsers.length === 0) {
          this.isExpanded = false
        }
      },
      deep: true
    }
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded
      if (!this.isExpanded) {
        this.selectedUserId = null
      }
    },
    selectUser(userId: number) {
      this.selectedUserId = userId
      this.isExpanded = true
    }
  }
})
</script>

<style scoped>
.cursor-pointer:hover {
  opacity: 0.9;
}

.stacked-avatar {
  transition: transform 0.2s;
}

.clickable-avatar {
  cursor: pointer;
}

.clickable-avatar:hover {
  transform: scale(1.15);
  filter: brightness(1.1);
}

.stacked-avatar:hover {
  transform: scale(1.1);
}

.animated-slide-in {
  animation: slideIn 0.3s ease-out;
}
</style>
