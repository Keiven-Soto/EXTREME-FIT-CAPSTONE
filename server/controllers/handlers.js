// handlers.js

// In-memory array to store items
let items = [];

// GET all items
const getItems = (req, res) => {
  res.json(items);
};

// Get By ID
const getItemById = (req, res) => {
  const { id } = req.params;
  const item = items.find(i => i.id === parseInt(id));

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
};


// POST a new item
const postItem = (req, res) => {
  // Safely destructure from req.body
  const { name, description } = req.body || {};

  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Create new item
  const newItem = {
    id: items.length + 1, // simple incremental ID
    name,
    description: description || ''
  };

  items.push(newItem);

  res.status(201).json(newItem);
};

// UPDATE an item by ID
const updateItem = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};

  const item = items.find(i => i.id === parseInt(id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (name) item.name = name;
  if (description) item.description = description;

  res.json(item);
};

// DELETE an item by ID
const deleteItem = (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(i => i.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const deletedItem = items.splice(index, 1);
  res.json(deletedItem[0]);
};

module.exports = { getItems,getItemById, postItem, updateItem, deleteItem };
