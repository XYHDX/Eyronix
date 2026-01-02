export type Role = 'admin' | 'user';

export const ROLES = {
    ADMIN: 'admin' as Role,
    USER: 'user' as Role,
};

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
    // Public-ish / Shared
    '/dashboard': ['admin'],
    '/dashboard/profile': ['admin', 'user'],

    // Admin Only
    '/dashboard/users': ['admin'],
    '/dashboard/pricing': ['admin'],
    '/dashboard/requests': ['admin'],
    '/dashboard/services': ['admin'],
    '/dashboard/products': ['admin'],
    '/dashboard/settings': ['admin'], // Assuming settings is admin only for now

    // User & Admin
    '/dashboard/my-orders': ['admin', 'user'],
    '/dashboard/orders': ['admin'], // All orders for admin
};

export function hasPermission(role: Role | undefined, path: string): boolean {
    if (!role) return false;

    // 1. Exact match
    if (ROUTE_PERMISSIONS[path]) {
        return ROUTE_PERMISSIONS[path].includes(role);
    }

    // 2. Parent path match (e.g. /dashboard/users/123 -> matches /dashboard/users)
    // We sort by length descending to match the most specific path first
    const definedPaths = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);

    for (const definedPath of definedPaths) {
        if (path.startsWith(definedPath)) {
            // distinct check: ensure we aren't matching /dashboard/users to /dashboard if /dashboard/users is defined
            // actually the sort handles specificity, but we must verify the segment boundary
            // e.g. /dashboard/users-extra shouldn't match /dashboard/users
            if (path === definedPath || path.startsWith(`${definedPath}/`)) {
                return ROUTE_PERMISSIONS[definedPath].includes(role);
            }
        }
    }

    // Default: if path starts with /dashboard and isn't caught above, assume safe? 
    // OR assume restricted? 
    // Let's assume restricted if not explicitly allowed, unless it's just the root /dashboard which we handled.
    // Actually, for safety, let's default to allowing access only if explicitly defined or if it's a sub-path of an allowable parent.

    return false;
}
