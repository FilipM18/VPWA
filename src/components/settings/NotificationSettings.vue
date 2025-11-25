<template>
  <div class="notification-settings">
    <div class="text-h5 text-weight-bold q-mb-lg">Nastavenia notifikácií</div>

    <!-- Browser Permission Card -->
    <q-card flat bordered class="q-mb-md" :class="permissionCardClass">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon :name="permissionIcon" :color="permissionColor" class="q-mr-sm" />
              Browser notifikácie
            </div>
            <div class="text-caption text-grey-7">
              {{ permissionText }}
            </div>
          </div>
          <q-btn
            v-if="notificationPermission !== 'granted'"
            :label="notificationPermission === 'denied' ? 'Blokované' : 'Povoliť'"
            :color="notificationPermission === 'denied' ? 'grey' : 'primary'"
            :disable="notificationPermission === 'denied'"
            @click="requestNotificationPermission"
          >
            <q-tooltip v-if="notificationPermission === 'denied'">
              Notifikácie sú blokované v prehliadači. Povoľ ich v nastaveniach.
            </q-tooltip>
          </q-btn>
          <q-badge v-else color="positive" label="Povolené" class="q-px-md q-py-xs" />
        </div>
      </q-card-section>
    </q-card>

    <!-- DND Mode Card -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Nerušiť (DND)</div>
            <div class="text-caption text-grey-7">
              Keď je aktívny, nebudete dostávať žiadne notifikácie
            </div>
          </div>
          <q-toggle
            v-model="localSettings.enableDndMode"
            color="negative"
            size="lg"
            @update:model-value="handleSettingsChange"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Mentions Only Card -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Iba spomenutia</div>
            <div class="text-caption text-grey-7">
              Dostávať notifikácie iba pre správy, kde ste spomenutý (@používateľ)
            </div>
          </div>
          <q-toggle
            v-model="localSettings.mentionsOnly"
            color="primary"
            size="lg"
            @update:model-value="handleSettingsChange"
            :disable="localSettings.enableDndMode"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Notification Types -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Typy notifikácií</div>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label>Nové správy</q-item-label>
              <q-item-label caption>Notifikácia pri novej správe v kanáli</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="localSettings.newMessages"
                color="primary"
                :disable="localSettings.enableDndMode"
              />
            </q-item-section>
          </q-item>

          <q-separator inset />

          <q-item>
            <q-item-section>
              <q-item-label>Priame správy</q-item-label>
              <q-item-label caption>Notifikácia pri priamej správe</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="localSettings.directMessages"
                color="primary"
                :disable="localSettings.enableDndMode"
              />
            </q-item-section>
          </q-item>

          <q-separator inset />

          <q-item>
            <q-item-section>
              <q-item-label>Pozvánky do kanálov</q-item-label>
              <q-item-label caption>Notifikácia pri pozvaní do nového kanála</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="localSettings.channelInvites"
                color="primary"
                :disable="localSettings.enableDndMode"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Sound Settings -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">Zvukové nastavenia</div>
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label>Zvuky notifikácií</q-item-label>
              <q-item-label caption>Prehrať zvuk pri notifikácii</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                v-model="localSettings.soundEnabled"
                color="primary"
                :disable="localSettings.enableDndMode"
              />
            </q-item-section>
          </q-item>

          <q-separator inset />

          <q-item v-if="localSettings.soundEnabled" :disable="localSettings.enableDndMode">
            <q-item-section>
              <q-item-label>Hlasitosť</q-item-label>
              <q-slider
                v-model="localSettings.soundVolume"
                :min="0"
                :max="100"
                label
                label-always
                color="primary"
                class="q-mt-sm"
                @update:model-value="handleSettingsChange"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Info Banner -->
    <q-banner v-if="localSettings.enableDndMode" rounded class="bg-amber-1 text-amber-9 q-mt-md">
      <template v-slot:avatar>
        <q-icon name="do_not_disturb_on" color="amber-9" />
      </template>
      <div class="text-weight-medium">Režim Nerušiť je aktívny</div>
      <div class="text-caption">
        Všetky notifikácie sú momentálne vypnuté. Správy sa budú zobrazovať až po prepnutí do režimu Online.
      </div>
    </q-banner>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { NotificationPreferences } from '../../types';
import notificationService from '../../services/notificationService';

export default defineComponent({
  name: 'NotificationSettings',
  props: {
    notificationSettings: {
      type: Object as PropType<NotificationPreferences>,
      required: true
    }
  },
  emits: ['update-settings'],
  data() {
    return {
      localSettings: {
        mentionsOnly: this.notificationSettings.mentionsOnly || false,
        enableDndMode: this.notificationSettings.enableDndMode || false,
        newMessages: this.notificationSettings.newMessages ?? true,
        directMessages: this.notificationSettings.directMessages ?? true,
        channelInvites: this.notificationSettings.channelInvites ?? true,
        soundEnabled: this.notificationSettings.soundEnabled ?? true,
        soundVolume: this.notificationSettings.soundVolume ?? 70
      },
      notificationPermission: notificationService.getPermission()
    };
  },
  computed: {
    permissionIcon(): string {
      if (this.notificationPermission === 'granted') return 'check_circle'
      if (this.notificationPermission === 'denied') return 'block'
      return 'notifications'
    },
    permissionColor(): string {
      if (this.notificationPermission === 'granted') return 'positive'
      if (this.notificationPermission === 'denied') return 'negative'
      return 'grey'
    },
    permissionText(): string {
      if (this.notificationPermission === 'granted') {
        return 'Browser notifikácie sú povolené a fungujú'
      }
      if (this.notificationPermission === 'denied') {
        return 'Browser notifikácie sú blokované. Povoľ ich v nastaveniach prehliadača.'
      }
      return 'Klikni na tlačidlo pre povolenie browser notifikácií'
    },
    permissionCardClass(): string {
      if (this.notificationPermission === 'granted') return 'bg-green-1'
      if (this.notificationPermission === 'denied') return 'bg-red-1'
      return ''
    }
  },
  watch: {
    'localSettings.enableDndMode'(newValue: boolean) {
      if (newValue) {
        console.log('DND mode enabled - notifications will be disabled');
      } else {
        console.log('DND mode disabled - notifications will be enabled');
      }
    }
  },
  methods: {
    async requestNotificationPermission(): Promise<void> {
      const permission = await notificationService.requestPermission()
      this.notificationPermission = permission

      if (permission === 'granted') {
        this.$q.notify({
          type: 'positive',
          message: 'Notifikácie boli úspešne povolené',
          position: 'top'
        })

        // Ukážka notifikácie
        notificationService.showNotification({
          title: 'ChatFlow Notifikácie',
          body: 'Notifikácie sú teraz aktívne!',
          icon: '/icons/favicon-128x128.png'
        })
      } else if (permission === 'denied') {
        this.$q.notify({
          type: 'negative',
          message: 'Notifikácie boli blokované. Povoľ ich v nastaveniach prehliadača.',
          position: 'top'
        })
      }
    },
    handleSettingsChange(): void {
      notificationService.savePreferences(this.localSettings)
      
      this.$emit('update-settings', this.localSettings);
      
      this.$q.notify({
        type: 'info',
        message: 'Nastavenia boli uložené',
        position: 'top',
        timeout: 1000
      })
    }
  }
});
</script>