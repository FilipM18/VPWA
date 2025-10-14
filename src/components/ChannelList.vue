<template>
  <div class="column no-wrap full-height">
    <!-- Header -->
    <q-toolbar class="bg-gradient">
      <q-avatar size="40px">
        <q-icon name="forum" color="white" />
      </q-avatar>
      <q-toolbar-title class="text-white">
        ChatFlow
      </q-toolbar-title>
      
      <!-- Close button for mobile -->
      <q-btn
        flat
        dense
        round
        icon="close"
        color="white"
        class="mobile-close-btn"
        @click="$emit('close')"
      >
        <q-tooltip>Zavrieť</q-tooltip>
      </q-btn>
    </q-toolbar>

    <!-- Search -->
    <div class="q-pa-sm">
      <q-input
        v-model="search"
        filled
        dense
        placeholder="Hľadať kanály..."
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append v-if="search">
          <q-icon 
            name="close" 
            @click="search = ''" 
            class="cursor-pointer" 
          />
        </template>
      </q-input>
    </div>

    <!-- Create Channel Button -->
    <div class="q-pa-sm">
      <q-btn
        push
        color="primary"
        icon="add"
        label="Nový kanál"
        class="full-width"
        @click="showCreateDialog = true"
      />
    </div>

    <q-separator />

    <!-- Channels List -->
    <q-scroll-area class="col">
      <q-list padding>
        <!-- Public Channels -->
        <q-expansion-item
          v-if="publicChannels.length > 0"
          default-opened
          icon="public"
          label="Verejné kanály"
          header-class="text-weight-bold"
        >
        </q-expansion-item>

      </q-list>
    </q-scroll-area>

    <!-- Create Channel Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Vytvoriť nový kanál</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newChannel.name"
            label="Názov kanála"
            filled
            autofocus
            :rules="channelNameRules"
          >
            <template v-slot:prepend>
              <q-icon name="tag" />
            </template>
          </q-input>

          <q-toggle
            v-model="newChannel.isPrivate"
            label="Súkromný kanál"
            color="primary"
            class="q-mt-md"
          />

          <q-banner 
            v-if="newChannel.isPrivate" 
            dense 
            class="bg-amber-1 text-amber-9 q-mt-sm"
          >
            <template v-slot:avatar>
              <q-icon name="info" color="amber" />
            </template>
            Do súkromného kanála môžeš pozývať len ty ako správca
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Zrušiť" 
            @click="cancelCreateDialog" 
          />
          <q-btn
            color="primary"
            label="Vytvoriť"
            @click="createChannel"
            :disable="!isValidChannelName"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { Channel } from '../types'

interface NewChannelState {
  name: string
  isPrivate: boolean
}

export default defineComponent({
  name: 'ChannelList',
  props: {
    channels: {
      type: Array as PropType<Array<Channel & { lastMessage?: string }>>,
      required: true
    },
    currentChannelId: {
      type: Number as PropType<number | null>,
      default: null
    }
  },
  emits: ['channel-selected', 'close'],
  data() {
    return {
      search: '',
      showCreateDialog: false,
      newChannel: {
        name: '',
        isPrivate: false
      } as NewChannelState,
      channelNameRules: [
        (val: string) => !!val || 'Názov je povinný',
        (val: string) => val.length >= 3 || 'Minimálne 3 znaky',
        (val: string) => /^[a-zA-Z0-9_-]+$/.test(val) || 'Len písmená, čísla, _ a -'
      ]
    }
  },
  computed: {
    filteredChannels(): Array<Channel & { lastMessage?: string }> {
      if (!this.search) {
        return this.channels
      }
      const searchLower = this.search.toLowerCase()
      return this.channels.filter(channel => channel.name.toLowerCase().includes(searchLower))
    },
    publicChannels(): Array<Channel & { lastMessage?: string }> {
      return this.filteredChannels.filter(channel => !channel.isPrivate)
    },
    isValidChannelName(): boolean {
      return this.newChannel.name.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(this.newChannel.name)
    }
  },
  methods: {
    selectChannel(channel: Channel): void {
      this.$emit('channel-selected', channel)
    },
    createChannel(): void {
     //TODO neskôr
    },
    cancelCreateDialog(): void {
      this.showCreateDialog = false
      this.resetNewChannel()
    },
    resetNewChannel(): void {
      this.newChannel = {
        name: '',
        isPrivate: false
      }
    },
  }
})
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
}

/* Hide close button on desktop, show on mobile */
.mobile-close-btn {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-close-btn {
    display: inline-flex;
  }
}
</style>