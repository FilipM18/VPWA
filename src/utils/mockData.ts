// Mock data for ChatFlow application
// AI generated data only for presentation purposes. Will be removed once real backend is implemented.

import type { User, Channel } from '../types'

export const mockUsers: User[] = [
  {
    id: 1,
    firstName: 'Ján',
    lastName: 'Novák',
    nickName: 'janko_novak',
    email: 'jan.novak@example.com',
    status: 'online',
    avatarUrl: ''
  },
  {
    id: 2,
    firstName: 'Mária',
    lastName: 'Kováčová',
    nickName: 'maria_kovacova',
    email: 'maria.kovacova@example.com',
    status: 'online',
    avatarUrl: ''
  },
  {
    id: 3,
    firstName: 'Peter',
    lastName: 'Horváth',
    nickName: 'peter_horvath',
    email: 'peter.horvath@example.com',
    status: 'dnd',
    avatarUrl: ''
  },
  {
    id: 4,
    firstName: 'Lukáš',
    lastName: 'Varga',
    nickName: 'lukas_varga',
    email: 'lukas.varga@example.com',
    status: 'online',
    avatarUrl: ''
  },
  {
    id: 5,
    firstName: 'Eva',
    lastName: 'Málínková',
    nickName: 'eva_malinkova',
    email: 'eva.malinkova@example.com',
    status: 'offline',
    avatarUrl: ''
  }
]

export const mockChannels: Channel[] = [
  {
    id: 1,
    name: 'general',
    isPrivate: false,
    adminId: 1,
    createdAt: new Date('2025-10-20T10:00:00.000Z'),
    lastActivityAt: new Date('2025-10-21T16:02:15.000Z'),
    unreadCount: 0,
    isNewInvite: false
  },
  {
    id: 2,
    name: 'random',
    isPrivate: false,
    adminId: 1,
    createdAt: new Date('2025-10-20T10:05:00.000Z'),
    lastActivityAt: new Date('2025-10-20T15:30:00.000Z'),
    unreadCount: 3,
    isNewInvite: false
  },
  {
    id: 3,
    name: 'project-alpha',
    isPrivate: true,
    adminId: 1,
    createdAt: new Date('2025-10-20T11:00:00.000Z'),
    lastActivityAt: new Date('2025-10-21T14:20:00.000Z'),
    unreadCount: 0,
    isNewInvite: false
  },
  {
    id: 4,
    name: 'dev-team',
    isPrivate: true,
    adminId: 2,
    createdAt: new Date('2025-10-20T12:00:00.000Z'),
    lastActivityAt: new Date('2025-10-21T09:00:00.000Z'),
    unreadCount: 5,
    isNewInvite: false
  },
{
    id: 5,
    name: 'design-review',
    isPrivate: true,
    adminId: 2,
    createdAt: new Date('2025-10-20T12:00:00.000Z'),
    lastActivityAt: new Date('2025-10-21T09:00:00.000Z'),
    isNewInvite: true,
    invitedAt: new Date('2025-10-23T12:00:00.000Z').toISOString()
  },
  {
    id: 6,
    name: 'skusobny-novsi-invite',
    isPrivate: true,
    adminId: 2,
    createdAt: new Date('2025-10-20T12:00:00.000Z'),
    lastActivityAt: new Date('2025-10-21T09:00:00.000Z'),
    isNewInvite: true,
    invitedAt: new Date('2025-10-24T12:00:00.000Z').toISOString()
  },

]
