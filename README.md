# Distributed Logger System

## Overview

This project implements a distributed logging system using JSON-RPC over WebSocket.

The system consists of multiple LogServer instances, a centralized WriterServer, and persistent file-based storage.

The main goal is to provide scalable log ingestion while guaranteeing consistent file writes through a single-writer architecture.

The system supports:

* distributed request processing through multiple LogServer instances
* centralized log persistence
* log validation
* log retrieval
* log searching
* automatic log rotation
* reading and searching across archived log files
* containerized deployment using Docker
* load balancing using Nginx

---

## Quick Start

### Prerequisites

The following software must be installed:

- Docker
- Docker Compose

### Build and Start

```bash
docker compose up --build
```

After startup, the public WebSocket endpoint will be available at:

```text
ws://localhost:8080
```

### Stop Services

```bash
docker compose down
```

### Stop Services and Remove Volumes

```bash
docker compose down -v
```

---

## Architecture

```text
External Client
      │
      ▼
    Nginx
      │
      ├─────► LogServer-1 ─► WriterClient ─┐
      ├─────► LogServer-2 ─► WriterClient ─┤
      └─────► LogServer-3 ─► WriterClient ─┘
                                           │
                                           ▼
                                      WriterServer
                                           │
                                           ▼
                                       LogStorage
                                           │
                                           ▼
                                        Winston
                                           │
                                           ▼
                                        Log Files
```

---

## Communication Protocol

The system uses JSON-RPC 2.0 over WebSocket.

All external communication is performed through a single WebSocket endpoint exposed by Nginx.

Public endpoint:

```text
ws://localhost:8080
```

---

## Request Models

### logMessage Method

Creates a new log entry in the distributed logging system.

The request is validated by LogServer. If validation succeeds, the server adds a `receivedTimestamp` and forwards the log to WriterServer for persistence.

#### Method

```typescript
client.call("logMessage", params);
```

#### Parameters

```typescript
type LogMessageRequest = {
  eventTimestamp: number;
  message: string;
  level: LogLevel;
};

type LogLevel =
    | "error"
    | "warn"
    | "info"
    | "http"
    | "verbose"
    | "debug"
    | "silly";
```

#### Example Request

```json
{
    "eventTimestamp": 1710000000000,
    "message": "Application started",
    "level": "info"
}
```

#### Notes

External clients must not provide the `receivedTimestamp` field. It is generated automatically by LogServer.

#### Example Responses

##### Success Response

```json
{
    "success": true,
    "data": {
        "eventTimestamp": 1710000000000,
        "receivedTimestamp": 1710000001000,
        "message": "Application started",
        "level": "info"
    }
}
```

##### Error Response

```json
{
    "success": false,
    "error": {
        "code": "INVALID_MESSAGE",
        "message": "<error description>"
    }
}
```

---

### getLogs Method

Returns all stored logs from active and archived log files as a single aggregated collection.

Logs are returned sorted by `receivedTimestamp` in ascending order (oldest first).

#### Method

```typescript
client.call("getLogs");
```

#### Parameters

This method does not require any parameters.

#### Example Responses

##### Success Response

```json
{
    "success": true,
    "data": [
        {
            "eventTimestamp": 1710000000000,
            "receivedTimestamp": 1710000001000,
            "message": "Application started",
            "level": "info"
        },
        {
            "eventTimestamp": 1709999999000,
            "receivedTimestamp": 1710000000000,
            "message": "Database connected",
            "level": "info"
        }
    ]
}
```

##### Error Response

```json
{
    "success": false,
    "error": {
        "code": "READ_LOGS_FAILED",
        "message": "<error description>"
    }
}
```

### searchLogs Method

Searches stored logs from both active and archived log files using one or more filter criteria.

All specified filters are combined using logical **AND**. Only logs matching all provided conditions are returned.

#### Method

```typescript
client.call("searchLogs", params);
```

#### Parameters

```typescript
type LogSearchQuery = {
    level?: LogLevel;
    message?: string;
    from?: number;
    to?: number;
};
```

#### Parameter Description

| Parameter | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `level`   | Returns only logs with the specified log level                            |
| `message` | Case-insensitive substring search within the log message                  |
| `from`    | Returns logs with `receivedTimestamp` greater than or equal to this value |
| `to`      | Returns logs with `receivedTimestamp` less than or equal to this value    |

#### Example Request

```json
{
    "level": "error",
    "message": "database",
    "from": 1710000000000,
    "to": 1710009999999
}
```

#### Notes

* All filters are optional.
* If multiple filters are specified, they are combined using logical **AND**.
* The search is performed against logs from both active and archived log files.
* Message matching is case-insensitive.

#### Example Responses

##### Success Response

```json
{
    "success": true,
    "data": [
        {
            "eventTimestamp": 1710000000000,
            "receivedTimestamp": 1710000001000,
            "message": "database",
            "level": "error"
        }
    ]
}
```

##### Error Response

```json
{
    "success": false,
    "error": {
        "code": "SEARCH_LOGS_FAILED",
        "message": "<error description>"
    }
}
```

---

## Components

### Nginx

`Nginx` is the public entry point of the system.

