const API_URL = 'https://jsonplaceholder.typicode.com/posts';

async function request(url, options = {}) { //calls fetch and throws if the response is not okay
	const response = await fetch(url, options);
	if (!response.ok) {
		const error = new Error(`Request failed (${response.status}).`);
		error.status = response.status;
		throw error;
	}
	return response;
}

const loadButton = document.querySelector('#load-btn');
const statusMessage = document.querySelector('#status');
const notesList = document.querySelector('#notes-list');
const noteForm = document.querySelector('#note-form');
const titleInput = document.querySelector('#title-input');
const bodyInput = document.querySelector('#body-input');
const submitButton = document.querySelector('#submit-btn');
let pendingRequests = 0;

function showStatus(message, kind = '') {
	statusMessage.textContent = message;
	statusMessage.className = kind ? `status-${kind}` : '';
}

function setRequestPending(isPending) {
	pendingRequests += isPending ? 1 : -1;
	document.querySelectorAll('button').forEach((button) => {
		button.disabled = pendingRequests > 0;
	});
}

function renderNotes(notes) {
	notesList.replaceChildren();
	if (notes.length === 0) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'empty-state';
		emptyItem.textContent = 'No notes found. Create one to get started.';
		notesList.append(emptyItem);
		return;
	}

	for (const note of notes) {
		const item = document.createElement('li');
		item.className = 'note-item';
		const title = document.createElement('h3');
		title.textContent = note.title;
		const body = document.createElement('p');
		body.textContent = note.body;
		item.append(title, body, makeDeleteButton(note.id, item));
		notesList.append(item);
	}
}

loadButton.addEventListener('click', async () => {
	setRequestPending(true);
	showStatus('Loading notes...');

	try {
		const response = await request(`${API_URL}?_limit=10`);
		const notes = await response.json();
		renderNotes(notes);
		if (notes.length === 0) {
			showStatus('No notes were returned.', 'success');
		} else {
			showStatus(`Loaded ${notes.length} notes from the server.`, 'success');
		}
	} catch (error) {
		showStatus('Sorry, notes could not be loaded. Please try again.', 'error');
	} finally {
		setRequestPending(false);
	}
});

noteForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const title = titleInput.value.trim();
	const body = bodyInput.value.trim();

	if (!title) {
		showStatus('Please enter a title for your note.', 'error');
		titleInput.focus();
		return;
	}
	if (title.length > 100) {
		showStatus('Titles must be 100 characters or fewer.', 'error');
		titleInput.focus();
		return;
	}

	setRequestPending(true);
	showStatus('Creating note...');
	try {
		const response = await request(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=UTF-8' },
			body: JSON.stringify({ title, body, userId: 1 }),
		});
		const createdNote = await response.json();
		const emptyState = notesList.querySelector('.empty-state');
		if (emptyState) {
			emptyState.remove();
		}
		const item = document.createElement('li');
		item.className = 'note-item';
		const noteTitle = document.createElement('h3');
		noteTitle.textContent = createdNote.title;
		const noteBody = document.createElement('p');
		noteBody.textContent = createdNote.body;
		item.append(noteTitle, noteBody, makeDeleteButton(createdNote.id, item));
		notesList.prepend(item);
		noteForm.reset();
		showStatus(`Note created (status ${response.status}, id ${createdNote.id}).`, 'success');
	} catch (error) {
		showStatus('Sorry, the note could not be created. Please try again.', 'error');
	} finally {
		setRequestPending(false);
	}
});

function makeDeleteButton(noteId, noteElement) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'delete-btn';
	button.textContent = 'Delete';
	button.disabled = pendingRequests > 0;
	button.addEventListener('click', () => deleteNote(noteId, noteElement));
	return button;
}

async function deleteNote(noteId, noteElement) {
	setRequestPending(true);
	showStatus('Deleting note...');
	try {
		const response = await request(`${API_URL}/${encodeURIComponent(noteId)}`, {
			method: 'DELETE',
		});
		
		noteElement.remove();
		if (notesList.children.length === 0) {
			renderNotes([]);
		}
		showStatus(`Note deleted (status ${response.status}).`, 'success');
	} catch (error) {
		showStatus('Sorry, the note could not be deleted. Please try again.', 'error');
	} finally {
		setRequestPending(false);
	}
}
