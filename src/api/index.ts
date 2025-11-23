import type { Channel, User, AuthResponse } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3333'

function authHeaders(token?: string) {
  const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

type ApiChannel = {
  id: number
  name: string
  is_private?: boolean
  isPrivate?: boolean
  admin_id?: number
  adminId?: number
  created_at?: string
  createdAt?: string
  last_activity_at?: string
  lastActivityAt?: string
  unread_count?: number
  unreadCount?: number
  is_new_invite?: boolean
  isNewInvite?: boolean
  invited_at?: string
  invitedAt?: string
}

type ApiChannelMember = {
  id: number
  channel_id?: number
  channelId?: number
  user_id?: number
  userId?: number
  joined_at?: string
  joinedAt?: string
  role?: string
  is_banned?: boolean
  isBanned?: boolean
  user?: {
    id: number
    first_name?: string
    firstName?: string
    last_name?: string
    lastName?: string
    nick_name?: string
    nickName?: string
    email?: string
    status?: string
    avatar_url?: string
    avatarUrl?: string
  }
}

function normalizeChannel(c: ApiChannel): Channel {
  const result: Channel = {
    id: c.id,
    name: c.name,
    isPrivate: !!(c.isPrivate ?? c.is_private),
    adminId: c.adminId ?? c.admin_id ?? 0,
    createdAt: c.createdAt ?? c.created_at ?? '',
    lastActivityAt: c.lastActivityAt ?? c.last_activity_at ?? '',
    unreadCount: c.unreadCount ?? c.unread_count ?? 0,
    isNewInvite: c.isNewInvite ?? c.is_new_invite ?? false,
  }

  const invitedAt = c.invitedAt ?? c.invited_at
  if (invitedAt !== undefined) {
    result.invitedAt = invitedAt
  }

  return result
}

function normalizeUser(u: ApiChannelMember['user']): User | undefined {
  if (!u) return undefined

  return {
    id: u.id,
    firstName: u.firstName ?? u.first_name ?? '',
    lastName: u.lastName ?? u.last_name ?? '',
    nickName: u.nickName ?? u.nick_name ?? '',
    email: u.email ?? '',
    status: (u.status as 'online' | 'dnd' | 'offline') ?? 'offline',
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? '',
  }
}

export async function getChannels(token?: string): Promise<Channel[]> {
  const res = await fetch(`${API_BASE}/channels`, { headers: authHeaders(token) })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to load channels: ${res.status} ${txt}`)
  }
  const data = (await res.json()) as ApiChannel[]
  return data.map(normalizeChannel)
}

export async function getChannelMembers(channelId: number, token?: string): Promise<User[]> {
  const res = await fetch(`${API_BASE}/channels/${channelId}/members`, {
    headers: authHeaders(token)
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to load members: ${res.status} ${txt}`)
  }
  const data = (await res.json()) as ApiChannelMember[]
  return data.map(m => normalizeUser(m.user)).filter((u): u is User => u !== undefined)
}

export async function getCurrentUser(token?: string): Promise<User> {
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to get current user: ${res.status} ${txt}`)
  }
  return (await res.json()) as User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Login failed: ${res.status} ${txt}`)
  }
  return (await res.json()) as AuthResponse
}

export async function register(payload: { firstName: string; lastName: string; nickName: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Register failed: ${res.status} ${txt}`)
  }
  return await res.json()
}

export async function getInvitations(token?: string): Promise<Channel[]> {
  const res = await fetch(`${API_BASE}/invitations`, { headers: authHeaders(token) })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to load invitations: ${res.status} ${txt}`)
  }
  const data = (await res.json()) as ApiChannel[]
  return data.map(normalizeChannel)
}

export async function acceptInvitation(channelId: number, token?: string): Promise<Channel> {
  const res = await fetch(`${API_BASE}/invitations/${channelId}/accept`, {
    method: 'PUT',
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to accept invitation: ${res.status} ${txt}`)
  }
  const data = await res.json()
  return normalizeChannel(data.channel)
}

export async function rejectInvitation(channelId: number, token?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/invitations/${channelId}/reject`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to reject invitation: ${res.status} ${txt}`)
  }
}

export default {
  getChannels,
  getChannelMembers,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  getCurrentUser,
  login,
  register,
}
