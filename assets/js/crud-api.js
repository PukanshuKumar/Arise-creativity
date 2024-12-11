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

let currentEditIndex = null;
let currentPage = 1;
const itemsPerPage = 4;
let filteredItems = [];
const loader = document.getElementById('box-loader');
const ctaButton = document.getElementById('submitBtn');
let isUpdating = true;



async function updateButtons() {
    if (isUpdating === true) {
        ctaButton.textContent = "Update"
    }else{
        ctaButton.textContent = "Add"
    }
}
async function checkForDuplicates(title, authorName, description) {
    try {
      const querySnapshot = await getDocs(collection(db, 'items'));
      const isDuplicate = querySnapshot.docs.some(doc => {
        const data = doc.data();
        return (
          data.title === title &&
          data.authorName === authorName &&
          data.description === description &&
          !data.deleted
        );
      });

      return isDuplicate;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return false; // Proceed safely if check fails
    }
  }


// Fetch items from JSONBin (optionally include deleted items)
async function fetchItems(includeDeleted = false) {
    loader.classList.remove('d-none'); // Show the loader

    try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out deleted items unless includeDeleted is true
        return includeDeleted ? items : items.filter(item => !item.deleted);
    } catch (error) {
        console.error("Error fetching items:", error);
        alert('Failed to fetch items.');
        return [];
    } finally {
        loader.classList.add('d-none'); // Hide the loader
    }
}


// Save data back to JSONBin
async function saveData(item) {
    try {
        const docRef = item.id
            ? doc(db, "items", item.id) // Reference an existing document
            : doc(collection(db, "items")); // Reference new document

        await setDoc(docRef, item);
        console.log(`Document saved with ID: ${docRef.id}`);
    } catch (error) {
        console.error("Error saving data:", error);
        alert('Failed to save data.');
    }
}


// Function to update existing items with unique IDs
async function updateItemsWithUniqueIds() {
    const items = await fetchItems(true); // Fetch all items, including deleted ones

    for (const item of items) {
        if (!item.id) {
            item.id = 'id-' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
            await saveData(item); // Update item in Firestore
        }
    }

    console.log("Updated items with unique IDs.");
}

// Call this function once to update existing items
// updateItemsWithUniqueIds();


// Permanently delete items marked as deleted
// async function permanentlyDeleteMarkedItems() {
//     loader.classList.remove('d-none'); // Show the loader
//     console.log('Permanently deleting all marked items');
//     const items = await fetchItems(true); // Fetch all items, including deleted ones
//     const itemsToKeep = items.filter(item => !item.deleted); // Filter out items marked as deleted
//     await saveData(itemsToKeep);
//     console.log("Permanently deleted items marked as deleted");
//     init(); // Refresh item list
//     loader.classList.add('d-none'); // hide the loader
// }

// Soft-delete function (visible delete for the user)
async function removeItem(id) {
    try {
      const docRef = doc(db, "items", id);
      await updateDoc(docRef, { deleted: true });
      alert("Item successfully deleted.");
      init();
    } catch (error) {
      console.error("Error in deleting item:", error);
    }
  }
  window.removeItem = removeItem;


async function permanentlyDeleteMarkedItems() {
    const items = await fetchItems(true); // Fetch all items
    for (const item of items) {
        if (item.deleted) {
            const docRef = doc(db, "items", item.id);
            await deleteDoc(docRef); // Permanently delete from Firestore
        }
    }
    console.log("Permanently deleted marked items.");
    init(); // Refresh item list
}
window.permanentlyDeleteMarkedItems = permanentlyDeleteMarkedItems;


// Restore all items marked as deleted
async function restoreAllDeletedItems() {
    const items = await fetchItems(true); // Fetch all items, including deleted ones

    for (const item of items) {
        if (item.deleted) {
            const docRef = doc(db, "items", item.id);
            await updateDoc(docRef, { deleted: false });
        }
    }

    console.log("Restored all items that were marked as deleted.");
    init(); // Refresh item list
}
window.restoreAllDeletedItems = restoreAllDeletedItems;


// Function to add a new item or update an existing item
async function addItem() {
    const title = document.getElementById("txtTitle").value;
    const authorName = document.getElementById("txtAuthorName").value;
    const date = document.getElementById("txtDate").value || new Date().toISOString().split('T')[0];
    const description = document.getElementById("txtDescription").value;

    if (!title || !description) {
      alert("Both title and description fields are required.");
      return;
    }

    const isDuplicate = await checkForDuplicates(title, authorName, description);

    if (isDuplicate) {
      alert("An item with this title and description already exists.");
      return;
    }

    const newItem = {
      title,
      authorName,
      date,
      description,
      deleted: false,
    };

    if (currentEditIndex) {
      // Editing logic
      newItem.id = currentEditIndex; // Use the ID from editing context
      const docRef = doc(db, 'items', newItem.id);
      await updateDoc(docRef, newItem);
      isUpdating = false;
      alert('Item updated successfully');
      updateButtons();
    } else {
      // Add logic
      const docRef = await addDoc(collection(db, 'items'), newItem);
      alert(`New item added with ID: ${docRef.id}`);
    }

    currentEditIndex = null; // Reset editing index
    init(); // Refresh items
    document.getElementById('dataForm').reset(); // Clear the form
  }
  window.addItem = addItem;


