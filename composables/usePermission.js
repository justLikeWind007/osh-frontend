/**
 * 权限判断 composable
 * 从 usePermissions() 读取权限列表（登录时单独存储，不受 getinfo 覆盖影响）
 */
export function usePermission() {
  const permissions = usePermissions();

  const permissionList = computed(() => normalizePermissions(permissions.value));

  function hasPermission(code) {
    if (!code) return true;
    const perms = permissionList.value;
    if (!perms.length) return false;
    if (perms.includes('*') || perms.includes('*:*:*')) return true;
    return perms.includes(code);
  }

  function hasAnyPermission(...codes) {
    return codes.some(c => hasPermission(c));
  }

  return { hasPermission, hasAnyPermission, permissionList };
}

function normalizePermissions(rawPermissions) {
  const result = new Set();

  collectPermissions(rawPermissions, result);

  return [...result];
}

function collectPermissions(value, bucket) {
  if (!value) return;

  if (typeof value === 'string') {
    bucket.add(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPermissions(item, bucket));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      // 兼容后端返回的对象型权限：
      // 1. `course: ['course:create']` 这类分组对象，只递归子节点
      // 2. `system:feedback:manage: []` 这类以权限码作为 key 的对象，需要把 key 本身也纳入权限集合
      if (key.includes(':')) {
        bucket.add(key);
      }
      collectPermissions(child, bucket);
    });
  }
}
