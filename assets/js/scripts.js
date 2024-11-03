const apiKey = '$2a$10$Pl.97PqwynzEkdLT31QVO.GVmhtDMcsArdEo9w7mV.eTgjqlRI2Qy'; // Replace with your JSONBin API key
const binId = '67276085acd3cb34a8a1c31b'; // Your actual Bin ID

// Global variable to track the current edit index
let currentEditIndex = null;

// Function to fetch items from JSONBin
async function fetchItems() {
    console.log('fetchItems');
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Error fetching items: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.record.items) ? data.record.items : [];
    } catch (error) {
        console.error(error);
        alert('Failed to fetch items. Check console for details.');
        return [];
    }
}

// Function to save data back to JSONBin
async function saveData(data) {
    console.log('saveData');

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify({ items: data })
        });

        if (!response.ok) {
            throw new Error(`Error saving data: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error(error);
        alert('Failed to save data. Check console for details.');
    }
}

// Function to delete an item by index
async function deleteData(index) {
    console.log('deleteData');

    const items = await fetchItems();
    if (Array.isArray(items)) {
        items.splice(index, 1);
        await saveData(items);
    }
}

// Function to initialize data on page load
async function init() {
    console.log('init');

    const itemList = document.getElementById('itemList');
    itemList.innerHTML = ''; // Clear the list before populating
    const items = await fetchItems();

    // Ensure items is an array
    if (Array.isArray(items)) {
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.classList.add('list-group-item', 'list-group-item-action');
            div.innerHTML = `
                        <div class="d-flex w-100 justify-content-between gap-2">
                            <h5 class="mb-1 text-truncate title" title="${item.title}">${item.title}</h5>
                            <small class="text-nowrap text-muted small">${item.date}</small>
                        </div>
                        <p class="text-muted small mb-1 authorName">${item.author}</p>
                        <p class="mb-1 description">${item.description}</p>
                        <button class="toggle-btn btn btn-outline-primary btn-sm mt-2" onclick="toggleDescription(this)">Read More</button>
                        <button class="btn btn-outline-secondary btn-sm mt-2" onclick="editItem(${index})">Edit</button>
                        <button class="btn btn-outline-danger btn-sm mt-2" onclick="removeItem(${index})">Delete</button>
                    `;
            itemList.appendChild(div);
        });
    } else {
        console.warn('Fetched items are not an array:', items);
    }
}

// Function to add a new item or update an existing item
async function addItem() {
    console.log('addItem');

    const title = document.getElementById("txtTitle").value;
    const author = document.getElementById("txtAuthorName").value;
    let date = document.getElementById("txtDate").value || new Date().toISOString().split('T')[0]; // Default to today if no date provided
    const description = document.getElementById("txtDescription").value;

    const items = await fetchItems();
    if (Array.isArray(items)) {
        if (currentEditIndex !== null) {
            // Update existing item
            items[currentEditIndex] = { title, author, date, description };
            currentEditIndex = null; // Reset edit index
        } else {
            // Add new item
            items.push({ title, author, date, description });
        }
        await saveData(items);
        init(); // Refresh item list
        document.getElementById('dataForm').reset(); // Clear form
    } else {
        console.warn('Could not add item, fetched items are not an array:', items);
    }
}

// Function to remove an item by index
async function removeItem(index) {
    console.log('removeItem');

    await deleteData(index);
    init(); // Refresh item list
}

// Function to edit an item by index
async function editItem(index) {
    console.log('editItem');

    const items = await fetchItems();
    if (Array.isArray(items)) {
        const item = items[index];
        document.getElementById('txtTitle').value = item.title;
        document.getElementById('txtAuthorName').value = item.author;
        document.getElementById('txtDate').value = item.date;
        document.getElementById('txtDescription').value = item.description;

        currentEditIndex = index; // Set the current index being edited
    } else {
        console.warn('Could not edit item, fetched items are not an array:', items);
    }
}

function toggleDescription(button) {
    console.log('lasdflka');
    const description = button.previousElementSibling;
    description.classList.toggle("show_full_text");
    button.textContent = description.classList.contains("show_full_text") ? "Read Less" : "Read More";
}

// Initialize data on page load
init();