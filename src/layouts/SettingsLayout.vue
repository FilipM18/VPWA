<template>
  <q-layout view="hHh LpR fFf">
    <!-- Mobile: Drawer -->
    <q-drawer
      v-if="$q.screen.lt.md"
      v-model="drawerOpen"
      :width="280"
      :breakpoint="0"
      overlay
      behavior="mobile"
      class="bg-grey-2"
    >
      <div class="q-pa-md">
        <div class="text-overline text-grey-7 q-mb-md q-px-sm">
          POUŽÍVATEĽSKÉ NASTAVENIA
        </div>

        <q-list>
          <q-item
            clickable
            v-ripple
            :active="currentSection === 'profile'"
            @click="selectSection('profile')"
            active-class="bg-primary text-white"
            class="rounded-borders q-mb-xs"
          >
            <q-item-section avatar>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Môj účet</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="currentSection === 'security'"
            @click="selectSection('security')"
            active-class="bg-primary text-white"
            class="rounded-borders q-mb-xs"
          >
            <q-item-section avatar>
              <q-icon name="lock" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Bezpečnosť</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="currentSection === 'notifications'"
            @click="selectSection('notifications')"
            active-class="bg-primary text-white"
            class="rounded-borders q-mb-xs"
          >
            <q-item-section avatar>
              <q-icon name="notifications" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Notifikácie</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item
            clickable
            v-ripple
            @click="closeSettings"
            class="rounded-borders text-grey-8"
          >
            <q-item-section avatar>
              <q-icon name="close" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Späť na chat</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <!-- Desktop: Fixed Sidebar + Content -->
      <div v-if="$q.screen.gt.sm" class="row no-wrap" style="height: 100vh;">
        <!-- Desktop Sidebar -->
        <div 
          class="col-auto bg-grey-2"
          style="width: 260px; border-right: 1px solid #e0e0e0"
        >
          <div class="q-pa-md">
            <div class="text-overline text-grey-7 q-mb-md q-px-sm">
              POUŽÍVATEĽSKÉ NASTAVENIA
            </div>

            <q-list>
              <q-item
                clickable
                v-ripple
                :active="currentSection === 'profile'"
                @click="currentSection = 'profile'"
                active-class="bg-primary text-white"
                class="rounded-borders q-mb-xs"
              >
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Môj účet</q-item-label>
                </q-item-section>
              </q-item>

              <q-item
                clickable
                v-ripple
                :active="currentSection === 'security'"
                @click="currentSection = 'security'"
                active-class="bg-primary text-white"
                class="rounded-borders q-mb-xs"
              >
                <q-item-section avatar>
                  <q-icon name="lock" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Bezpečnosť</q-item-label>
                </q-item-section>
              </q-item>

              <q-item
                clickable
                v-ripple
                :active="currentSection === 'notifications'"
                @click="currentSection = 'notifications'"
                active-class="bg-primary text-white"
                class="rounded-borders q-mb-xs"
              >
                <q-item-section avatar>
                  <q-icon name="notifications" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Notifikácie</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator class="q-my-md" />

              <q-item
                clickable
                v-ripple
                @click="closeSettings"
                class="rounded-borders text-grey-8"
              >
                <q-item-section avatar>
                  <q-icon name="close" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Späť na chat</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Desktop Content -->
        <div class="col bg-white">
          <q-scroll-area style="height: 100vh;">
            <div class="q-pa-lg" style="max-width: 900px; margin: 0 auto;">
              <router-view
                :current-section="currentSection"
                @section-change="currentSection = $event"
              />
            </div>
          </q-scroll-area>
        </div>
      </div>

      <!-- Mobile: Full Width Content with Header -->
      <div v-else class="bg-white" style="min-height: 100vh;">
        <!-- Mobile Header -->
        <q-toolbar class="bg-primary text-white">
          <q-btn
            flat
            dense
            round
            icon="menu"
            @click="drawerOpen = true"
          />
          <q-toolbar-title>
            {{ currentSectionTitle }}
          </q-toolbar-title>
          <q-btn
            flat
            dense
            round
            icon="close"
            @click="closeSettings"
          />
        </q-toolbar>

        <!-- Mobile Content -->
        <div class="q-pa-md">
          <router-view
            :current-section="currentSection"
            @section-change="currentSection = $event"
          />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SettingsLayout',
  data() {
    return {
      currentSection: 'profile',
      drawerOpen: false
    };
  },
  computed: {
    currentSectionTitle(): string {
      switch (this.currentSection) {
        case 'profile':
          return 'Môj účet';
        case 'security':
          return 'Bezpečnosť';
        case 'notifications':
          return 'Notifikácie';
        default:
          return 'Nastavenia';
      }
    }
  },
  methods: {
    selectSection(section: string): void {
      this.currentSection = section;
      this.drawerOpen = false;
    },
    closeSettings(): void {
      this.$router.push('/chat').catch(() => {});
    }
  }
});
</script>