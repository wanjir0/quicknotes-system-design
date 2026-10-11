# QuickNotes Data Model

The schema below targets PostgreSQL. IDs are generated `BIGINT` values, timestamps are stored with time zone, and user-owned data is protected with foreign keys and ownership constraints.

## Entities and relationships

- **users** stores an account's identity and creation time. A user's normalized email is unique.
- **notes** stores a title, optional body, owner, and timestamps. One user has many notes (`users` 1-to-many `notes`).
- **tags** stores tag names scoped to their owner, allowing separate users to reuse names. One user has many tags (`users` 1-to-many `tags`).
- **note_tags** joins notes to tags. A note can have many tags and a tag can belong to many notes, so `notes` and `tags` have a many-to-many relationship through this table.

## Tables

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tags_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id)
);
```

The service must additionally verify that a tag and note belong to the same user before inserting into `note_tags`; this cross-table ownership rule is enforced in the write transaction (or with a database trigger if writes can bypass the service).

## Example queries

List a user's newest notes with a bounded page:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
ORDER BY created_at DESC, id DESC
LIMIT $2;
```

Fetch notes and their tags (JOIN):

```sql
SELECT n.id, n.title, t.id AS tag_id, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
LEFT JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = $1 AND n.id = $2
ORDER BY t.name;
```

Create a note and associate tags atomically:

```sql
BEGIN;
INSERT INTO notes (user_id, title, body)
VALUES ($1, $2, $3)
RETURNING id;
-- Insert one row per validated tag ID using the returned note ID.
INSERT INTO note_tags (note_id, tag_id)
VALUES ($4, $5), ($4, $6);
COMMIT;
```

Count notes by owner:

```sql
SELECT user_id, COUNT(*) AS note_count
FROM notes
GROUP BY user_id;
```

## Indexes

```sql
CREATE INDEX notes_user_created_idx ON notes (user_id, created_at DESC, id DESC);
CREATE INDEX note_tags_tag_idx ON note_tags (tag_id, note_id);
```

The first index supports the common user-scoped, newest-first notes listing and its cursor order. The `note_tags` primary key already supports note-to-tag lookups; the second index supports the reverse tag-to-notes traversal. The unique constraints on `users.email` and `(tags.user_id, tags.name)` also create indexes.

## SQL or NoSQL?

A relational database is the better default because notes, users, tags, and their associations have clear integrity rules, and common operations need transactional writes and joins. PostgreSQL provides constraints and mature indexing for those needs while remaining horizontally scalable through read replicas, partitioning, and carefully selected sharding if growth requires it. A document store could simplify denormalized note reads, but would duplicate tag and ownership data and make consistency harder to guarantee without a demonstrated workload need.
