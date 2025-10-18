<template>
  <q-page class="chat-page-container">
    <!-- Messages Area -->
    <div class="messages-area">
      <q-scroll-area 
        ref="scrollArea"
        class="messages-scroll-area"
      >
        <!-- Messages Container -->
        <div class="messages-container q-pa-md">
          <!-- Empty State -->
          <div class="text-center q-pa-xl">
            <q-icon name="forum" size="80px" color="grey-5" />
            <div class="text-h6 text-grey-7 q-mt-md">Žiadne správy</div>
            <div class="text-caption text-grey-6">Buď prvý, kto napíše správu!</div>
          </div>
        </div>
      </q-scroll-area>
    </div>

    <!-- Message Input at Bottom -->
    <div class="message-input-area">
      <message-input
        :channel-id="channelId"
        :members="members"
        @message-sent="handleMessageSent"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import MessageInput from '../components/MessageInput.vue'
import type { User, ChatMessage } from '../types'

export default defineComponent({
  name: 'ChatPage',
  components: {
    MessageInput
  },
  props: {
    channelId: {
      type: Number,
      required: true
    },
    currentUser: {
      type: Object as PropType<User>,
      required: true
    },
    members: {
      type: Array as PropType<User[]>,
      default: () => []
    }
  },
  emits: ['message-sent'],
  data() {
    return {
      messages: []
    }
  },
  methods: {
    handleMessageSent(message: ChatMessage): void {
      this.$emit('message-sent', message)
    }
  }
})
</script>

<style scoped>
.chat-page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.messages-area {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.messages-scroll-area {
  height: 100%;
  width: 100%;
}

.messages-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  min-height: 100%;
}

.message-input-area {
  flex: 0 0 auto;
  background: white;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
}

@media (max-width: 1600px) {
  .messages-container {
    max-width: 1000px;
  }
}

@media (max-width: 1200px) {
  .messages-container {
    max-width: 900px;
  }
}

@media (max-width: 1023px) {
  .messages-container {
    max-width: 100%;
    padding: 16px;
  }
}

@media (max-width: 767px) {
  .messages-container {
    padding: 12px;
  }
}
</style>
