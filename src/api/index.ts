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

type ApiMessage = {
  id: number
  channel_id?: number
  channelId?: number
  user_id?: number
  userId?: number
  author_id?: number
  authorId?: number
  content: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  deleted_at?: string | null
  deletedAt?: string | null
  mentioned_user_ids?: number[]
  mentionedUserIds?: number[]
  user?: {
    id: number
    first_name?: string
    firstName?: string
    last_name?: string
    lastName?: string
    nick_name?: string
    nickName?: string
    status?: string
    avatar_url?: string
    avatarUrl?: string
  }
  author?: {
    id: number
    first_name?: string
    firstName?: string
    last_name?: string
    lastName?: string
    nick_name?: string
    nickName?: string
    status?: string
    avatar_url?: string
    avatarUrl?: string
  }
}

type MessagesResponse = {
  data: ApiMessage[]
  meta: {
    hasMore: boolean
    oldestMessageId: number | null
    count: number
  }
}

import type { ChatMessage } from '../types'

function normalizeMessage(m: ApiMessage): ChatMessage {
  const userOrAuthor = m.author ?? m.user
  return {
    id: m.id,
    channelId: m.channelId ?? m.channel_id ?? 0,
    authorId: m.authorId ?? m.author_id ?? m.userId ?? m.user_id ?? 0,
    author: userOrAuthor?.nickName ?? userOrAuthor?.nick_name ?? 'Unknown',
    content: m.content,
    timestamp: new Date(m.createdAt ?? m.created_at ?? Date.now()),
    mentionedUserIds: m.mentionedUserIds ?? m.mentioned_user_ids ?? [],
  }
}

export async function logout(token?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok && res.status !== 401) {
    throw new Error('Logout failed')
  }
}

export async function joinChannel(
  channelName: string,
  isPrivate: boolean,
  token?: string
): Promise<{ channel: Channel }> {
  const res = await fetch(`${API_BASE}/channels/join`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ channelName, isPrivate }),
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to join channel')
  }

  const data = await res.json()
  return { channel: normalizeChannel(data.channel) }
}

export async function inviteToChannel(
  channelId: number,
  nickNameOrUserId: string | number,
  token?: string
): Promise<void> {
  const body = typeof nickNameOrUserId === 'string'
    ? { nickName: nickNameOrUserId }
    : { userId: nickNameOrUserId }

  const res = await fetch(`${API_BASE}/channels/${channelId}/invite`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to invite user')
  }
}

export async function leaveChannel(
  channelId: number,
  userId?: number,
  deleteChannel?: boolean,
  token?: string
): Promise<void> {
  const body: { userId?: number; deleteChannel?: boolean } = {}
  if (userId !== undefined) body.userId = userId
  if (deleteChannel !== undefined) body.deleteChannel = deleteChannel

  const res = await fetch(`${API_BASE}/channels/${channelId}/leave`, {
    method: 'DELETE',
    headers: authHeaders(token),
    ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) }),
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to leave channel')
  }
}

export async function getMessages(
  channelId: number,
  token?: string,
  before?: number,
  limit: number = 50
): Promise<{ messages: ChatMessage[]; hasMore: boolean; oldestMessageId: number | null }> {
  const params = new URLSearchParams()
  params.append('limit', limit.toString())
  if (before) {
    params.append('before', before.toString())
  }

  const res = await fetch(`${API_BASE}/channels/${channelId}/messages?${params.toString()}`, {
    headers: authHeaders(token)
  })

  if (res.status === 401) throw new Error('Unauthorized')
  if (res.status === 403) throw new Error('Forbidden: You must be a member of this channel')
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to load messages: ${res.status} ${txt}`)
  }

  const response = (await res.json()) as MessagesResponse
  return {
    messages: response.data.map(normalizeMessage),
    hasMore: response.meta.hasMore,
    oldestMessageId: response.meta.oldestMessageId,
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
  logout,
  getMessages,
  joinChannel,
  inviteToChannel,
  leaveChannel,
}
