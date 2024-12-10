import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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

// Add Item
async function addItem() {
  const description = document.getElementById('txtDescription').value;
  const authorName = document.getElementById('txtAuthorName').value;
  const date = document.getElementById('txtDate').value;
  const title = document.getElementById('txtTitle').value;

  if (!title || !description) {
    alert("Title and Description are required!");
    return;
  }

  try {
    await addDoc(collection(db, "items"), {
      description,
      authorName,
      date,
      title
    });
    alert("Item added successfully!");
    fetchItems(); // Refresh items
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}
window.addItem = addItem;

// Fetch Items
async function fetchItems() {
  const querySnapshot = await getDocs(collection(db, "items"));
  const itemList = document.getElementById('itemList');
  itemList.innerHTML = '';

  querySnapshot.forEach((doc) => {
    const item = doc.data();
    const itemElement = `
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${item.title}</h5>
            <p class="card-text">${item.description}</p>
            <p><small>${item.authorName} - ${item.date}</small></p>
            <button class="btn btn-primary btn-sm" onclick="editItem('${doc.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('${doc.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    itemList.insertAdjacentHTML('beforeend', itemElement);
  });
}
window.fetchItems = fetchItems;

// Delete Item
async function deleteItem(itemId) {
  try {
    await deleteDoc(doc(db, "items", itemId));
    alert("Item deleted successfully!");
    fetchItems(); // Refresh the items list after deletion
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
}
window.deleteItem = deleteItem;

// Edit Item
async function editItem(itemId) {
  const itemDoc = doc(db, "items", itemId);
  const form = document.getElementById('dataForm');

  try {
    const itemData = (await getDoc(itemDoc)).data();
    if (!itemData) {
      alert("Item not found!");
      return;
    }

    document.getElementById('txtDescription').value = itemData.description;
    document.getElementById('txtAuthorName').value = itemData.authorName;
    document.getElementById('txtDate').value = itemData.date;
    document.getElementById('txtTitle').value = itemData.title;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = "Update";
    submitBtn.onclick = async function () {
      const updatedDescription = document.getElementById('txtDescription').value;
      const updatedAuthorName = document.getElementById('txtAuthorName').value;
      const updatedDate = document.getElementById('txtDate').value;
      const updatedTitle = document.getElementById('txtTitle').value;

      if (!updatedTitle || !updatedDescription) {
        alert("Title and Description are required!");
        return;
      }

      try {
        await updateDoc(itemDoc, {
          description: updatedDescription,
          authorName: updatedAuthorName,
          date: updatedDate,
          title: updatedTitle
        });
        alert("Item updated successfully!");
        form.reset();
        submitBtn.textContent = "Add";
        submitBtn.onclick = addItem;
        fetchItems();
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    };
  } catch (error) {
    console.error("Error fetching document: ", error);
  }
}
window.editItem = editItem;

window.onload = fetchItems;