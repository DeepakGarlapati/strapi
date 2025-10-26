# 📋 Strapi Audit Log Plugin

## Overview
A robust audit logging system for Strapi that automatically tracks and records all content changes through the Content API. This plugin provides comprehensive tracking of who did what and when, with detailed metadata and secure access controls.

### Core Features
- 🔄 Automatic logging of all content operations (create, update, delete)
- 📊 Detailed metadata capture (user, content type, timestamps, changes)
- 🔍 Powerful filtering and search capabilities
- 🔐 Built-in role-based access control
- ⚙️ Flexible configuration options

---

## 🎯 Key Features

### Automatic Content Tracking
- Captures all content API operations (create, update, delete)
- Records full change history with timestamps
- Maintains user attribution for all changes
- Stores complete change payloads for auditing

### Powerful Query API
- Filter by multiple criteria:
  - Content type
  - User ID
  - Action type
  - Date range
- Built-in pagination and sorting
- Efficient database querying

### Security & Access Control
- Role-based access control
- Permission-based endpoint protection
- Configurable content type exclusions

### Flexible Configuration
```typescript
// config/plugins.ts
export default {
  'audit-log': {
    enabled: true,
    config: {
      excludeContentTypes: [
        'plugin::users-permissions.user',
        'admin::user'
      ]
    }
  }
};
```

## 🚀 Quick Start

1. **Install the Plugin**
   ```bash
   npm install strapi-plugin-audit-log
   # or
   yarn add strapi-plugin-audit-log
   ```

2. **Enable and Configure**
   ```typescript
   // config/plugins.ts
   export default {
     'audit-log': {
       enabled: true,
       config: {
         excludeContentTypes: [] // optional
       }
     }
   };
   ```

3. **Add Permissions**
   - Navigate to Settings → Roles
   - Select the appropriate role
   - Enable the "Read Audit Logs" permission
   - Save changes

4. **Restart Strapi**
   ```bash
   npm run develop
   ```


## 📖 API Reference

### Query Audit Logs

```http
GET /audit-logs
```

#### Query Parameters

| Parameter   | Type     | Description                    |
|------------|----------|--------------------------------|
| page       | number   | Page number (default: 1)       |
| pageSize   | number   | Items per page (default: 10)   |
| contentType| string   | Filter by content type         |
| user       | number   | Filter by user ID             |
| action     | string   | Filter by action type         |
| startDate  | string   | Start date (ISO format)       |
| endDate    | string   | End date (ISO format)         |

#### Example Response

```json
{
  "entries": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "123",
      "action": "update",
      "user": 1,
      "timestamp": "2025-10-26T14:30:00Z",
      "payload": {
        "title": "Updated Title",
        "content": "New content..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "pageCount": 5,
    "total": 50
  }
}


---

## ⚙️ Configuration

### Plugin Options

```typescript
interface AuditLogConfig {
  enabled: boolean;
  excludeContentTypes?: string[];
}
```

| Option             | Type       | Default | Description                    |
|-------------------|------------|---------|--------------------------------|
| enabled           | boolean    | true    | Enable/disable the plugin      |
| excludeContentTypes| string[]  | []      | Content types to exclude       |

### Example Configuration

```typescript
// config/plugins.ts
export default {
  'audit-log': {
    enabled: true,
    config: {
      excludeContentTypes: [
        'plugin::users-permissions.user',
        'admin::user'
      ]
    }
  }
};

```

---

## 🏗️ Technical Details

### Data Model

The plugin creates an `audit_logs` collection with the following schema:

```typescript
interface AuditLog {
  id: number;
  contentType: string;      // e.g., "api::article.article"
  recordId: string;         // ID of the affected record
  action: "create" | "update" | "delete";
  user?: number;           // ID of the user who made the change
  timestamp: Date;         // When the change occurred
  payload: {              // Complete state after change
    [key: string]: any;
  };
}
```

### Integration Points

1. **Database Lifecycle Hooks**
   - Subscribes to Strapi's database events
   - Captures all content changes automatically
   - Maintains consistency with database transactions

2. **Permission System**
   - Integrates with Strapi's RBAC
   - Enforces access control at the route level
   - Configurable through admin UI

3. **Query Layer**
   - Efficient filtering and pagination
   - Proper index usage
   - Consistent with Strapi's query format
```

### 2. Lifecycle Hook (Bootstrap)

`index.ts` attaches to Strapi’s event bus:

