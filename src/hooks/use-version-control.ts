import { useKV } from '@github/spark/hooks';
import { 
  VersionedEntity, 
  VersionEntry, 
  VersionedEntityType,
  createVersion,
  compareVersions
} from '@/lib/version-control';

export function useVersionControl<T>(
  entityId: string,
  entityType: VersionedEntityType
) {
  const storageKey = `version_${entityType}_${entityId}`;
  const [versionedEntity, setVersionedEntity] = useKV<VersionedEntity<T> | null>(
    storageKey,
    null
  );

  const initializeVersioning = (initialData: T, description: string = 'Initial version') => {
    const firstVersion = createVersion(entityId, entityType, initialData, description);
    
    setVersionedEntity(() => ({
      entity_id: entityId,
      entity_type: entityType,
      current_version: 1,
      versions: [firstVersion]
    }));
  };

  const addVersion = (
    newData: T, 
    changeDescription: string,
    userId?: string,
    userName?: string
  ) => {
    setVersionedEntity((current) => {
      if (!current) {
        const firstVersion = createVersion(entityId, entityType, newData, changeDescription, undefined, userId, userName);
        return {
          entity_id: entityId,
          entity_type: entityType,
          current_version: 1,
          versions: [firstVersion]
        };
      }

      const latestVersion = current.versions[current.versions.length - 1];
      const fieldsChanged = compareVersions(latestVersion.data, newData);
      
      const newVersion: VersionEntry<T> = {
        version: current.current_version + 1,
        timestamp: new Date().toISOString(),
        user_id: userId,
        user_name: userName,
        change_description: changeDescription,
        fields_changed: fieldsChanged,
        data: newData
      };

      return {
        ...current,
        current_version: newVersion.version,
        versions: [...current.versions, newVersion]
      };
    });
  };

  const getVersion = (version: number): VersionEntry<T> | null => {
    if (!versionedEntity) return null;
    return versionedEntity.versions.find(v => v.version === version) || null;
  };

  const getCurrentVersion = (): VersionEntry<T> | null => {
    if (!versionedEntity || versionedEntity.versions.length === 0) return null;
    return versionedEntity.versions[versionedEntity.versions.length - 1];
  };

  const getAllVersions = (): VersionEntry<T>[] => {
    return versionedEntity?.versions || [];
  };

  const revertToVersion = (version: number, revertDescription: string = 'Reverted to previous version') => {
    const targetVersion = getVersion(version);
    if (!targetVersion) return;

    addVersion(targetVersion.data, `${revertDescription} (v${version})`);
  };

  return {
    versionedEntity,
    initializeVersioning,
    addVersion,
    getVersion,
    getCurrentVersion,
    getAllVersions,
    revertToVersion,
    hasVersions: !!versionedEntity && versionedEntity.versions.length > 0
  };
}

export function useAllVersionedEntities(entityType: VersionedEntityType) {
  const [allKeys] = useKV<string[]>('version_control_keys', []);
  
  const getEntitiesOfType = () => {
    return (allKeys || []).filter(key => key.startsWith(`version_${entityType}_`));
  };

  return {
    entityKeys: getEntitiesOfType()
  };
}
