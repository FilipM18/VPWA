<template>
  <div class="channel-list-wrapper column no-wrap full-height">
    <!-- Header -->
    <q-toolbar
      :style="{
        background: 'linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%)',
      }"
      class="text-white"
    >
      <q-avatar size="40px">
        <q-icon name="forum" color="white" />
      </q-avatar>
      <q-toolbar-title class="text-white"> ChatFlow </q-toolbar-title>

      <!-- Close button for mobile -->
      <q-btn
        flat
        dense
        round
        v-show="$q.screen.lt.md"
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
      <q-input v-model="search" filled dense placeholder="Hľadať kanály...">
        <template #prepend>
          <q-icon name="search" />
        </template>
        <template #append v-if="search">
          <q-icon name="close" @click="search = ''" class="cursor-pointer" />
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
      <q-list
        class="q-px-0"
        padding
      >
        <!-- Pozvánky -->
      <q-expansion-item
        v-if="invitedChannels.length > 0"
        default-opened
        icon="campaign"
        label="Pozvánky"
        header-class="text-weight-bold"
      >
        <channel-item
          v-for="channel in invitedChannels"
          :key="channel.id"
          :channel="channel"
          :is-active="channel.id === currentChannelId"
          :is-admin="channel.adminId === currentUserId"
          :invited="true"
          @select="selectChannel"
          @accept="acceptInvite"
          @reject="rejectInvite"
          @leave="leaveChannel"
          @delete="deleteChannel"
        />
      </q-expansion-item>

        <!-- Public Channels -->
        <q-expansion-item
          v-if="publicChannels.length > 0"
          default-opened
          icon="public"
          label="Verejné kanály"
          header-class="text-weight-bold"
        >
          <channel-item
            v-for="channel in publicChannels"
            :key="channel.id"
            :channel="channel"
            :is-active="channel.id === currentChannelId"
            :is-admin="channel.adminId === currentUserId"
            :invited="false"
            @select="selectChannel"
            @leave="leaveChannel"
            @delete="deleteChannel"
          />
        </q-expansion-item>

        <!-- Private Channels -->
        <q-expansion-item
          v-if="privateChannels.length > 0"
          default-opened
          icon="lock"
          label="Súkromné kanály"
          header-class="text-weight-bold"
        >
          <channel-item
            v-for="channel in privateChannels"
            :key="channel.id"
            :channel="channel"
            :is-active="channel.id === currentChannelId"
            :is-admin="channel.adminId === currentUserId"
            :invited="false"
            @select="selectChannel"
            @leave="leaveChannel"
            @delete="deleteChannel"
          />
        </q-expansion-item>
      </q-list>
    </q-scroll-area>

    <!-- Create Channel Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="width: 100%; max-width: 600px; min-height: 350px;">
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

          <q-slide-transition>
            <div v-if="newChannel.isPrivate" class="q-mt-sm">
              <q-banner dense class="bg-amber-1 text-amber-9">
                <template #avatar><q-icon name="info" color="amber" /></template>
                Do súkromného kanála môžeš pozývať len ty ako správca
              </q-banner>
            </div>
          </q-slide-transition>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Zrušiť" @click="cancelCreateDialog" />
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
import { defineComponent, type PropType } from 'vue';
import ChannelItem from './ChannelItem.vue';
import type { Channel } from '../types';

interface NewChannelState {
  name: string;
  isPrivate: boolean;
}

