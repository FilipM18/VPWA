<template>
  <q-layout view="hHh LpR fFf">
    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="toggleLeftDrawer"
        />

        <q-space />

        <!-- Members Toggle -->
        <q-btn
          flat
          dense
          round
          icon="group"
          @click="toggleRightDrawer"
        >
          <q-badge v-if="onlineMembers > 0" color="positive" floating>
            {{ onlineMembers }}
          </q-badge>
          <q-tooltip>Členovia ({{ onlineMembers }}/{{ totalMembers }})</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Left Drawer - Channels -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="drawerWidth"
      :breakpoint="600"
    >
      <channel-list
        :channels="channels"
        @close="leftDrawerOpen = false"
      />
    </q-drawer>

    <!-- Right Drawer - Members -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :width="drawerWidth"
      :breakpoint="600"
    >
      <member-list
        :members="members"
        @close="rightDrawerOpen = false"
      />
    </q-drawer>


  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ChannelList from '../components/ChannelList.vue'
import MemberList from '../components/MemberList.vue'
import type { Channel, User} from '../types'
type ChannelWithMeta = Channel & {
  lastMessage?: string
}

export default defineComponent({
  name: 'MainLayout',
  components: {
    ChannelList,
    MemberList
  },
  data() {
    return {
      leftDrawerOpen: true,
      rightDrawerOpen: false,
      currentUser: null as User | null,
      channels: [] as ChannelWithMeta[],
      currentChannelId: null as number | null,
    members: [] as User[],
    }
  },
  computed: {
    currentChannel(): ChannelWithMeta | null {
      return this.channels.find(channel => channel.id === this.currentChannelId) || null
    },
    currentChannelName(): string {
      return this.currentChannel?.name || 'Vyber kanál'
    },
    isCurrentChannelPrivate(): boolean {
      return this.currentChannel?.isPrivate || false
    },
    onlineMembers(): number {
      return this.members.filter(member => member.status === 'online').length
    },
    totalMembers(): number {
      return this.members.length
    },
    drawerWidth(): number {
      // Responsive drawer width based on window size
      if (typeof window === 'undefined') return 300
      const width = window.innerWidth
      if (width >= 1920) return 320
      if (width >= 1440) return 300
      if (width >= 1024) return 280
      if (width >= 768) return 260
      // On mobile, use full width (will be overridden by CSS to 100vw)
      if (width < 600) return width
      return 260
    },
    breakpoint(): string {
      if (typeof window === 'undefined') return 'desktop'
      const width = window.innerWidth
      if (width >= 1920) return 'xl'
      if (width >= 1440) return 'lg'
      if (width >= 1024) return 'md'
      if (width >= 768) return 'sm'
      return 'xs'
    }
  },
  watch: {
    currentChannelId(newId: number | null) {
      if (newId) {
        this.loadChannelData(newId)
      }
    }
  },
  created() {
    this.initializeApp()
  },
  mounted() {
    this.loadInitialData()
  },
  methods: {
    initializeApp(): void {
      const defaultUser: User = {
        id: 1,
        nickName: 'TestUser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: 'online'
      }
      this.currentUser = defaultUser

    },
    loadInitialData(): void {
      const defaultChannels: ChannelWithMeta[] = [
        {
          id: 1,
          name: 'general',
          isPrivate: false,
          adminId: this.currentUser?.id || 1,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          unreadCount: 0
        },
        {
          id: 2,
          name: 'random',
          isPrivate: false,
          adminId: this.currentUser?.id || 1,
          createdAt: new Date(),
          lastActivityAt: new Date(),
          unreadCount: 0
        }
      ]
      this.channels = defaultChannels

      if (this.channels.length > 0 && !this.currentChannelId) {
        const firstChannel = this.channels[0]
        if (firstChannel) {
          this.selectChannel(firstChannel)
        }
      }
      this.loadChannelMembers()
    },
    loadChannelData(channelId: number): void {
      this.$emit('channel-changed', channelId)
      this.loadChannelMembers(channelId)
    },
    loadChannelMembers(channelId?: number | null): void {
      const id = channelId ?? this.currentChannelId
      if (!id) {
        return
      }
      const defaultMembers: User[] = [
        {
          id: this.currentUser?.id || 1,
          nickName: this.currentUser?.nickName || 'TestUser',
          firstName: this.currentUser?.firstName || 'Test',
          lastName: this.currentUser?.lastName || 'User',
          email: this.currentUser?.email || 'test@example.com',
          status: this.currentUser?.status || 'online'
        },
        {
          id: 2,
          nickName: 'Eva',
          firstName: 'Eva',
          lastName: 'Nováková',
          email: 'eva@example.com',
          status: 'online'
        },
        {
          id: 3,
          nickName: 'Peter',
          firstName: 'Peter',
          lastName: 'Horváth',
          email: 'peter@example.com',
          status: 'dnd'
        }
      ]
      this.members = defaultMembers
      
    },
   
    
    toggleLeftDrawer(): void {
      this.leftDrawerOpen = !this.leftDrawerOpen
    },
    toggleRightDrawer(): void {
      this.rightDrawerOpen = !this.rightDrawerOpen
    },
    selectChannel(channel: ChannelWithMeta): void {
      this.currentChannelId = channel.id
      if (this.$q.screen.lt.md) {
        this.leftDrawerOpen = false
      }
      localStorage.setItem('currentChannelId', String(channel.id))
    },
  }
})
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
}

/* Responsive header adjustments */
@media (max-width: 767px) {
  :deep(.q-toolbar) {
    padding: 0 8px;
    min-height: 48px;
  }
  
  :deep(.q-toolbar__title) {
    font-size: 16px;
  }
  
  :deep(.q-btn) {
    min-width: 36px;
    min-height: 36px;
  }
  
  :deep(.q-icon) {
    font-size: 20px;
  }
  
  :deep(.q-badge) {
    font-size: 10px;
    padding: 2px 4px;
  }
}

@media (max-width: 599px) {
  :deep(.q-toolbar) {
    min-height: 44px;
  }
  
  :deep(.q-toolbar__title) {
    font-size: 14px;
  }
  
  :deep(.q-toolbar__title .q-badge) {
    display: none;
  }
  
  :deep(.q-btn) {
    min-width: 32px;
    min-height: 32px;
  }
}

/* Responsive drawer content */
:deep(.q-drawer) {
  transition: width 0.3s ease;
}

@media (max-width: 1023px) {
  :deep(.q-drawer__content) {
    padding: 8px;
  }
}

/* Full width drawers on mobile */
@media (max-width: 599px) {
  :deep(.q-drawer) {
    width: 100vw !important;
    max-width: 100vw !important;
  }
  
  :deep(.q-drawer__content) {
    padding: 12px;
  }
}

/* Fix drawer height on all mobile/tablet when in overlay mode */
@media (max-width: 600px) {
  :deep(.q-drawer--mobile) {
    top: 0 !important;
    height: 100vh !important;
  }
}
</style>