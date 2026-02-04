import { UserState } from '../types/user';
import { SkillProfile } from '../types/skill';
import { RouteComparisonSet } from '../types/route';
import { AnalyticsSnapshot } from '../types/analytics';
import { Task } from '../types/task';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiConfig {
  baseUrl: string;
}

const defaultConfig: ApiConfig = {
  baseUrl: '/api',
};

let activeConfig = defaultConfig;

export function setApiConfig(config: Partial<ApiConfig>) {
  activeConfig = { ...activeConfig, ...config };
}

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const url = `${activeConfig.baseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  getUserState(): Promise<UserState> {
    return request<UserState>('/user/state', 'GET');
  },

  saveUserState(state: UserState): Promise<UserState> {
    return request<UserState>('/user/state', 'PUT', state);
  },

  getSkillProfile(userId: string): Promise<SkillProfile> {
    return request<SkillProfile>(`/users/${userId}/skills`, 'GET');
  },

  generateRoutes(goalId: string): Promise<RouteComparisonSet> {
    return request<RouteComparisonSet>(`/goals/${goalId}/routes`, 'POST', {});
  },

  getAnalytics(goalId: string): Promise<AnalyticsSnapshot> {
    return request<AnalyticsSnapshot>(`/goals/${goalId}/analytics`, 'GET');
  },

  saveTasks(goalId: string, tasks: Task[]): Promise<Task[]> {
    return request<Task[]>(`/goals/${goalId}/tasks`, 'PUT', { tasks });
  },
};
