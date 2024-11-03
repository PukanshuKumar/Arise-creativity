const apiKey = '$2a$10$Pl.97PqwynzEkdLT31QVO.GVmhtDMcsArdEo9w7mV.eTgjqlRI2Qy'; // Replace with your JSONBin API key
const binId = '67276085acd3cb34a8a1c31b'; // Your actual Bin ID

async function fetchItems() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Error fetching items: ${response.statusText}`);
        }

        const data = await response.json();
        // Access the items array inside the data object
        return Array.isArray(data.record.items) ? data.record.items : [];
    } catch (error) {
        console.error(error);
        alert('Failed to fetch items. Check console for details.');
        return []; // Return an empty array on error
    }
}

async function saveData(data) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            },
            body: JSON.stringify({ items: data }) // Wrap data in an object
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

async function deleteData(index) {
    const items = await fetchItems();
    if (Array.isArray(items)) {
        items.splice(index, 1); // Remove item at index
        await saveData(items); // Save updated array
    }
}

async function init() {
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = ''; // Clear the list before populating
    const items = await fetchItems();

    // Ensure items is an array
    if (Array.isArray(items)) {
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.innerHTML = `
                <h5>${item.title}</h5>
                <p>${item.author}</p>
                <p>${item.description}</p>
                <button onclick="editItem(${index})">Edit</button>
                <button onclick="removeItem(${index})">Delete</button>
            `;
            itemList.appendChild(div);
        });
    } else {
        console.warn('Fetched items are not an array:', items);
    }
}

document.getElementById('dataForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('txtTitle').value;
    const author = document.getElementById('txtAuthorName').value;
    const description = document.getElementById('txtDescription').value;

    const items = await fetchItems();
    if (Array.isArray(items)) {
        items.push({ title, author, description }); // Add new item
        await saveData(items); // Save data to JSONBin
        init(); // Refresh item list
        document.getElementById('dataForm').reset(); // Clear form
    } else {
        console.warn('Could not add item, fetched items are not an array:', items);
    }
});

async function removeItem(index) {
    await deleteData(index);
    init(); // Refresh item list
}

let currentEditIndex = null; // Track which item is being edited

async function editItem(index) {
    const items = await fetchItems();
    if (Array.isArray(items)) {
        const item = items[index];
        document.getElementById('txtTitle').value = item.title;
        document.getElementById('txtAuthorName').value = item.author;
        document.getElementById('txtDescription').value = item.description;

        currentEditIndex = index; // Set the current index being edited
    } else {
        console.warn('Could not edit item, fetched items are not an array:', items);
    }
}

// Handle updating the item
document.getElementById('dataForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    if (currentEditIndex !== null) {
        const items = await fetchItems();
        if (Array.isArray(items)) {
            items[currentEditIndex] = {
                title: document.getElementById('txtTitle').value,
                author: document.getElementById('txtAuthorName').value,
                description: document.getElementById('txtDescription').value,
            };
            await saveData(items);
            currentEditIndex = null; // Reset edit index
        }
    } else {
        // Add new item logic
        const title = document.getElementById('txtTitle').value;
        const author = document.getElementById('txtAuthorName').value;
        const description = document.getElementById('txtDescription').value;

        const items = await fetchItems();
        if (Array.isArray(items)) {
            items.push({ title, author, description });
            await saveData(items);
        }
    }

    init(); // Refresh item list
    document.getElementById('dataForm').reset(); // Clear form
});

init(); // Initialize data on page load