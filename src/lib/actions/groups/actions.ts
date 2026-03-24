"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";
import { Group, GroupDetail, GroupMessage } from "@/lib/definitions";

export async function createGroup(
  name: string,
  memberIds: string[],
  avatarKey: string | null,
) {
  try {
    const response = await apiClient("/groups", {
      method: "POST",
      body: JSON.stringify({ name, memberIds, avatarKey }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to create group" };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error, please try again." };
  }
}

export async function getGroups(): Promise<
  Group[] | { unauthorized: true } | { error: string }
> {
  try {
    const response = await apiClient("/groups", {
      method: "GET",
      next: {
        tags: ["groups"],
      },
    });
    if (!response.ok) {
      if (response.status === 401) return { unauthorized: true };
      return { error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return data.items ?? data;
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function getGroup(
  groupId: string,
): Promise<GroupDetail | { unauthorized: true } | { error: string }> {
  try {
    const response = await apiClient(`/groups/${groupId}`, { method: "GET" });
    if (!response.ok) {
      if (response.status === 401) return { unauthorized: true };
      return { error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function getGroupChat(
  groupId: string,
): Promise<
  | { items: GroupMessage[]; nextCursor: string | null }
  | { unauthorized: true }
  | { errors: { user: string[] } }
> {
  try {
    const response = await apiClient(`/groups/${groupId}/messages?limit=50`, {
      method: "GET",
    });
    if (!response.ok) {
      if (response.status === 401) return { unauthorized: true };
      const data = await response.json().catch(() => ({}));
      return { errors: { user: [data.message || `HTTP ${response.status}`] } };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { errors: { user: ["Network error"] } };
  }
}

export async function sendGroupMessage(
  groupId: string,
  body: string,
  attachmentData?: {
    attachmentKey: string;
    attachmentType: "image" | "video" | "audio" | "file";
    attachmentName?: string;
    attachmentSize?: number;
    attachmentDuration?: number;
  },
) {
  try {
    const payload: Record<string, unknown> = { body };
    if (attachmentData) {
      Object.assign(payload, {
        attachmentKey: attachmentData.attachmentKey,
        attachmentType: attachmentData.attachmentType,
        attachmentName: attachmentData.attachmentName,
        attachmentSize: attachmentData.attachmentSize,
        attachmentDuration: attachmentData.attachmentDuration,
      });
    }
    const response = await apiClient(`/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to send message" };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function editGroupMessage(
  groupId: string,
  messageId: string,
  body: string,
) {
  try {
    const response = await apiClient(
      `/groups/${groupId}/messages/${messageId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ body }),
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to edit message" };
    }
    return await response.json();
  } catch {
    return { error: "Network error" };
  }
}

export async function deleteGroupMessage(groupId: string, messageId: string) {
  try {
    const response = await apiClient(
      `/groups/${groupId}/messages/${messageId}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to delete message" };
    }
    return { success: true };
  } catch {
    return { error: "Network error" };
  }
}

export async function addGroupMessageReaction(
  groupId: string,
  messageId: string,
  emoji: string,
) {
  try {
    const response = await apiClient(
      `/groups/${groupId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        body: JSON.stringify({ emoji }),
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to add reaction" };
    }
    return await response.json();
  } catch {
    return { error: "Network error" };
  }
}

export async function addGroupMembers(groupId: string, memberIds: string[]) {
  try {
    const response = await apiClient(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to add members" };
    }
    return await response.json();
  } catch {
    return { error: "Network error" };
  }
}

export async function removeGroupMember(groupId: string, userId: string) {
  try {
    const response = await apiClient(`/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to remove member" };
    }
    return { success: true };
  } catch {
    return { error: "Network error" };
  }
}

export async function updateGroupName(groupId: string, name: string) {
  try {
    const response = await apiClient(`/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to update group name" };
    }
    return await response.json();
  } catch {
    return { error: "Network error" };
  }
}

export async function deleteGroup(groupId: string) {
  try {
    const response = await apiClient(`/groups/${groupId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to delete group" };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function leaveGroup(groupId: string) {
  try {
    const response = await apiClient(`/groups/${groupId}/leave`, {
      method: "POST",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to leave group" };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}
