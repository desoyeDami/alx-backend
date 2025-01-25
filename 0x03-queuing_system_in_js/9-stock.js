import express from 'express';
import redis, { createClient } from 'redis';
import { promisify } from 'util';

const app = express();

const client = createClient();

client.on('error', (error) => {
  console.log(`Redis client not connected to the server: ${error.message}`);
});

client.on('connect', () => {
  console.log('Redis client connected to the server');
});

const listProducts = [
  {
    itemId: 1,
    itemName: 'Suitcase 250',
    price: 50,
    initialAvailableQuantity: 4,
  },
  {
    itemId: 2,
    itemName: 'Suitcase 450',
    price: 100,
    initialAvailableQuantity: 10,
  },
  {
    itemId: 3,
    itemName: 'Suitcase 650',
    price: 350,
    initialAvailableQuantity: 2,
  },
  {
    itemId: 4,
    itemName: 'Suitcase 1050',
    price: 550,
    initialAvailableQuantity: 5,
  },
];

const PORT = 1245;

const getAsync = promisify(client.get).bind(client);

function getItemById(itemId) {
  return listProducts.find((item) => item.itemId === itemId);
}

function reserveStockById(itemId, stock) {
  stock = stock || getItemById(itemId).initialAvailableQuantity;
  client.set(`item.${itemId}`, stock);
}

async function getCurrentReservedStockById(itemId) {
  const stock = await getAsync(`item.${itemId}`);
  return Number(stock);
}

app.use(express.json());

app.get('/list_products', (req, res) => {
  res.json(listProducts);
});

app.get('/list_products/:itemId', (req, res) => {
  const itemId = Number(req.params.itemId);
  if (isNaN(itemId)) {
    res.status(404).json({ status: 'Product not found' });
  } else {
    const item = getItemById(itemId);
    if (!item) {
      res.status(404).json({ status: 'Product not found' });
    } else {
      res.json({ ...item, currentQuantity: item.initialAvailableQuantity });
    }
  }
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = Number(req.params.itemId);
  const item = getItemById(itemId);
  const currentReservedStock = await getCurrentReservedStockById(itemId);
  if (!item) {
    res.status(404).json({ status: 'Product not found' });
  } else if (item.initialAvailableQuantity <= currentReservedStock) {
    res.status(403).json({ status: 'Not enough stock available', itemId });
  } else {
    reserveStockById(itemId, Number(currentReservedStock) + 1);
    res.json({ status: 'Reservation confirmed', itemId });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