```
import { Core } from '@strapi/strapi';
import _default from '../server/config/default.js';

const CONFIG_KEY = 'plugin.audit-log';
const config = strapi.config.get(CONFIG_KEY, _default);


export default async ({ strapi }: { strapi: Core.Strapi }) => {

  if (!config.auditLog.enabled) {
    strapi.log.info('Audit logging disabled via configuration.');
    return;
  }

  strapi.log.info('Audit logging initialized.');

  // Hook into Strapi content events
  strapi.db.lifecycles.subscribe({
    async afterCreate(event) {
      await createAuditLog(strapi, event, 'create');
    },
    async afterUpdate(event) {
      await createAuditLog(strapi, event, 'update');
    },
    async afterDelete(event) {
      await createAuditLog(strapi, event, 'delete');
    },
  });
};

// helper
async function createAuditLog(
  strapi: Core.Strapi,
  event: any,
  action: 'create' | 'update' | 'delete'
) {


  const { model, result, params } = event;
  if (config.auditLog.excludeContentTypes?.includes(model.uid)) return;

  const user = params?.user ?? null;

  await strapi.db.query('plugin::audit-log.audit-log').create({
    data: {
      contentType: model.uid,
      recordId: result.id,
      action,
      user: user?.id || null,
      timestamp: new Date(),
      payload: JSON.stringify(result),
    },
  });
}

```
## 🔐 Security Considerations

### Access Control
- Role-based access control through Strapi's permission system
- Endpoint protected by `read_audit_logs` permission
- User authentication required for all operations

### Data Protection
- Sensitive content types can be excluded
- User relations are properly sanitized
- Payload data is JSON-encoded for safety

### Best Practices
1. Regularly review audit logs
2. Set up appropriate retention policies
3. Monitor storage usage
4. Configure excluded content types

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Find audit logs with filters and pagination
   */
  async findWithFilters(query: AuditLogQuery) {
    const {
      page = 1,
      pageSize = 10,
      contentType,
      user,
      action,
      startDate,
      endDate,
    } = query;

    const filters: any = {};
    if (contentType) filters.contentType = contentType;
    if (user) filters.user = user;
    if (action) filters.action = action;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      strapi.db.query('plugin::audit-log.audit-log').findMany({
        where: filters,
        orderBy: { timestamp: 'DESC' },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      strapi.db.query('plugin::audit-log.audit-log').count({ where: filters }),
    ]);

    return {
      entries,
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    };
  },

  /**
   * Create a new audit log entry for a content change
   */
  async createLog(params: {
    contentType: string;
    recordId: string | number;
    action: 'create' | 'update' | 'delete';
    userId?: number;
    diff?: Record<string, any>;
  }) {
    const { contentType, recordId, action, userId, diff } = params;
    const config = strapi.config.get(CONFIG_KEY, _default);

    // Skip logging if disabled or excluded
    if (!config.auditLog.enabled) return;
    if (config.auditLog.excludeContentTypes?.includes(contentType)) return;

    const entry: AuditLogEntry = {
      contentType,
      recordId: recordId.toString(),
      action,
      timestamp: new Date(),
      diff: diff || {},
    };

    if (userId) {
      entry.user = userId;
    }

    try {
      await strapi.db.query('plugin::audit-log.audit-log').create({
        data: entry,
      });
    } catch (error) {
      strapi.log.error('Failed to create audit log:', error);
    }
  },
});

```

### 4. Controller

```
import { Core } from '@strapi/strapi';
import { Context } from 'koa';
import { AuditLogQuery } from '../types/audit-log';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: Context) {
    const query = ctx.request.query as unknown as AuditLogQuery;

    const data = await strapi
      .plugin('audit-log')
      .service('audit-log')
      .findWithFilters(query);

    ctx.body = data;
  },
});
```

### 5. Access Control Middleware

`can-read-audit-logs.ts` add role-based access control:

```
import { Core } from '@strapi/strapi';
import { Context, Next } from 'koa';

export default async (ctx: Context, next: Next) => {
  const user = ctx.state.user;
  if (!user) {
    return ctx.unauthorized('You must be logged in.');
  }

  // permission check for read_audit_logs
  const hasPermission = await strapi
    .plugin('users-permissions')
    .service('user')
    .hasPermission(user.id, 'read_audit_logs');

  if (!hasPermission) {
    return ctx.forbidden('You are not allowed to read audit logs.');
  }

  await next();
};

```

## 🧮 Query Examples

### Get All Audit Logs
```http
GET /audit-logs?page=1&pageSize=10
```
### Filter by User
```http
GET /audit-logs?startDate=2025-10-01&endDate=2025-10-26
```

## 🧰 Configuration Options

| Key | Type | Description |
|-----|------|-------------|
| `auditLog.enabled` | `boolean` | Enables or disables logging globally |
| `auditLog.excludeContentTypes` | `string[]` | Content types to exclude from logging |

## 🔐 Access Control

Only users with the read_audit_logs permission can query /audit-logs.
All other users will receive a 403 Forbidden response.