It accepts external WebSocket connections and forwards JSON-RPC traffic to one of the available LogServer instances.

Responsibilities:

* expose a single public endpoint for external clients
* proxy WebSocket connections to LogServer instances
* distribute incoming traffic between multiple LogServer containers
* keep LogServer instances hidden from external clients

In Docker, `Nginx` listens on container port `80` and is exposed on host port `8080`.

Public endpoint:

```text
ws://localhost:8080
```

---

### LogServer

`LogServer` exposes the public JSON-RPC API of the system.

All external requests are received and processed by one of the available LogServer instances behind Nginx.

Responsibilities:

* receive external JSON-RPC requests
* validate incoming request parameters
* generate `receivedTimestamp` for accepted log entries
* delegate storage operations to WriterServer through WriterClient
* return unified application responses to clients

Public methods:

```text
logMessage
getLogs
searchLogs
```

#### Notes
`LogServer` does not interact with log files directly.
All persistence operations are delegated to WriterServer.

---

### WriterClient

`WriterClient` acts as an internal communication layer between LogServer and WriterServer.

It encapsulates JSON-RPC communication and provides a simple interface for interacting with WriterServer.

Responsibilities:

* send internal JSON-RPC requests to WriterServer
* hide communication details from LogServer
* handle transport and connection errors
* convert communication failures into unified application responses

Available operations:
```text
writeLog
readLogs
searchStoredLogs
```

#### Notes
`WriterClient` does not perform validation, persistence, or business logic.

Its sole responsibility is to facilitate communication between LogServer and WriterServer.

---

### WriterServer

`WriterServer` exposes the internal JSON-RPC API used by LogServer instances.

It centralizes all storage-related operations and ensures that log files are accessed through a single process.

Responsibilities:

* receive internal requests from WriterClient
* delegate persistence operations to LogStorage
* return unified application responses
* provide a single access point to log storage
* guarantee serialized write operations

Available methods:

```text
writeLog
readLogs
searchStoredLogs
```

#### Notes
`WriterServer` does not interact with log files directly.

All file operations are delegated to LogStorage.

The primary purpose of `WriterServer` is to centralize storage access and prevent concurrent writes from multiple LogServer instances.

---

### LogStorage

`LogStorage` is responsible for all file-system operations related to log persistence.

It serves as the storage layer of the application and provides a simple interface for writing, reading, and searching logs.

Responsibilities:

* write log entries to persistent storage
* read logs from active and archived log files
* search logs using specified filter criteria
* aggregate logs from multiple log files
* maintain chronological ordering of returned logs
* handle storage-related errors

Available operations:

```text
writeLog
readLogs
searchLogs
```

#### Notes

`LogStorage` does not perform request validation or communication handling.

Its sole responsibility is managing log persistence and retrieval.

`LogStorage` reads data from both active and archived log files, ensuring that log retrieval and search operations operate on the complete log history.

#### Log File Format

Logs are stored as newline-delimited JSON (NDJSON).

##### Example

```json
{"level":"info","message":"Application started","eventTimestamp":1710000000000,"receivedTimestamp":1710000001000}
{"level":"error","message":"Database connection failed","eventTimestamp":1710000002000,"receivedTimestamp":1710000003000}
```

#### Log Rotation

Log rotation is performed automatically by Winston when the configured file size limit is reached.

##### Example:

```text
app.log
app1.log
app2.log
```

The active log file is always stored in `app.log`.

Archived log files remain available for reading and searching.

Both `getLogs` and `searchLogs` operate on the complete log history, including archived log files.

---

## Docker Setup

### Services

| Service | Description |
|----------|-------------|
| nginx | Public entry point and load balancer |
| log-server-1 | LogServer instance |
| log-server-2 | LogServer instance |
| log-server-3 | LogServer instance |
| writer-server | Centralized storage coordinator |

### Persistent Storage

```text
logs-data:/app/logs
```

### Configuration

The application can be configured using environment variables.

#### LogServer

| Variable | Description | Default |
|-----------|-------------|----------|
| LOG_SERVER_HOST | LogServer host | 0.0.0.0 |
| LOG_SERVER_PORT | LogServer port | 8080 |

#### WriterServer

| Variable | Description | Default |
|-----------|-------------|----------|
| WRITER_SERVER_HOST | WriterServer host | 0.0.0.0 |
| WRITER_SERVER_PORT | WriterServer port | 8090 |
| WRITER_SERVER_URL | Internal WriterServer URL | ws://writer-server:8090 |

The value of WRITER_SERVER_URL depends on the deployment environment.

For Docker deployments: `ws://writer-server:8090`

For local development: `ws://localhost:8090`

#### LogStorage

| Variable | Description | Example |
|-----------|-------------|----------|
| LOG_FILE_PATH | Path to the active log file | /app/logs/app.log |
| LOG_MAX_SIZE | Maximum log file size in bytes before rotation | 1048576 |

---

## Tested Scenarios

The following scenarios were verified:

* log creation
* log retrieval
* log search
* log validation
* log rotation
* logServer failure
* multiple LogServer failures
* writerServer failure
* docker volume persistence
* nginx load balancing