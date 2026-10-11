# QuickNotes API Design

## Conventions

The production API is rooted at `/v1`. It uses JSON request and response bodies, HTTPS, and bearer-token authentication for user-owned resources. IDs are opaque positive integers in these examples. Timestamps are UTC ISO 8601 strings.

## Endpoints

| Method   | Path                              | Description                                                                     | Success status   |
| -------- | --------------------------------- | ------------------------------------------------------------------------------- | ---------------- |
| `POST`   | `/v1/auth/register`               | Create an account.                                                              | `201 Created`    |
| `POST`   | `/v1/auth/login`                  | Authenticate and issue access and refresh tokens.                               | `200 OK`         |
| `GET`    | `/v1/notes`                       | List the authenticated user's notes; supports `limit`, `cursor`, `tag` and `q`. | `200 OK`         |
| `POST`   | `/v1/notes`                       | Create a note for the authenticated user.                                       | `201 Created`    |
| `GET`    | `/v1/notes/{noteId}`              | Fetch one note owned by the authenticated user.                                 | `200 OK`         |
| `PATCH`  | `/v1/notes/{noteId}`              | Update supplied fields on a note.                                               | `200 OK`         |
| `DELETE` | `/v1/notes/{noteId}`              | Delete a note and its tag associations.                                         | `204 No Content` |
| `PUT`    | `/v1/notes/{noteId}/tags/{tagId}` | Associate an existing tag with a note.                                          | `204 No Content` |
| `DELETE` | `/v1/notes/{noteId}/tags/{tagId}` | Remove a tag association.                                                       | `204 No Content` |

All note and tag operations are scoped to the authenticated user. The API returns `404 Not Found` for a resource that does not exist or is not visible to that user, avoiding disclosure of another user's IDs. List results use cursor pagination and a maximum page size of 100.

## Create a note

Request: `POST /v1/notes`

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Project outline",
  "body": "Capture the first milestones.",
  "tagIds": [12, 18]
}
```

Response: `201 Created`

```json
{
  "data": {
    "id": 845,
    "title": "Project outline",
    "body": "Capture the first milestones.",
    "createdAt": "2026-10-11T14:30:00Z",
    "updatedAt": "2026-10-11T14:30:00Z",
    "tags": [
      { "id": 12, "name": "work" },
      { "id": 18, "name": "planning" }
    ]
  }
}
```

## List notes

Request: `GET /v1/notes?limit=2&cursor=eyJpZCI6ODQ1fQ`

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 845,
      "title": "Project outline",
      "body": "Capture the first milestones.",
      "createdAt": "2026-10-11T14:30:00Z",
      "updatedAt": "2026-10-11T14:30:00Z",
      "tags": [{ "id": 12, "name": "work" }]
    },
    {
      "id": 836,
      "title": "Reading list",
      "body": "Add the database chapter.",
      "createdAt": "2026-10-10T09:00:00Z",
      "updatedAt": "2026-10-10T09:00:00Z",
      "tags": []
    }
  ],
  "page": {
    "nextCursor": "eyJpZCI6ODM2fQ",
    "hasMore": true
  }
}
```

## Errors

Errors use a stable machine-readable code and a human-readable message. Validation errors may include field details.

| Status                      | Meaning                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `400 Bad Request`           | Malformed JSON, invalid fields, or invalid pagination parameters.       |
| `401 Unauthorized`          | Missing, invalid, or expired credentials.                               |
| `403 Forbidden`             | Authenticated caller lacks permission for an action.                    |
| `404 Not Found`             | Route or caller-visible resource does not exist.                        |
| `409 Conflict`              | Request conflicts with current state, such as a duplicate unique value. |
| `429 Too Many Requests`     | Rate limit exceeded; may include `Retry-After`.                         |
| `500 Internal Server Error` | Unexpected server failure.                                              |
| `503 Service Unavailable`   | Service is temporarily unable to accept requests.                       |

Example: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "issue": "Title is required and must be at most 100 characters."
      }
    ],
    "requestId": "req_01J9QK2M"
  }
}
```
