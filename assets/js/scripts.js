const apiKey = '$2a$10$Pl.97PqwynzEkdLT31QVO.GVmhtDMcsArdEo9w7mV.eTgjqlRI2Qy'; // Replace with your JSONBin API key
const binId = '67276085acd3cb34a8a1c31b'; // Your actual Bin ID
// const binId = '672a4a5aad19ca34f8c4b376'; // Your actual Bin ID

let currentEditIndex = null;
let currentPage = 1;
const itemsPerPage = 4;
let filteredItems = [];
const loader = document.getElementById('box-loader');


// Fetch items from JSONBin (optionally include deleted items)
async function fetchItems(includeDeleted = false) {
    loader.classList.remove('d-none'); // Show the loader

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': apiKey }
        });
        if (!response.ok) throw new Error(`Error fetching items: ${response.statusText}`);
        const data = await response.json();
        // Filter out items marked as deleted unless includeDeleted is true
        return Array.isArray(data.record.items) ? data.record.items.filter(item => includeDeleted || !item.deleted) : [];
    } catch (error) {
        console.error(error);
        alert('Failed to fetch items.');
        return [];
    } finally {
        loader.classList.add('d-none'); // Hide the loader
    }
}

// Save data back to JSONBin
async function saveData(data) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify({ items: data })
        });
        if (!response.ok) throw new Error(`Error saving data: ${response.statusText}`);
        return response.json();
    } catch (error) {
        console.error(error);
        alert('Failed to save data.');
    }
}

// Function to update existing items with unique IDs
async function updateItemsWithUniqueIds() {
    const items = await fetchItems(true); // Fetch all items, including deleted ones
    const updatedItems = items.map(item => {
        if (!item.id) { // Check if the item already has an ID
            item.id = 'id-' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
        }
        return item;
    });

    await saveData(updatedItems); // Save the updated items back to the database
    console.log("Updated items with unique IDs:", updatedItems);
}

// Call this function once to update existing items
updateItemsWithUniqueIds();


// Permanently delete items marked as deleted
async function permanentlyDeleteMarkedItems() {
    loader.classList.remove('d-none'); // Show the loader
    console.log('Permanently deleting all marked items');
    const items = await fetchItems(true); // Fetch all items, including deleted ones
    const itemsToKeep = items.filter(item => !item.deleted); // Filter out items marked as deleted
    await saveData(itemsToKeep);
    console.log("Permanently deleted items marked as deleted");
    init(); // Refresh item list
    loader.classList.add('d-none'); // hide the loader
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
    console.log('Restoring all deleted items');
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
    loader.classList.add('d-none'); // hide the loader
}

// Function to add a new item or update an existing item
async function addItem() {
    console.log('addItem');
        // Show spinner and disable button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
        submitBtn.disabled = true;

    let title = document.getElementById("txtTitle").value;
    const author = document.getElementById("txtAuthorName").value;
    let date = document.getElementById("txtDate").value || new Date().toISOString().split('T')[0]; // Default to today if no date provided
    const description = document.getElementById("txtDescription").value;

    // If the title is empty, set it to the first 80 characters of the description followed by "..."
    if (!title && description) {
        console.log("80 characters");
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

    // Reset button text and enable button
    submitBtn.innerHTML = `Add`;
    submitBtn.disabled = false;
}

// Function to edit an item by index
async function editItem(id) {
    console.log('editItem');
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
    if(!itemList){
        return
    }
    itemList.innerHTML = ''; // Clear the list

    const itemCount = filteredItems.length; // Get the count of filtered items
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    // Reverse the filtered items to show the newest first
    const itemsToShow = filteredItems.slice().reverse().slice(start, end);

    itemsToShow.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('col-md-6');
        div.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex w-100 justify-content-between gap-2">
                        <h5 class="mb-1 text-truncate title" title="${item.title}">${item.title}</h5>
                        <small class="text-nowrap text-muted small">${item.date}</small>
                    </div>
                    <p class="text-muted small mb-1 authorName">${item.author}</p>
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

    renderPagination(); // Update pagination controls
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

// Pagination control functions
function prevPage() {
    loader.classList.remove('d-none'); // Show the loader
    if (currentPage > 1) {
        currentPage--;
        displayItems();
        loader.classList.add('d-none'); // hide the loader
    }
}

function nextPage() {
    loader.classList.remove('d-none'); // Show the loader
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayItems();
        loader.classList.add('d-none'); // hide the loader
    }
}

function goToPage(page) {
    loader.classList.remove('d-none'); // Show the loader
    currentPage = page;
    displayItems();
    loader.classList.add('d-none'); // hide the loader
}

// Search functionality
function searchItems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    fetchItems().then((items) => {
        filteredItems = items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.author.toLowerCase().includes(query)
        );
        currentPage = 1; // Reset to first page on new search
        displayItems();
    });
}



// Initialize data on page load
async function init() {
    const items = await fetchItems();
    filteredItems = items; // Initialize with all non-deleted items
    displayItems(); // Display paginated items
}

// Call the initialization function on window load
window.onload = init;

function toggleDescription(button) {
    const description = button.closest('.card').querySelector('.description');
    description.classList.toggle("show_full_text");
    button.textContent = description.classList.contains("show_full_text") ? "Read Less" : "Read More";
}


// Function to implement infinite scrolling
async function loadQuotesOnScroll() {
    const quotesContainer = document.getElementById('quotes'); // Ensure a container with ID 'quotes' exists in the HTML
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
                        <p class="text-primary small mb-1 fst-italic authorName">${item.author}</p>
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
