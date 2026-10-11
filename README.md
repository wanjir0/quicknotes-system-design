# QuickNotes System Design

QuickNotes is a browser-based API client and a system-design exercise for evolving a personal notes app into a reliable service for one million registered users. The client uses JSONPlaceholder to practice GET, POST, and DELETE; the documents describe a proposed production API and backend.

## Run the API client

From the repository root, start a local static server:

```powershell
python -m http.server 8000
```

Open [http://localhost:8000/docs/](http://localhost:8000/docs/) in a browser, then choose **Load notes** or submit the note form. The client requires an internet connection to reach JSONPlaceholder. Its POST and DELETE endpoints are simulated and do not persist changes on the remote service; the client updates the visible list for the current page session.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- A reusable request helper keeps HTTP status checking and error behavior consistent across API operations.
- User-provided content should be rendered as text, not interpreted as HTML, and forms need validation before sending requests.
- Database relationships and constraints protect ownership and consistency, while indexes should follow the application's actual query patterns.
- Capacity estimates are only useful when their assumptions are visible and can be replaced with production measurements.
- Replicas, caches, and queues each add useful capacity or resilience, but introduce consistency and operational trade-offs that need explicit handling.
