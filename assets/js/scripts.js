// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBAuQsNQ8hvjJXMHtUOVx9GgR4MRHEIz7Y",
  authDomain: "arise-creativity.firebaseapp.com",
  projectId: "arise-creativity",
  storageBucket: "arise-creativity.appspot.com",
  messagingSenderId: "823338118500",
  appId: "1:823338118500:web:1f206c4f53c58b1e23de71",
  measurementId: "G-ND2M4LNGWL"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constants for pagination and filtering
let currentEditIndex = null;
let currentPage = 1;
const itemsPerPage = 4;
let filteredItems = [];
const loader = document.getElementById('box-loader');

// Fetch items from Firestore
async function fetchItems(includeDeleted = false) {
  loader.classList.remove('d-none'); // Show the loader
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('deleted', '==', includeDeleted ? false : true));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return items;
  } catch (error) {
    console.error(error);
    alert('Failed to fetch items.');
    return [];
  } finally {
    loader.classList.add('d-none'); // Hide the loader
  }
}

// Save data to Firestore
async function saveData(data) {
  try {
    const itemsRef = collection(db, 'items');
    // Adding new data to Firestore (if needed)
    data.forEach(async (item) => {
      if (!item.id) {
        await addDoc(itemsRef, item); // Add new document
      } else {
        const itemDocRef = doc(db, 'items', item.id);
        await updateDoc(itemDocRef, item); // Update existing document
      }
    });
  } catch (error) {
    console.error(error);
    alert('Failed to save data.');
  }
}

// Update existing items with unique IDs
async function updateItemsWithUniqueIds() {
  const items = await fetchItems(true); // Fetch all items, including deleted ones
  const updatedItems = items.map(item => {
    if (!item.id) { // Check if the item already has an ID
      item.id = 'id-' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
    }
    return item;
  });

  await saveData(updatedItems); // Save the updated items back to Firestore
  console.log("Updated items with unique IDs:", updatedItems);
}

// Permanently delete items marked as deleted
async function permanentlyDeleteMarkedItems() {
  loader.classList.remove('d-none'); // Show the loader
  const items = await fetchItems(true); // Fetch all items, including deleted ones
  const itemsToKeep = items.filter(item => !item.deleted); // Filter out items marked as deleted
  await saveData(itemsToKeep);
  console.log("Permanently deleted items marked as deleted");
  init(); // Refresh item list
  loader.classList.add('d-none'); // Hide the loader
}

// Soft-delete function (visible delete for the user)
async function removeItem(id) {
  console.log('Attempting to remove item with ID:', id);
  const items = await fetchItems(true); // Fetch all items, including deleted ones

  const itemToRemove = items.find(item => item.id === id); // Find item by ID

  if (itemToRemove) {
    itemToRemove.deleted = true; // Mark item as deleted
    await saveData(items);
    console.log('Item marked as deleted:', itemToRemove);
    init(); // Refresh item list
  } else {
    console.warn('No item found with ID:', id);
  }
}

// Restore all items marked as deleted
async function restoreAllDeletedItems() {
  loader.classList.remove('d-none'); // Show the loader
  const items = await fetchItems(true); // Fetch all items, including deleted ones
  const restoredItems = items.map(item => {
    if (item.deleted) {
      item.deleted = false; // Unmark item as deleted
    }
    return item;
  });
  await saveData(restoredItems);
  console.log("Restored all items that were marked as deleted.");
  init(); // Refresh item list
  loader.classList.add('d-none'); // Hide the loader
}

// Function to add a new item or update an existing item
async function addItem() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
  submitBtn.disabled = true;

  let title = document.getElementById("txtTitle").value;
  const author = document.getElementById("txtAuthorName").value;
  let date = document.getElementById("txtDate").value || new Date().toISOString().split('T')[0]; // Default to today if no date provided
  const description = document.getElementById("txtDescription").value;

  // If the title is empty, set it to the first 80 characters of the description followed by "..."
  if (!title && description) {
    title = description.substring(0, 80) + (description.length > 80 ? "..." : "");
  }

  const items = await fetchItems(true);
  if (Array.isArray(items)) {
    const newItem = {
      id: 'id-' + Math.random().toString(36).substr(2, 9), // Generate a unique ID
      title,
      author,
      date,
      description,
      deleted: false
    };

    if (currentEditIndex !== null) {
      items[currentEditIndex] = newItem; // Update existing item
      currentEditIndex = null;
    } else {
      items.push(newItem); // Add new item
    }
    await saveData(items);
    init(); // Refresh item list
    document.getElementById('dataForm').reset(); // Clear form
  } else {
    console.warn('Could not add item, fetched items are not an array:', items);
  }

  submitBtn.innerHTML = `Add`;
  submitBtn.disabled = false;
}

// Function to edit an item by index
async function editItem(id) {
  const items = await fetchItems(true); // Fetch all items, including deleted ones
  if (Array.isArray(items)) {
    const item = items.find(item => item.id === id); // Find item by ID
    if (item) {
      document.getElementById('txtTitle').value = item.title;
      document.getElementById('txtAuthorName').value = item.author;
      document.getElementById('txtDate').value = item.date;
      document.getElementById('txtDescription').value = item.description;
      currentEditIndex = items.indexOf(item); // Set the current index being edited
    }
  } else {
    console.warn('Could not edit item, fetched items are not an array:', items);
  }
}

// Display items with pagination and search filters
function displayItems() {
  const itemList = document.getElementById('itemList');
  if (!itemList) return;

  itemList.innerHTML = ''; // Clear the list

  const itemCount = filteredItems.length; // Get the count of filtered items
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  // Reverse the filtered items to show the newest first
  const itemsToShow = filteredItems.slice().reverse().slice(start, end);

  itemsToShow.forEach((item) => {
    const div = document.createElement('div');
    div.classList.add('col-md-6');
    div.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="d-flex w-100 justify-content-between gap-2">
            <h5 class="mb-1 text-truncate title" title="${item.title}">${item.title}</h5>
            <small class="text-nowrap text-muted small">${item.date}</small>
          </div>
          <p class="text-muted small mb-1">${item.description}</p>
          <small class="author">by ${item.author}</small>
          <button class="btn btn-sm btn-danger" onclick="removeItem('${item.id}')">Delete</button>
        </div>
      </div>
    `;
    itemList.appendChild(div);
  });

  // Call renderPagination for pagination buttons
  renderPagination(itemCount);
}

// Initialize the app by loading items and setting up the UI
async function init() {
  filteredItems = await fetchItems(); // Fetch all items by default (no filtering)
  displayItems(); // Display the fetched items
}

// Pagination handler
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = ''; // Clear existing pagination

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('btn', 'btn-sm', 'btn-secondary');
    pageButton.onclick = () => {
      currentPage = i;
      displayItems(); // Show the items for the current page
    };
    paginationContainer.appendChild(pageButton);
  }
}

document.addEventListener('DOMContentLoaded', init);
