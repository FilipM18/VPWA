<template>
  <div class="settings-page">
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ProfileSettings from '../components/settings/ProfileSettings.vue';
import SecuritySettings from '../components/settings/SecuritySettings.vue';
import NotificationSettings from '../components/settings/NotificationSettings.vue';
import type { User, NotificationPreferences } from '../types';

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
      currentUser: {
        id: 1,
        firstName: 'Ján',
        lastName: 'Novák',
        nickName: 'janko_novak',
        email: 'jan.novak@example.com',
        status: 'online',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        avatarUrl: ''
      } as User,
      notificationSettings: {
        mentionsOnly: false,
        enableDndMode: false,
        newMessages: true,
        directMessages: true,
        channelInvites: true,
        soundEnabled: true,
        soundVolume: 70
      } as NotificationPreferences
    };
  },
  methods: {
    handleProfileUpdate(updates: Partial<User>): void {
      console.log('Profile update (pripravené pre backend):', updates);
      
      Object.assign(this.currentUser, updates);
      
      this.$q.notify({
        type: 'positive',
        message: 'Profil bol úspešne aktualizovaný',
        position: 'top'
      });
      
      // TODO: API call
      // await api.updateProfile(updates);
    },
    
    handlePasswordUpdate(): void {
      
      this.$q.notify({
        type: 'positive',
        message: 'Heslo bolo úspešne zmenené',
        position: 'top'
      });
      
      // TODO: API call
      // await api.changePassword(passwords);
    },
    
    handleNotificationUpdate(settings: NotificationPreferences): void {
      console.log('Notification settings (pripravené pre backend):', settings);
      
      this.notificationSettings = settings;
      
      if (settings.enableDndMode && this.currentUser.status !== 'dnd') {
        this.currentUser.status = 'dnd';
      } else if (!settings.enableDndMode && this.currentUser.status === 'dnd') {
        this.currentUser.status = 'online';
      }
      
      this.$q.notify({
        type: 'positive',
        message: 'Nastavenia notifikácií boli uložené',
        position: 'top'
      });
      
      // TODO: API call
      // await api.updateNotificationSettings(settings);
    }
  }
});
</script>