// // Function to edit an item by index
// async function editItem(id) {
//     console.log('editItem');
//     const items = await fetchItems(true); // Fetch all items, including deleted ones
//     if (Array.isArray(items)) {
//         const item = items.find(item => item.id === id); // Find item by ID
//         if (item) {
//             document.getElementById('txtTitle').value = item.title;
//             document.getElementById('txtAuthorName').value = item.authorName;
//             document.getElementById('txtDate').value = item.date;
//             document.getElementById('txtDescription').value = item.description;
//             currentEditIndex = items.indexOf(item); // Set the current index being edited
//         }
//     } else {
//         console.warn('Could not edit item, fetched items are not an array:', items);
//     }
// }
// window.editItem = editItem;

async function editItem(id) {
    try {
      const docRef = doc(db, 'items', id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        alert('Item not found');
        return;
      }

      const item = docSnapshot.data();
      document.getElementById('txtTitle').value = item.title || '';
      document.getElementById('txtAuthorName').value = item.authorName || '';
      document.getElementById('txtDate').value = item.date || '';
      document.getElementById('txtDescription').value = item.description || '';
      isUpdating = true;
      updateButtons();
      currentEditIndex = id; // Track index for editing
    } catch (error) {
      console.error("Error editing item:", error);
    }
  }
  window.editItem = editItem;



// Display items with pagination and search filters
function displayItems() {
    const itemList = document.getElementById('itemList');
    if (!itemList) return;

    itemList.innerHTML = '';

    const visibleItems = filteredItems.filter(item => !item.deleted); // Exclude deleted items
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const itemsToShow = visibleItems.slice().reverse().slice(start, end);

    itemsToShow.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('col-md-6');
      div.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="d-flex w-100 justify-content-between gap-2">
              <h5 class="mb-1 text-truncate title" title="${item.title}">${item.title}</h5>
              <small class="text-nowrap text-muted small">${item.date}</small>
            </div>
            <p class="text-muted small mb-1 authorName">${item.authorName}</p>
            <p class="mb-1 description">${item.description}</p>
          </div>
          <div class="card-footer">
            <button class="toggle-btn btn btn-outline-primary btn-sm mt-2" onclick="toggleDescription(this)">Read More</button>
            <button class="btn btn-outline-secondary btn-sm mt-2" onclick="editItem('${item.id}')">Edit</button>
            <button class="btn btn-outline-danger btn-sm mt-2" onclick="removeItem('${item.id}')">Delete</button>
          </div>
        </div>
      `;
      itemList.appendChild(div);
    });

    renderPagination();
  }


// Render pagination controls
function renderPagination() {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = ''; // Clear current pagination

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    // Hide pagination if there's only one page
    if (totalPages <= 1) return paginationContainer.classList.add('d-none');
    paginationContainer.classList.remove('d-none');

    // "Previous" button
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = `<button class="page-link" onclick="prevPage()">Previous</button>`;
    paginationContainer.appendChild(prevButton);

    // Calculate start and end page numbers for pagination links
    let startPage, endPage;
    if (currentPage === 1) {
        // Case when on the first page
        startPage = 1;
        endPage = Math.min(3, totalPages);
    } else if (currentPage === totalPages) {
        // Case when on the last page
        startPage = Math.max(totalPages - 2, 1);
        endPage = totalPages;
    } else {
        // General case for pages in the middle
        startPage = currentPage - 1;
        endPage = currentPage + 1;
    }

    // Create page number links
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<button class="page-link" onclick="goToPage(${i})">${i}</button>`;
        paginationContainer.appendChild(pageItem);
    }

    // "Next" button
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `<button class="page-link" onclick="nextPage()">Next</button>`;
    paginationContainer.appendChild(nextButton);
}
window.renderPagination = renderPagination;


// Pagination control functions
function prevPage() {
    loader.classList.remove('d-none'); // Show the loader
    if (currentPage > 1) {
        currentPage--;
        displayItems();
        loader.classList.add('d-none'); // hide the loader
    }
}
window.prevPage = prevPage;


function nextPage() {
    loader.classList.remove('d-none'); // Show the loader
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayItems();
        loader.classList.add('d-none'); // hide the loader
    }
}
window.nextPage = nextPage;


function goToPage(page) {
    loader.classList.remove('d-none'); // Show the loader
    currentPage = page;
    displayItems();
    loader.classList.add('d-none'); // hide the loader
}
window.goToPage = goToPage;


// Search functionality
function searchItems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    fetchItems().then((items) => {
        filteredItems = items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.authorName.toLowerCase().includes(query)
        );
        currentPage = 1; // Reset to first page on new search
        displayItems();
    });
}
window.searchItems = searchItems;




