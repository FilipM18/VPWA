<template>
  <div class="settings-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <template v-else-if="currentUser">
      <!-- Profile Section -->
      <profile-settings
        v-if="currentSection === 'profile'"
        :current-user="currentUser"
        @update-profile="handleProfileUpdate"
      />

      <!-- Security Section -->
      <security-settings
        v-if="currentSection === 'security'"
        :current-user="currentUser"
        @update-password="handlePasswordUpdate"
      />

      <!-- Notifications Section -->
      <notification-settings
        v-if="currentSection === 'notifications'"
        :notification-settings="notificationSettings"
        @update-settings="handleNotificationUpdate"
      />
    </template>

    <!-- Error State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-h6 q-mt-md">Nepodarilo sa načítať používateľa</div>
      <q-btn color="primary" label="Skúsiť znova" class="q-mt-md" @click="loadCurrentUser" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ProfileSettings from '../components/settings/ProfileSettings.vue';
import SecuritySettings from '../components/settings/SecuritySettings.vue';
import NotificationSettings from '../components/settings/NotificationSettings.vue';
import type { User, NotificationPreferences } from '../types';
import { getCurrentUser } from '../api';
import notificationService from '../services/notificationService';

export default defineComponent({
  name: 'SettingsPage',
  components: {
    ProfileSettings,
    SecuritySettings,
    NotificationSettings
  },
  props: {
    currentSection: {
      type: String,
      default: 'profile'
    }
  },
  data() {
    return {
      currentUser: null as User | null,
      isLoading: true,
      notificationSettings: notificationService.getPreferences()
    };
  },
  async mounted() {
    await this.loadCurrentUser();
  },
  methods: {
    async loadCurrentUser(): Promise<void> {
      const token = localStorage.getItem('auth_token') || undefined;
      try {
        this.currentUser = await getCurrentUser(token);
      } catch (error) {
        console.error('Failed to load current user:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Nepodarilo sa načítať používateľa',
          position: 'top'
        });
      } finally {
        this.isLoading = false;
      }
    },

    handleProfileUpdate(updatedUser: User): void {
      // Update local state with the response from API
      this.currentUser = updatedUser;
    },

    handlePasswordUpdate(): void {
      // Password was already changed via API in SecuritySettings
      // Just show success notification is handled there
    },

    handleNotificationUpdate(settings: NotificationPreferences): void {
      this.notificationSettings = settings;

      // DND sync is handled in NotificationSettings via MainLayout
    }
  }
});
</script>
