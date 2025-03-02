import {
    initializeApp,
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

  import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,  // <-- Import `onSnapshot`
    setDoc,     // <-- Import `setDoc`
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBAuQsNQ8hvjJXMHtUOVx9GgR4MRHEIz7Y",
  authDomain: "arise-creativity.firebaseapp.com",
  projectId: "arise-creativity",
  storageBucket: "arise-creativity.appspot.com",
  messagingSenderId: "823338118500",
  appId: "1:823338118500:web:1f206c4f53c58b1e23de71",
  measurementId: "G-ND2M4LNGWL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


let editTaskId = null; // Keep track of task being edited

function addItem() {
  const description = document.getElementById('txtDescription').value.trim();
  const title = document.getElementById('txtTitle').value.trim();

  if (!description) {
    alert("Description is required!");
    return;
  }

  const taskId = editTaskId || `task-${Date.now()}`;
  const taskHtml = `
    <div class="quote-item my-3" id="${taskId}">
      <div class="card border-start border-0 border-primary border-3">
        <div class="card-body border rounded">
          <div class="d-flex gap-3 align-items-start">
            <!-- Checkbox -->
            <div class="form-check mt-1">
              <input class="form-check-input" type="checkbox" onchange="markAsCompleted('${taskId}')" />
            </div>

            <!-- Task Details -->
            <div class="flex-grow-1">
              <p class="mb-2 task-description fw-bold text-dark">${description}</p>
              ${title ? `<p class="text-primary small mb-1 fst-italic task-title">— ${title}</p>` : ''}
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted"><i class="far fa-calendar-alt me-1"></i> Added: ${new Date().toLocaleDateString()}</small>
              </div>
            </div>

            <!-- Dropdown Menu -->
            <div class="dropdown text-end">
              <a class="btn-sm p-0 text-muted" type="button" id="dropdownMenuButton1"
                data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton1">
                <li><a class="dropdown-item" href="#" onclick="editTask('${taskId}')"><i class="fas fa-edit me-2 text-primary"></i>Edit Task</a></li>
                <li><a class="dropdown-item" href="#" onclick="deleteTask('${taskId}')"><i class="fas fa-trash-alt me-2 text-danger"></i>Delete Task</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (editTaskId) {
    document.getElementById(editTaskId).outerHTML = taskHtml;
    editTaskId = null;
  } else {
    document.getElementById('allTasks').insertAdjacentHTML('beforeend', taskHtml);
  }

  document.getElementById('dataForm').reset();
}
window.addItem = addItem;

function deleteTask(taskId) {
  const taskElement = document.getElementById(taskId);
  taskElement.remove();
}
window.deleteTask = deleteTask;

function editTask(taskId) {
  const taskElement = document.getElementById(taskId);
  const description = taskElement.querySelector('.task-description').textContent.trim();
  const titleElement = taskElement.querySelector('.task-title');
  const title = titleElement ? titleElement.textContent.replace('— ', '').trim() : '';

  document.getElementById('txtDescription').value = description;
  document.getElementById('txtTitle').value = title;
  editTaskId = taskId;
}
window.editTask = editTask;

function markAsCompleted(taskId) {
  const taskElement = document.getElementById(taskId);
  document.getElementById('completedTasks').appendChild(taskElement);
  taskElement.querySelector('input[type="checkbox"]').disabled = true; // Disable the checkbox
}
window.markAsCompleted = markAsCompleted;