// Initialize data on page load
async function init() {
    loader.classList.remove('d-none');
    const items = await fetchItems();
    filteredItems = items;
    displayItems();
    loader.classList.add('d-none');
  }


function toggleDescription(button) {
    const description = button.closest('.card').querySelector('.description');
    description.classList.toggle("show_full_text");
    button.textContent = description.classList.contains("show_full_text") ? "Read Less" : "Read More";
}

window.toggleDescription = toggleDescription;


// Function to implement infinite scrolling
async function loadQuotesOnScroll() {
    const quotesContainer = document.getElementById('quotes');
    if (!quotesContainer) {
        return
    } // Ensure a container with ID 'quotes' exists in the HTML
    let pageIndex = 0; // Start from the first page of quotes
    const batchSize = 12; // Number of quotes to load per batch
    let isFetching = false; // Prevent duplicate fetches while loading

    async function fetchAndAppendQuotes() {
        if (isFetching) return; // Exit if already fetching
        isFetching = true;

        const items = await fetchItems(); // Fetch all non-deleted items
        const startIndex = pageIndex * batchSize;
        const endIndex = startIndex + batchSize;

        const itemsToShow = items.slice().reverse().slice(startIndex, endIndex); // Reverse for newest first
        itemsToShow.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('quote-item');
            div.innerHTML = `
                <div class="card border-start border-0 border-primary shadow border-3">
                    <div class="card-body">
                        <p class="mb-1">${item.description}</p>
                        <p class="text-primary small mb-1 fst-italic authorName">${item.authorName}</p>
                    </div>
                </div>
            `;
            quotesContainer.appendChild(div);
        });

        if (endIndex >= items.length) {
            // Stop listening to scroll when all items are loaded
            window.removeEventListener('scroll', handleScroll);
        } else {
            pageIndex++; // Increment to the next batch
        }

        isFetching = false; // Allow next fetch
    }

    async function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        if (scrollHeight - scrollTop <= clientHeight + 100) {
            // If near the bottom, fetch and append more quotes
            await fetchAndAppendQuotes();
        }
    }

    // Start loading quotes and add scroll event listener
    await fetchAndAppendQuotes();
    window.addEventListener('scroll', handleScroll);
}

// Ensure a div with ID 'quotes' exists in your HTML
// <div id="quotes" class="row"></div>

// Call the function to initialize infinite scrolling
loadQuotesOnScroll();

function listenForChanges() {
    const unsubscribe = onSnapshot(collection(db, "items"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      filteredItems = items.filter(item => !item.deleted);
      displayItems();
    });
  }
  window.listenForChanges = listenForChanges;
  listenForChanges();


  async function removeFirestoreDuplicates() {
    const querySnapshot = await getDocs(collection(db, 'items'));

    const seen = new Set();
    const duplicates = [];

    for (let docSnapshot of querySnapshot.docs) {
      const book = docSnapshot.data();
      const uniqueKey = `${book.title}-${book.authorName}`;

      if (seen.has(uniqueKey)) {
        duplicates.push(docSnapshot.id);
      } else {
        seen.add(uniqueKey);
      }
    }

    for (const docId of duplicates) {
      await deleteDoc(doc(db, 'items', docId));
      console.log(`Deleted duplicate: ${docId}`);
    }

    console.log('Deduplication process complete');
  }

  // Call the function
//   removeFirestoreDuplicates();

// Fetch a random quote from Firestore
async function getRandomQuote() {
  const iconElement = document.getElementById('getNewQuotesIcons');
  const buttonElement = iconElement.closest('button'); // Find the parent button

  iconElement.classList.add('fa-spin');
  if (buttonElement) {
    buttonElement.setAttribute('disabled', 'true');
}
  try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const nonDeletedItems = items.filter(item => !item.deleted);

      if (nonDeletedItems.length === 0) {
          console.error("No quotes available");
          return;
      }

      // Select a random quote
      const randomIndex = Math.floor(Math.random() * nonDeletedItems.length);
      const randomQuote = nonDeletedItems[randomIndex];

      // Update the UI with the random quote
      const quotesDescription = document.getElementById('quotesDescription');
      const quotesAuthorName = document.getElementById('quotesAuthorName');

      quotesDescription.innerHTML = `${randomQuote.description}`;
      quotesAuthorName.innerHTML = `${randomQuote.authorName}`;
  } catch (error) {
      console.error("Error fetching random quote:", error);
  } finally {
    // Remove the class after 2 seconds
    setTimeout(() => {
        iconElement.classList.remove('fa-spin');
        if (buttonElement) {
          buttonElement.removeAttribute('disabled');
      }
    }, 2000);
}
}

// Set up a timer to fetch a new quote every hour
setInterval(getRandomQuote, 3600000); // 3600000ms = 1 hour

// Call the function initially to load the first quote
getRandomQuote();
window.getRandomQuote = getRandomQuote;
