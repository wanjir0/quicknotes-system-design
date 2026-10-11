const API_URL = 'https://jsonplaceholder.typicode.com/posts';

async function request(url, options = {}) {
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

function showStatus(message, kind = '') {
	statusMessage.textContent = message;
	statusMessage.className = kind ? `status-${kind}` : '';
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
		item.append(title, body);
		notesList.append(item);
	}
}

loadButton.addEventListener('click', async () => {
	loadButton.disabled = true;
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
		loadButton.disabled = false;
	}
});
