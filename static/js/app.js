let allTasks = [];
let currentEditId = null;
let todayViewActive = false;

// Ініціалізація теми
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
    if (btn) btn.innerText = theme === 'dark' ? 'Світла тема' : 'Темна тема';
}

// Управління модальним вікном (Створення / Редагування)
function openModal(taskId = null) {
    const modalTitle = document.getElementById('modalTitle');
    
    if (taskId) {
        currentEditId = taskId;
        modalTitle.innerText = 'Редагувати завдання';
        const task = allTasks.find(t => t.id === taskId);
        
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description || '';
        document.getElementById('priority').value = task.priority || 'Середній';
        document.getElementById('tags').value = task.tags || '';
        document.getElementById('deadline').value = task.deadline ? task.deadline.split('T')[0] : '';
    } else {
        currentEditId = null;
        modalTitle.innerText = 'Нове завдання';
        document.getElementById('taskForm').reset();
    }
    
    document.getElementById('modalOverlay').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('modalOverlay').style.display = 'none'; 
    document.getElementById('taskForm').reset();
    currentEditId = null;
}

// Вигляд "Сьогодні"
function toggleTodayView() {
    todayViewActive = !todayViewActive;
    const btn = document.getElementById('todayFilterBtn');
    if (todayViewActive) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
    } else {
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
    }
    filterTasks();
}

// Завантаження завдань
async function loadTasks() {
    const res = await fetch('/tasks/');
    allTasks = await res.json();
    filterTasks();
}

// Рендер карток
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
                <span class="priority-badge" style="background: ${priorityColor}">${task.priority || 'Звичайний'}</span>
                <div>
                    <button class="delete-btn" style="margin-right: 5px; color: #3b82f6;" onclick="openModal('${task.id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteTask('${task.id}')">✕</button>
                </div>
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

// Фільтрація (Пошук + Сьогодні)
function filterTasks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const filteredTasks = allTasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description && task.description.toLowerCase().includes(query);
        const tagsMatch = task.tags && task.tags.toLowerCase().includes(query);
        const matchesSearch = titleMatch || descMatch || tagsMatch;
        
        let matchesToday = true;
        if (todayViewActive) {
            if (!task.deadline) {
                matchesToday = false; 
            } else {
                const taskDate = new Date(task.deadline);
                // Показуємо ті, що прострочені або на сьогодні, виключаючи вже готові
                matchesToday = taskDate <= today && task.status !== 'DONE';
            }
        }
        
        return matchesSearch && matchesToday;
    });
    
    renderTasks(filteredTasks);
}

// Збереження форми (Створення або Оновлення)
document.getElementById('taskForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = { 
        title: document.getElementById('title').value, 
        description: document.getElementById('description').value || null,
        tags: document.getElementById('tags').value || null,
        priority: document.getElementById('priority').value
    };
    
    const deadlineVal = document.getElementById('deadline').value;
    payload.deadline = deadlineVal ? deadlineVal + "T00:00:00" : null;

    if (currentEditId) {
        await fetch(`/tasks/${currentEditId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } else {
        await fetch('/tasks/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    }
    
    closeModal();
    loadTasks();
};

async function deleteTask(id) {
    await fetch(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
}

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

initTheme();
loadTasks();
