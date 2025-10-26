import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/chat' },
  {
    path: '/chat',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/ChatPage.vue')
      }
    ]
  },
  {
    path: '/settings',
    component: () => import('layouts/SettingsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/SettingsPage.vue')
      }
    ]
  },
  {
  path: '/auth',
  component: () => import('layouts/AuthLayout.vue'),
  children: [
    {
      path: '',
      name: 'auth',
      component: () => import('pages/AuthPage.vue')
    }
  ]
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') }
]

export default routes
