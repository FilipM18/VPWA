<template>
  <q-page class="column full-height bg-grey-1">
    <!-- Messages Area -->
    <div class="col overflow-hidden">
      <q-scroll-area
        ref="scrollArea"
        class="full-height full-width"
      >
        <!-- Messages Container -->
        <div class="row justify-center full-width">
          <div
            class="col-xs-12 col-sm-12 col-md-10 col-lg-8 col-xl-7 q-pa-md"
            :class="$q.screen.lt.md ? 'q-pa-sm' : 'q-pa-md'"
          >
            <!-- Empty State -->
            <div class="text-center q-pa-xl">
              <q-icon name="forum" size="80px" color="grey-5" />
              <div class="text-h6 text-grey-7 q-mt-md">Žiadne správy</div>
              <div class="text-caption text-grey-6">Buď prvý, kto napíše správu!</div>
            </div>
          </div>
        </div>
      </q-scroll-area>
    </div>

    <!-- Message Input at Bottom -->
    <q-separator />
    <div class="col-auto bg-white">
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
