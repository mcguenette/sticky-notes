'use strict';
import * as utils from './utils.js';

let isEditing = false;

utils.onEvent('DOMContentLoaded', document, () => {
    const addNoteButton = utils.select('#add-note-btn');
    const newNoteContainer = utils.select('#new-note-container');
    const stickyNotesContainer = utils.select('.sticky-notes-container');
    const saveNoteButton = utils.select('#save-note-btn');
    const cancelNoteButton = utils.select('#cancel-note-btn');
    const noteTitleInput = utils.select('#note-title');
    const noteContentInput = utils.select('#note-content');
    const colorPicker = utils.select('.color-picker');
    const notesContainer = utils.select('.notes-container');
    const todayList = utils.select('#today-list');

    let selectedColor = '#ffd43ba1';

    // SHOW new note form
    utils.onEvent('click', addNoteButton, () => {
        stickyNotesContainer.classList.add('hidden');
        newNoteContainer.classList.remove('hidden');
    });

    // SAVE new note
    utils.onEvent('click', saveNoteButton, (e) => {
        e.preventDefault();
        const noteTitle = noteTitleInput.value.trim();
        const noteContent = noteContentInput.value.trim();
        if (!noteTitle || !noteContent) {
            return;
        }

        if (isEditing) {
            // UPDATE existing
            const noteId = parseInt(noteTitleInput.dataset.editingId, 10);
            updateLocal(noteId, noteTitle, noteContent, selectedColor);
        } else {
            //CREATE new
            const newNote = {
                id: Date.now(),
                title: noteTitle,
                content: noteContent,
                color: selectedColor,
                created: new Date().toLocaleString()
            };
            saveLocal(newNote);
            appendNote(newNote);
        }
        isEditing = false;
        switchView();
    });

    // Cancel
    utils.onEvent('click', cancelNoteButton, (e) => {
        e.preventDefault();
        isEditing = false;
        switchView();
    });

    // Color SELECT and selected
    utils.onEvent('click', colorPicker, (e) => {
        if (e.target.tagName === 'I') {
            selectedColor = e.target.getAttribute('data-color');
            utils.selectAll('.color-picker i').forEach(icon => {
                icon.classList.remove('selected');
            });
            e.target.classList.add('selected'); 
        }
    });

    // Load notes
    loadLocal();

    utils.onEvent('click', utils.select('.notes-container'), (e) => {
        if (e.target.classList.contains('delete-note-btn')) {
            e.stopPropagation(); 
            const noteId = e.target.getAttribute('data-id');
            deleteNote(noteId); 
            deleteLocal(noteId); 
        } else {
            const noteCard = e.target.closest('.note-card');
            if (noteCard) {
                const noteId = noteCard.getAttribute('data-id');
                editNoteById(noteId);
            }
        }
    });

    function switchView() {
        const heading = utils.select('#note-heading');
        if(isEditing) {
            stickyNotesContainer.classList.add('hidden');
            newNoteContainer.classList.remove('hidden');
            heading.textContent = 'Edit Note';
        } else {
            stickyNotesContainer.classList.toggle('hidden');
            newNoteContainer.classList.toggle('hidden');
            heading.textContent = 'New Note';
            noteTitleInput.value = '';
            noteContentInput.value = '';
            selectedColor = '#ffd43ba1';
            utils.selectAll('.color-picker i').forEach(icon => {
                icon.classList.remove('selected');
            });
            delete noteTitleInput.dataset.editingId; 
            isEditing = false;
        }
    }     

    function saveLocal(note) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadLocal() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.forEach(appendNote);
    }
    
    function updateLocal(noteId, title, content, color) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].color = color;
            localStorage.setItem('notes', JSON.stringify(notes));
    
            // UPDATE the note card on the page
            const noteCard = utils.select(`.note-card[data-id="${noteId}"]`);
            noteCard.style.backgroundColor = color;
            noteCard.querySelector('.note-title').textContent = title;
            noteCard.querySelector('.note-description').textContent = content;
    
            // UPDATE the sidebar item
            const sidebarItem = utils.select(`.menu-item[data-id="${noteId}"]`);
            sidebarItem.querySelector('.note-title-sidebar').textContent = title;
            sidebarItem.querySelector('i').style.color = color;
        }
    }

    function appendNote(note) {
        const noteCard = utils.create('div');
        noteCard.className = 'note-card card-flex';
        noteCard.setAttribute('data-id', note.id);
        noteCard.style.backgroundColor = note.color;
        noteCard.innerHTML = `
            <div class="note-content">
                <h4 class="note-title">${note.title}</h4>
                <p class="note-description">${note.content}</p>
                <p class="time-stamp">${note.created}</p>
            </div>
            <button class="delete-note-btn" data-id="${note.id}">×</button>
        `;
        notesContainer.appendChild(noteCard);
    
        const sidebarItem = utils.create('div');
        sidebarItem.className = 'menu-item flex align-items-center';
        sidebarItem.setAttribute('data-id', note.id); 
        sidebarItem.innerHTML = 
        `<i class="fa-solid fa-square" style="color: ${note.color};"></i>
            <p class="note-title-sidebar">${note.title}</p>`;
        todayList.appendChild(sidebarItem);
    
        const deleteBtnNoteCard = utils.select('.delete-note-btn', noteCard);
        utils.onEvent('click', deleteBtnNoteCard, (e) => {
            e.stopPropagation();
            deleteNoteGlobal(note.id);
        });
    
        utils.onEvent('click', noteCard, (e) => {
            if (!e.target.classList.contains('delete-note-btn')) {
                editNoteById(note.id);
            }
        });
    }
    
    // DELETE both note and sidebar item
    function deleteNoteGlobal(noteId) {
        deleteLocal(noteId);
        const noteCard = utils.select(`.note-card[data-id="${noteId}"]`);
        if (noteCard) {
            noteCard.remove();
        }
        const sidebarItem = utils.select(`.menu-item[data-id="${noteId}"]`);
        if (sidebarItem) {
            sidebarItem.remove();
        }
    }
    
    // DELETE from local storage
    function deleteLocal(noteId) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes = notes.filter(note => note.id !== parseInt(noteId, 10));
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function editNoteById(noteId) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const note = notes.find(note => note.id === parseInt(noteId));
        if (note) {
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            selectedColor = note.color;
            utils.selectAll('.color-picker i').forEach(icon => {
                icon.classList.remove('selected');
                if (icon.getAttribute('data-color') === selectedColor) {
                    icon.classList.add('selected'); 
                }
            });
            noteTitleInput.dataset.editingId = noteId; 
            isEditing = true;
            switchView();
        }
    }

    utils.onEvent('click', todayList, (e) => {
        const sidebarItem = e.target.closest('.menu-item');
        if (sidebarItem) {
            const noteId = sidebarItem.getAttribute('data-id');
            editNoteById(noteId);
        }
    });
});
