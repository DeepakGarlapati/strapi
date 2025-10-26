# Strapi Audit Log - Technical Design Document

## 1. System Overview

### 1.1 Purpose
Design and implement a comprehensive audit logging system for Strapi that:
- Automatically captures all content changes
- Provides secure, queryable access to audit data
- Maintains high performance at scale
- Integrates seamlessly with existing Strapi architecture

### 1.2 Design Goals
- Minimal performance overhead
- Real-time logging capability
- Flexible query interface
- Secure access control
- Easy maintenance and extensibility

## 2. Architecture Design

### 2.1 Core Components

#### Event Capture Layer
- Utilizes Strapi lifecycle hooks for direct database event monitoring
- Synchronous operation ensures data consistency
- Minimal overhead and reliable capture of all changes

#### Data Storage Layer
- Dedicated `audit_logs` collection
- Optimized schema and indexing
- Efficient JSON payload storage

#### API Layer
- RESTful endpoints for querying
- Flexible filtering system
- Pagination and sorting support

### 2.2 Integration Strategy

We chose Strapi lifecycle hooks over alternatives like Event Hub for several reasons:
1. **Direct Database Integration**
   - Immediate access to database transactions
   - No additional infrastructure required
   - Guaranteed consistency with database state

2. **Performance Considerations**
   - Minimal overhead per operation
   - No external service dependencies
   - Synchronous logging capability

3. **Maintainability**
   - Simple deployment model
   - Clear debugging path
   - Easy upgrades

### 2.3 Service Architecture
The plugin uses a centralized service architecture:

1. **Core Service (`audit-log.ts`)**
   - Handles all logging operations
   - Manages filtering and pagination
   - Provides unified API for other plugins

2. **Controller Layer**
   - REST endpoint implementations
   - Request validation
   - Response formatting

3. **Policy Layer**
   - Access control enforcement
   - Permission checking
   - Request filtering

## 3. Technical Implementation

### 3.1 Data Model
```typescript
interface AuditLog {
  id: number;
  contentType: string;      // Index for filtering
  recordId: string;         // Index for lookups
  action: "create" | "update" | "delete";
  user?: number;           // Foreign key to users
  timestamp: Date;         // Index for time-based queries
  payload: {              // JSON field for flexibility
    [key: string]: any;
  };
}
```

### 3.2 Database Optimization
1. **Indexes**
   - Primary: `id`
   - Compound: `(contentType, timestamp)`
   - Single: `user`, `action`
   
2. **Query Patterns**
   - Filter by content type (frequent)
   - Filter by date range (frequent)
   - Filter by user (occasional)
   - Full text search (rare)

### 3.3 Security Implementation
1. **Access Control**
   - Role-based permissions
   - Endpoint-level auth
   - Data sanitization

2. **Configuration**
   ```typescript
   interface Config {
     enabled: boolean;
     excludeContentTypes: string[];
   }
   ```

---

## 🧠 Trade-offs and Reasoning

| Decision | Trade-off |
|-----------|------------|
| Store diffs as JSON | Simpler to implement; may grow storage over time |
| Use lifecycle hooks | Minimal intrusion but slightly harder to trace in debugging |
| REST endpoint only | Simpler to evaluate; GraphQL could be added later |
| One-to-one user relation | Keeps queries efficient; avoids denormalization |

---

## 🧩 Extensibility
- Could easily emit events to message queues (e.g., Kafka, AWS SNS)
- Ready for future admin dashboard UI for audit review
- Schema can evolve with additional metadata (e.g., IP, User-Agent)

---

## ✅ Summary
This design ensures:
- **Seamless integration** into Strapi
- **Configurable and secure** audit data collection
- **Scalable structure** for future reporting and analytics

By centralizing logic in a dedicated plugin and leveraging Strapi’s event hooks, the system remains robust, modular, and easy to maintain.