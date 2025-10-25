<template>
  <div class="q-pa-sm bg-grey-2">
    <div class="row items-center no-wrap">
    <q-btn flat no-caps class="col" :padding="$q.screen.lt.sm ? '8px 8px' : '8px 12px'">
      <div class="row items-center no-wrap full-width">
        <q-avatar size="40px">
          <div
            v-if="!currentUser?.avatarUrl"
            class="absolute-full flex flex-center bg-accent text-white"
          >
            {{ userInitial }}
          </div>
          <img
            v-else
            :src="currentUser.avatarUrl"
            @error="handleAvatarError"
          >
          <q-badge
            :color="statusColor"
            floating
            rounded
          />
        </q-avatar>

        <div class="q-ml-md text-left col ellipsis">
          <div class="text-weight-medium ellipsis">{{ currentUser?.nickName }}</div>
          <div class="text-caption text-grey-6 ellipsis">{{ statusLabel }}</div>
        </div>

        <q-space />
      </div>

      <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-card style="min-width: 300px">
        <!-- User Info -->
        <q-card-section class="row items-center no-wrap">
          <q-avatar size="50px">
            <div class="absolute-full flex flex-center bg-accent text-white ">
              {{ userInitial }}
            </div>
          </q-avatar>
          <div class="q-ml-md">
            <div class="text-weight-bold">{{ currentUser?.nickName }}</div>
            <div class="text-caption text-grey">{{ currentUser?.email }}</div>
          </div>
        </q-card-section>

        <q-separator />

        <!-- Status Options -->
        <q-list dense>
          <q-item-label header>Nastaviť status</q-item-label>

          <q-item
            v-for="status in statusOptions"
            :key="status.value"
            clickable
            v-ripple
            @click="setStatus(status.value)"
            :active="userStatus === status.value"
            active-class="bg-grey-2"
          >
            <q-item-section avatar>
              <q-icon :name="status.icon" :color="status.color" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ status.label }}</q-item-label>
              <q-item-label caption>{{ status.description }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="userStatus === status.value">
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Settings -->
          <q-item>
            <q-item-section>
              <q-item-label>Notifikácie len pre @zmienky</q-item-label>
              <q-item-label caption>
                Dostávaj notifikácie len keď ťa niekto spomenie
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="mentionOnly"
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item clickable v-ripple v-close-popup @click="openSettings">
            <q-item-section avatar>
              <q-icon name="settings" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Nastavenia</q-item-label>
              <q-item-label caption>Profil, bezpečnosť a notifikácie</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Logout -->
          <q-item clickable v-ripple @click="handleLogout">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>Odhlásiť sa</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-menu>
    </q-btn>

     <q-btn
        flat
        dense
        round
        icon="settings"
        size="md"
        class="text-grey-6 q-mr-md"
        @click="openSettings"
      >
        <q-tooltip>Nastavenia</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { User, UserStatus } from '../types'

interface StatusOption {
  value: UserStatus
  label: string
  icon: string
  color: string
  description: string
}

export default defineComponent({
  name: 'UserStatusMenu',
  props: {
    currentUser: {
      type: Object as PropType<User>,
      required: true
    },
    userStatus: {
      type: String as PropType<UserStatus>,
      default: 'online'
    }
  },
  emits: ['status-changed', 'logout'],
  data() {
    return {
      mentionOnly: false,
      avatarError: false,
      statusOptions: [
        {
          value: 'online',
          label: 'Online',
          icon: 'circle',
          color: 'positive',
          description: 'Dostupný pre všetky správy'
        },
        {
          value: 'dnd',
          label: 'Nerušiť',
          icon: 'do_not_disturb_on',
          color: 'warning',
          description: 'Žiadne notifikácie'
        },
        {
          value: 'offline',
          label: 'Offline',
          icon: 'radio_button_unchecked',
          color: 'grey',
          description: 'Zdaj sa offline'
        }
      ] as StatusOption[]
    }
  },
  computed: {
    userInitial(): string {
      return this.currentUser?.nickName?.charAt(0)?.toUpperCase() || 'U'
    },
    statusColor(): string {
      switch (this.userStatus) {
        case 'online':
          return 'positive'
        case 'dnd':
          return 'warning'
        case 'offline':
          return 'grey'
        default:
          return 'grey'
      }
    },
    statusLabel(): string {
      switch (this.userStatus) {
        case 'online':
          return 'Online'
        case 'dnd':
          return 'Nerušiť'
        case 'offline':
          return 'Offline'
        default:
          return 'Online'
      }
    }
  },
  methods: {
    setStatus(status: UserStatus): void {
      this.$emit('status-changed', status)
    },
    handleAvatarError(): void {
      this.avatarError = true
    },
    handleLogout(): void {
      this.$q
        .dialog({
          title: 'Odhlásiť sa',
          message: 'Naozaj sa chceš odhlásiť?',
          cancel: true,
          persistent: false
        })
        .onOk(() => {
          this.$emit('logout')
        })
    },
    openSettings(): void {
      this.$router.push('/settings').catch(() => {});
    }
  }
})
</script>
