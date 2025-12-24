export type VersionedEntityType = 'order' | 'customer' | 'artwork';

export interface VersionMetadata {
  version: number;
  timestamp: string;
  user_id?: string;
  user_name?: string;
  change_description: string;
  fields_changed?: string[];
}

export interface VersionedEntity<T> {
  entity_id: string;
  entity_type: VersionedEntityType;
  current_version: number;
  versions: VersionEntry<T>[];
}

export interface VersionEntry<T> {
  version: number;
  timestamp: string;
  user_id?: string;
  user_name?: string;
  change_description: string;
  fields_changed?: string[];
  data: T;
}

export interface ArtworkVersion {
  id: string;
  imprint_id: string;
  file_url: string;
  filename: string;
  file_size: number;
  approved: boolean;
  uploaded_at: string;
  notes: string;
}

export interface OrderVersion {
  id: string;
  visual_id: string;
  customer_id: string;
  customer_name: string;
  status: string;
  line_items: any[];
  subtotal: number;
  tax: number;
  total: number;
  due_date: string;
  production_notes: string;
  nickname?: string;
}

export interface CustomerVersion {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  tier: string;
}

export function createVersion<T>(
  entityId: string,
  entityType: VersionedEntityType,
  data: T,
  changeDescription: string,
  fieldsChanged?: string[],
  userId?: string,
  userName?: string
): VersionEntry<T> {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    user_id: userId,
    user_name: userName,
    change_description: changeDescription,
    fields_changed: fieldsChanged,
    data
  };
}

export function compareVersions<T>(oldVersion: T, newVersion: T): string[] {
  const changedFields: string[] = [];
  const oldObj = oldVersion as Record<string, any>;
  const newObj = newVersion as Record<string, any>;

  for (const key in newObj) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

export function formatVersionTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getVersionDiff<T>(v1: VersionEntry<T>, v2: VersionEntry<T>): string[] {
  return compareVersions(v1.data, v2.data);
}