export default defineComponent({
  name: 'ChannelList',
  components: {
    ChannelItem,
  },
  props: {
    channels: {
      type: Array as PropType<Array<Channel & {
        lastMessage?: string
        isNewInvite?: boolean
        unreadCount?: number
      }>>,
      required: true,
    },
    currentChannelId: {
      type: Number as PropType<number | null>,
      default: null,
    },
    currentUserId: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  emits: ['channel-selected', 'channel-created', 'channel-left', 'channel-deleted', 'close', 'invitation-accepted', 'invitation-rejected'],
  data() {
    return {
      search: '',
      showCreateDialog: false,
      newChannel: {
        name: '',
        isPrivate: false,
      } as NewChannelState,
      channelNameRules: [
        (val: string) => !!val || 'Názov je povinný',
        (val: string) => val.length >= 3 || 'Minimálne 3 znaky',
        (val: string) => /^[a-zA-Z0-9_-]+$/.test(val) || 'Len písmená, čísla, _ a -',
      ],
    };
  },
  computed: {
  filteredChannels(): Array<Channel & { lastMessage?: string; isNewInvite?: boolean }> {
    const list = this.search
      ? this.channels.filter(c => c.name.toLowerCase().includes(this.search.toLowerCase()))
      : this.channels
    return list
  },

  baseVisible(): Array<Channel & {isNewInvite?: boolean }> {
    return this.filteredChannels
  },

  invitedChannels() {
    return [...this.baseVisible].filter(c => c.isNewInvite === true)
      .sort((a,b) => new Date(b.invitedAt ?? 0).getTime() - new Date(a.invitedAt ?? 0).getTime())
  },

  publicChannels() {
    return [...this.baseVisible].filter(c => !c.isPrivate && c.isNewInvite !== true)
      .sort((a,b) => a.name.localeCompare(b.name))
  },

  privateChannels() {
    return [...this.baseVisible].filter(c =>  c.isPrivate && c.isNewInvite !== true)
      .sort((a,b) => a.name.localeCompare(b.name))
  },

  isValidChannelName(): boolean {
    return this.newChannel.name.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(this.newChannel.name)
  },
  },
  methods: {
    selectChannel(channel: Channel): void {
      this.$emit('channel-selected', channel);
    },
    createChannel(): void {
      if (!this.isValidChannelName) {
        return;
      }
      this.$emit('channel-created', {
        name: this.newChannel.name,
        isPrivate: this.newChannel.isPrivate,
      });
      this.showCreateDialog = false;
      this.resetNewChannel();
    },
    cancelCreateDialog(): void {
      this.showCreateDialog = false;
      this.resetNewChannel();
    },
    resetNewChannel(): void {
      this.newChannel = {
        name: '',
        isPrivate: false,
      };
    },
    leaveChannel(channel: Channel): void {
      console.log('ChannelList: leaveChannel called for', channel.name)

      // Ak je admin, ponúkni možnosť zmazať alebo len opustiť
      const isAdmin = channel.adminId === this.currentUserId

      if (isAdmin) {
        this.$q
          .dialog({
            title: 'Opustiť kanál',
            message: `Si správca kanála #${channel.name}. Chceš kanál zmazať alebo ho len opustiť?`,
            cancel: {
              label: 'Zrušiť',
              flat: true,
            },
            options: {
              type: 'radio',
              model: 'leave',
              items: [
                { label: 'Len opustiť (kanál ostane bez správcu)', value: 'leave' },
                { label: 'Zmazať kanál natrvalo', value: 'delete' },
              ],
            },
            persistent: false,
          })
          .onOk((choice: string) => {
            if (choice === 'delete') {
              console.log('ChannelList: Admin chose to delete channel')
              this.$emit('channel-deleted', channel);
            } else {
              console.log('ChannelList: Admin chose to leave channel')
              this.$emit('channel-left', channel);
            }
          });
      } else {
        // Nie je admin, len opustí
        this.$q
          .dialog({
            title: 'Opustiť kanál',
            message: `Naozaj chceš opustiť kanál #${channel.name}?`,
            cancel: true,
            persistent: false,
          })
          .onOk(() => {
            console.log('ChannelList: User confirmed leave, emitting channel-left')
            this.$emit('channel-left', channel);
          });
      }
    },
    deleteChannel(channel: Channel): void {
      console.log('ChannelList: deleteChannel called for', channel.name)
      this.$q
        .dialog({
          title: 'Zmazať kanál',
          message: `Naozaj chceš natrvalo zmazať kanál #${channel.name}?`,
          cancel: true,
          persistent: false,
          ok: {
            label: 'Zmazať',
            color: 'negative',
          },
        })
        .onOk(() => {
          console.log('ChannelList: User confirmed delete, emitting channel-deleted')
          this.$emit('channel-deleted', channel);
        });
    },
    acceptInvite(channel: Channel): void {
      this.$emit('invitation-accepted', channel);
    },
    rejectInvite(channel: Channel): void {
      this.$emit('invitation-rejected', channel);
    },

  },

});
</script>
