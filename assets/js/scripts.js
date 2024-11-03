const apiKey = '$2a$10$Pl.97PqwynzEkdLT31QVO.GVmhtDMcsArdEo9w7mV.eTgjqlRI2Qy'; // Replace with your JSONBin API key
const binId = '67276085acd3cb34a8a1c31b'; // Replace with your JSONBin ID

async function fetchItems() {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': apiKey }
    });
    const data = await response.json();
    return data.record || []; // return an empty array if no data found
}

async function saveData(data) {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function deleteData(index) {
    const items = await fetchItems();
    items.splice(index, 1); // Remove item at index
    await saveData(items); // Save updated array
}

async function init() {
    const itemList = document.getElementById('itemList');
    const items = await fetchItems();

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
}

document.getElementById('dataForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('txtTitle').value;
    const author = document.getElementById('txtAuthorName').value;
    const description = document.getElementById('txtDescription').value;

    const items = await fetchItems();
    items.push({ title, author, description }); // Add new item
    await saveData(items); // Save data to JSONBin
    init(); // Refresh item list
    document.getElementById('dataForm').reset(); // Clear form
});

async function removeItem(index) {
    await deleteData(index);
    init(); // Refresh item list
}

async function editItem(index) {
    const items = await fetchItems();
    const item = items[index];
    document.getElementById('txtTitle').value = item.title;
    document.getElementById('txtAuthorName').value = item.author;
    document.getElementById('txtDescription').value = item.description;

    // When updating, replace the existing item instead of pushing a new one
    const form = document.getElementById('dataForm');
    form.onsubmit = async (event) => {
        event.preventDefault();
        items[index] = {
            title: document.getElementById('txtTitle').value,
            author: document.getElementById('txtAuthorName').value,
            description: document.getElementById('txtDescription').value,
        };
        await saveData(items);
        init();
        form.reset();
    };
}

init(); // Initialize data on page load
