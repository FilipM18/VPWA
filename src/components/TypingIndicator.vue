<template>
  <div v-if="users.length > 0" class="typing-indicator-container">
    <!-- Main Typing Indicator (kept as is) -->
    <q-chat-message
      bg-color="grey-3"
      text-color="grey-8"
      @click="toggleExpanded"
      class="typing-indicator-main"
    >
      <template v-slot:name>
        <div class="typing-header">
          <span>{{ typingMessage }}</span>
          <q-icon 
            :name="isExpanded ? 'expand_less' : 'expand_more'" 
            size="20px"
            class="expand-icon"
          />
        </div>
      </template>
      
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

    <!-- Expandable Preview Panel -->
    <q-slide-transition>
      <div v-show="isExpanded" class="typing-preview-panel">
        <q-card flat bordered class="preview-card">
          <q-card-section class="preview-header">
            <div class="text-subtitle2 text-grey-8">
              <q-icon name="edit" size="18px" class="q-mr-xs" />
              Message previews
            </div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section class="preview-content">
            <q-scroll-area 
              :style="users.length > 4 ? 'height: 200px' : 'height: auto; max-height: 200px'"
            >
              <q-list separator>
                <q-item 
                  v-for="user in users" 
                  :key="user.userId"
                  class="preview-item"
                >
                  <q-item-section avatar>
                    <img
                      v-if="user.avatarUrl"
                      :src="user.avatarUrl"
                      :alt="user.nickName"
                      class="preview-avatar"
                    >
                    <q-avatar
                      v-else
                      color="primary"
                      text-color="white"
                      size="36px"
                    >
                      {{ user.nickName.charAt(0).toUpperCase() }}
                    </q-avatar>
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-grey-9">
                      {{ user.nickName }}
                    </q-item-label>
                    <q-item-label caption class="message-preview">
                      <q-icon name="edit" size="14px" class="q-mr-xs" />
                      {{ user.messagePreview || 'typing...' }}
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <q-spinner-dots size="24px" color="primary" />
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
  data() {
    return {
      isExpanded: false
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
    }
  }
})
</script>

<style scoped>
.typing-indicator-container {
  width: 100%;
}

.typing-indicator-main {
  cursor: pointer;
  transition: all 0.2s ease;
}

.typing-indicator-main:hover {
  opacity: 0.9;
}

.typing-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  transition: transform 0.3s ease;
  opacity: 0.7;
}

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

/* Preview Panel Styles */
.typing-preview-panel {
  margin-top: 8px;
  margin-left: 52px; /* Align with message content */
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.preview-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
}

.preview-content {
  padding: 0;
}

.preview-item {
  padding: 12px 16px;
  transition: background-color 0.2s ease;
}

.preview-item:hover {
  background-color: #f5f5f5;
}

.preview-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.message-preview {
  display: flex;
  align-items: center;
  color: #757575;
  font-style: italic;
  margin-top: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .typing-preview-panel {
    margin-left: 0;
  }
  
  .preview-card {
    border-radius: 8px;
  }
}
</style>
