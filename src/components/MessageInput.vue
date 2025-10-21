<template>
  <div class="q-pa-sm font-medium q-mb-sm bg-white w-full flex justify-center">
    <div class="full-width q-my-none q-mx-auto">

      <q-slide-transition>
        <div v-if="showCommandHints" class="q-pa-sm bg-grey-2">
          <div class="text-caption text-grey-7 q-mb-xs">Dostupné príkazy:</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="hint in filteredCommands"
              :key="hint.command"
              clickable
              @click="selectCommand(hint)"
              color="primary"
              text-color="white"
              size="sm"
              dense
            >
              <q-icon name="terminal" size="xs" class="q-mr-xs" />
              <strong>{{ hint.command }}</strong>
              <q-tooltip>{{ hint.description }}</q-tooltip>
            </q-chip>
          </div>
        </div>
      </q-slide-transition>

      <div class="bg-white q-pa-md q-pa-sm-sm q-pa-xs-xs">
        <q-input
          ref="messageInput"
          v-model="message"
          filled
          dense
          :input-class="inputTextClass"
          placeholder="Napíš správu alebo príkaz (/ pre nápovedu)"
          :maxlength="2000"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.tab.prevent="handleTabComplete"
        >
          <template #prepend>
            <q-btn flat dense round icon="attachment" :size="uiSize" :icon-size="iconPx">
              <q-tooltip>Priložiť súbor</q-tooltip>
            </q-btn>
          </template>

          <template #append>
            <q-btn flat dense round icon="mood" :size="uiSize" :icon-size="iconPx">
              <q-popup-proxy>
                <div class="q-pa-md" style="width: 320px">
                  <div class="text-subtitle2 q-mb-sm">Emoji</div>
                  <div class="row q-gutter-xs">
                    <q-btn
                      v-for="emoji in quickEmojis"
                      :key="emoji"
                      flat
                      dense
                      :label="emoji"
                      :size="uiSize"
                      @click="insertEmoji(emoji)"
                    />
                  </div>
                </div>
              </q-popup-proxy>
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="send"
              color="primary"
              :size="uiSize"
              :icon-size="iconPx"
              :disable="!canSend"
              @click="sendMessage"
            >
              <q-tooltip>Odoslať (Enter)</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <div class="row justify-end q-mt-xs text-caption text-grey-6">
          <span :class="{ 'text-warning': message.length > 1800 }">
            {{ message.length }} / 2000
          </span>
        </div>
      </div>

    </div>
  </div>
</template>



<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User } from '../types'

interface CommandHint { command: string; usage: string; description: string }

export default defineComponent({
  name: 'MessageInput',
  props: {
    channelId: { type: Number, required: true },
    members: { type: Array as PropType<User[]>, default: () => [] }
  },
  emits: ['message-sent', 'command-executed', 'typing'],
  data() {
    return {
      message: '',
      typingTimer: null as number | null,
      isTyping: false,
      commands: [
        { command: '/join', usage: 'channelName [private]', description: 'Vytvor alebo sa pripoj do kanála' },
        { command: '/invite', usage: '@nickName', description: 'Pozvi používateľa do kanála' },
        { command: '/kick', usage: '@nickName', description: 'Vyhoď používateľa z kanála' },
        { command: '/revoke', usage: '@nickName', description: 'Odoberte prístup (iba admin)' },
        { command: '/cancel', usage: '', description: 'Opusť kanál' },
        { command: '/quit', usage: '', description: 'Zruš kanál (iba admin)' },
        { command: '/list', usage: '', description: 'Zobraz členov kanála' }
      ] as CommandHint[],
      quickEmojis: ['👍','❤️','😂','😎','🤔','👏','🔥','🎉','💯','✅','🚀','💪'] as string[]
    }
  },
  computed: {
    canSend(): boolean { return this.message.trim().length > 0 },
    showCommandHints(): boolean { return this.message.startsWith('/') && this.message.length >= 1 },
    filteredCommands(): CommandHint[] {
      if (!this.showCommandHints) return []
      const search = this.message.toLowerCase()
      return this.commands.filter(c => c.command.toLowerCase().startsWith(search)).slice(0, 5)
    },

    inputTextClass(): string {
      const s = this.$q.screen
      if (s.lt.sm) return 'text-caption'
      if (s.lt.md) return 'text-body2'
      return 'text-body1'
    },
    uiSize(): 'xs'|'sm'|'md' {
      const s = this.$q.screen
      if (s.lt.sm) return 'xs'
      if (s.lt.md) return 'sm'
      return 'md'
    },
    iconPx(): string | undefined {
      return this.$q.screen.lt.sm ? '18px' : undefined
    }
  },
  methods: {
    sendMessage(): void {
      this.message = ''
    },
    insertEmoji(emoji: string): void {
      this.message += emoji
      const input = this.$refs.messageInput as { focus: () => void } | undefined
      input?.focus()
    },
    selectCommand(command: CommandHint): void {
      this.message = command.command + (command.usage ? ` ${command.usage}` : '')
      const input = this.$refs.messageInput as { focus: () => void } | undefined
      input?.focus()
    },
    handleTabComplete(): void {
      if (this.showCommandHints && this.filteredCommands.length > 0) {
        const first = this.filteredCommands[0]
        if (first) this.selectCommand(first)
      }
    }
  }
})
</script>
