let allTasks = [];

// Перемикач темної/світлої теми
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeBtnText(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeBtnText(newTheme);
}

function updateThemeBtnText(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerText = theme === 'dark' ? 'Світла тема' : 'Темна тема';
    }
}

// Керування модальним вікном
function openModal() { 
    document.getElementById('modalOverlay').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('modalOverlay').style.display = 'none'; 
    document.getElementById('taskForm').reset();
}

// Завантаження та відображення завдань
async function loadTasks() {
    const res = await fetch('/tasks/');
    allTasks = await res.json();
    renderTasks(allTasks);
}

function renderTasks(tasksToRender) {
    ['TODO', 'IN PROGRESS', 'DONE'].forEach(status => {
        const col = document.getElementById(status);
        col.innerHTML = `
            <div class="column-header">
                <h3>${status}</h3>
                <span class="task-count" id="count-${status}">0</span>
            </div>`;
    });

    const counts = { 'TODO': 0, 'IN PROGRESS': 0, 'DONE': 0 };

    tasksToRender.forEach(task => {
        const colId = ['TODO', 'IN PROGRESS', 'DONE'].includes(task.status) ? task.status : 'TODO';
        const col = document.getElementById(colId);
        counts[colId]++;

        let priorityColor = task.priority === 'Високий' ? '#ef4444' : task.priority === 'Середній' ? '#f59e0b' : '#10b981';
        let deadlineText = task.deadline ? `Дедлайн: ${new Date(task.deadline).toLocaleDateString('uk-UA')}` : 'Без дедлайну';
        let priorityText = task.priority || 'Звичайний';

        let tagsHtml = '';
        if (task.tags) {
            task.tags.split(',').forEach(tag => {
                if(tag.trim()) tagsHtml += `<span class="tag-chip">#${tag.trim()}</span>`;
            });
        }

        let descHtml = task.description ? `<div class="task-desc">${task.description}</div>` : '';

        const div = document.createElement('div');
        div.className = 'task';
        div.style.borderLeftColor = priorityColor;
        div.draggable = true;
        div.id = task.id;
        div.ondragstart = drag;
        div.innerHTML = `
            <div class="task-top">
                <span class="priority-badge" style="background: ${priorityColor}">${priorityText}</span>
                <button class="delete-btn" onclick="deleteTask('${task.id}')">Видалити</button>
            </div>
            <div class="task-title">${task.title}</div>
            ${descHtml}
            <div class="task-tags">${tagsHtml}</div>
            <div class="task-footer">
                <span>${deadlineText}</span>
            </div>
        `;
        col.appendChild(div);
    });

    Object.keys(counts).forEach(status => {
        const el = document.getElementById(`count-${status}`);
        if (el) el.innerText = counts[status];
    });
}

function filterTasks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredTasks = allTasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description && task.description.toLowerCase().includes(query);
        const tagsMatch = task.tags && task.tags.toLowerCase().includes(query);
        return titleMatch || descMatch || tagsMatch;
    });
    renderTasks(filteredTasks);
}

// Форма додавання
document.getElementById('taskForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = { 
        title: document.getElementById('title').value, 
        description: document.getElementById('description').value || null,
        tags: document.getElementById('tags').value || null,
        priority: document.getElementById('priority').value
    };
    const deadline = document.getElementById('deadline').value;
    if (deadline) payload.deadline = deadline + "T00:00:00";

    await fetch('/tasks/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    
    closeModal();
    loadTasks();
};

async function deleteTask(id) {
    await fetch(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
}

// Drag and Drop
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

async function drop(ev) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text");
    const targetColumn = ev.target.closest('.column');
    if (!targetColumn) return;
    
    targetColumn.appendChild(document.getElementById(taskId));
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    if(taskIndex !== -1) allTasks[taskIndex].status = targetColumn.id;
    
    await fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: targetColumn.id})
    });
    loadTasks();
}

// Ініціалізація
initTheme();
loadTasks();
