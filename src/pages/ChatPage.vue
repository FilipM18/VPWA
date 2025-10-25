<template>
  <q-page class="column full-height bg-grey-1">

    <!-- Messages Area -->
    <div class="col overflow-hidden">
      <!-- Messages Container -->
      <div class="full-width q-pa-xl">
        <q-infinite-scroll
          reverse
        >
          <div
            class="col-xs-12 col-sm-12 col-md-10 col-lg-8 col-xl-7 q-pa-md"
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
          >

          <!-- Messages or Empty State -->
          <div v-if="messages.length > 0">
            <!-- Date Separators and Messages -->
            <template v-for="(item, index) in messagesWithDates" :key="`item-${index}`">
              <!-- Date Separator -->
              <div
                v-if="item.type === 'date'"
                class="date-separator q-my-md"
              >
                <q-chip
                  color="grey-4"
                  text-color="grey-8"
                  icon="event"
                  square
                >
                  {{ item.label }}
                </q-chip>
              </div>

              <!-- Message Item -->
              <message-item
                v-else-if="item.type === 'message'"
                :message="item.data"
                :is-own="item.data.authorId === currentUserId"
                :current-user-id="currentUserId"
                :users="members"
              />
            </template>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center q-pa-xl">
            <q-icon name="forum" size="80px" color="grey-5" />
            <div class="text-h6 text-grey-7 q-mt-md">Žiadne správy</div>
            <div class="text-caption text-grey-6">Buď prvý, kto napíše správu!</div>
          </div>
          </div>
      </q-infinite-scroll>
      </div>
    </div>



    <!-- Message Input at Bottom -->

    <div class="col-auto bg-white absolute-bottom input-stick">
       <!-- Typing indicator -->
    <q-slide-transition>
      <div v-if="typingUsers.length > 0" class="bg-grey-2 q-pa-sm">
        <TypingIndicator :users="typingUsers" @showAll="openTypingDialog" />
      </div>
    </q-slide-transition>

      <q-separator />
      <message-input
        :current-user="currentUser"
        :channel-id="channelId"
        :members="members"
        @message-sent="handleMessageSent"
      />
    </div>

    <!-- Typing users dialog -->
    <q-dialog v-model="showAllTypingUsers">
      <q-card>
        <q-card-section>
          <div class="text-h6">Píšu tieto osoby:</div>
          <div v-for="user in typingUsers" :key="user.userId" class="q-mt-sm">
            <span class="text-weight-bold">{{ user.nickName }}:</span>
            <span class="text-italic">{{ user.messagePreview }}</span>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Zavrieť" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import MessageInput from '../components/MessageInput.vue'
import type { User, ChatMessage } from '../types'
import MessageItem from '../components/MessageItem.vue'
import { mockMessages } from '../utils/mockMessages'
import TypingIndicator from '../components/TypingIndicator.vue'

type MessageWithDate = { type: 'date'; label: string }
type MessageEntry = { type: 'message'; data: ChatMessage }
type MessageListItem = MessageWithDate | MessageEntry

export default defineComponent({
  name: 'ChatPage',
  components: {
    MessageInput,
    MessageItem,
    TypingIndicator
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
      messages: [] as ChatMessage[],
      showAllTypingUsers: false,
      typingUsers: [
        { channelId: 1, userId: 5, nickName: 'Eva', isTyping: true, messagePreview: 'Ahoj, poďme...', avatarUrl: 'https://cdn.quasar.dev/img/avatar5.jpg' },
        { channelId: 1, userId: 1, nickName: 'Ján', isTyping: true, messagePreview: 'Čo robíš dnes?', avatarUrl: 'https://cdn.quasar.dev/img/avatar1.jpg' },
        { channelId: 1, userId: 3, nickName: 'Peter', isTyping: true, messagePreview: 'Pridám sa k vám...', avatarUrl: 'https://cdn.quasar.dev/img/avatar3.jpg' }
      ],
    }
  },
  mounted() {
    // Load mock messages - timestamps are already Date objects
    this.messages = mockMessages
  },
  computed: {
    currentUserId(): number {
      return this.currentUser.id
    },
    messagesWithDates(): MessageListItem[] {
      const items: MessageListItem[] = []
      let lastDate: string | null = null

      this.messages.forEach((message) => {
        const messageDate = new Date(message.timestamp)
        const dateLabel = this.formatDate(messageDate)

        if (lastDate !== dateLabel) {
          items.push({ type: 'date', label: dateLabel })
          lastDate = dateLabel
        }

        items.push({ type: 'message', data: message })
      })

      return items
    }
  },
  methods: {
    handleMessageSent(message: ChatMessage): void {
      // toto zatial len príprava na pridanie správy do zoznamu
      const newMessage: ChatMessage = {
        ...message,
        id: this.messages.length + 1,
        channelId: this.channelId,
        authorId: this.currentUserId,
        author: this.currentUser.nickName,
        timestamp: new Date()
      }
      this.messages.push(newMessage)
      this.$emit('message-sent', newMessage)
    },
    openTypingDialog() {
      this.showAllTypingUsers = true
    },
    formatDate(date: Date): string {
      const today = new Date()
      const messageDate = new Date(date)
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      )
      const diffTime = todayDate.getTime() - messageDateOnly.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 0) {
        return 'Dnes'
      }
      if (diffDays === 1) {
        return 'Včera'
      }
      if (diffDays < 7) {
        return messageDate.toLocaleDateString('sk-SK', { weekday: 'long' })
      }
      return messageDate.toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'long',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }
})
</script>

<style scoped>
  .input-stick { position: sticky; bottom: 0; z-index: 10; background: white; }
</style>
