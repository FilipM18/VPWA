<template>
  <q-page class="flex flex-center q-pa-md bg-primary">
    <q-card
      flat
      bordered
      class="q-pa-lg q-mx-auto bg-white text-dark full-width"
      style="max-width: 480px; width: 100%; border-radius: 12px;"
    >
      <!-- Brand / headline -->
      <q-card-section class="text-center q-pb-none">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          💬 ChatFlow
        </div>

        <div class="text-subtitle1 text-grey-7">
          {{ isLogin ? 'Vitaj späť!' : 'Vytvor si účet' }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-md">

        <!-- Tabs Prihlásenie / Registrácia -->
        <q-tabs
          v-model="tab"
          dense
          class="text-grey-7 q-mb-md"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="login" label="Prihlásenie" />
          <q-tab name="register" label="Registrácia" />
        </q-tabs>

        <!-- fixná min-height aby nič neskákalo -->
        <q-tab-panels
          v-model="tab"
          style="min-height: 420px;" 
        >
          <!-- Prihlásenie -->
          <q-tab-panel name="login" class="q-pa-none">
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">

              <q-input
                v-model="loginForm.email"
                type="email"
                label="Email"
                outlined
                :rules="loginEmailRules"
              >
                <template #prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>

              <q-input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                label="Heslo"
                outlined
                :rules="passwordRequiredRules"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="togglePassword"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Prihlásiť sa"
                color="primary"
                class="full-width"
                size="lg"
                unelevated
              />
            </q-form>
          </q-tab-panel>

          <!-- Registrácia -->
          <q-tab-panel name="register" class="q-pl-none">
            <q-form @submit.prevent="handleRegister" class="q-gutter-md">

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6 q-pl-none q-pr-sm">
                  <q-input
                    v-model="registerForm.firstName"
                    label="Meno"
                    outlined
                    :rules="firstNameRules"
                  />
                </div>

                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="registerForm.lastName"
                    label="Priezvisko"
                    outlined
                    :rules="lastNameRules"
                  />
                </div>
              </div>

              <q-input
                v-model="registerForm.nickName"
                label="Prezývka (nickName)"
                outlined
                :rules="nickNameRules"
              >
                <template #prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                v-model="registerForm.email"
                type="email"
                label="Email"
                outlined
                :rules="registerEmailRules"
              >
                <template #prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>

              <q-input
                v-model="registerForm.password"
                :type="showPassword ? 'text' : 'password'"
                label="Heslo"
                outlined
                :rules="passwordMinRules"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="togglePassword"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Registrovať"
                color="primary"
                class="full-width"
                size="lg"
                unelevated
              />
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AuthPage',

  data () {
    return {
      tab: 'login',
      showPassword: false,

      loginForm: {
        email: '',
        password: ''
      },

      registerForm: {
        firstName: '',
        lastName: '',
        nickName: '',
        email: '',
        password: ''
      },

      loginEmailRules: [
        (val: string) => !!val || 'Email je povinný',
        (val: string) => /.+@.+\..+/.test(val) || 'Neplatný email'
      ],

      registerEmailRules: [
        (val: string) => !!val || 'Email je povinný',
        (val: string) => /.+@.+\..+/.test(val) || 'Neplatný email'
      ],

      firstNameRules: [
        (val: string) => !!val || 'Meno je povinné'
      ],

      lastNameRules: [
        (val: string) => !!val || 'Priezvisko je povinné'
      ],

      nickNameRules: [
        (val: string) => !!val || 'Prezývka je povinná',
        (val: string) => val.length >= 3 || 'Minimálne 3 znaky',
        (val: string) =>
          /^[a-zA-Z0-9_]+$/.test(val) || 'Len písmená, čísla a _'
      ],

      passwordRequiredRules: [
        (val: string) => !!val || 'Heslo je povinné'
      ],

      passwordMinRules: [
        (val: string) => !!val || 'Heslo je povinné',
        (val: string) => val.length >= 6 || 'Minimálne 6 znakov'
      ]
    }
  },

  computed: {
    isLogin (): boolean {
      return this.tab === 'login'
    }
  },

  methods: {
    togglePassword () {
      this.showPassword = !this.showPassword
    },

    handleLogin () {
      console.log('login payload', this.loginForm)
      this.$router.push('/chat').catch(() => {}) 
    },

    handleRegister () {
      console.log('register payload', this.registerForm)
      this.$router.push('/chat').catch(() => {})
    }
  }
})
</script>
