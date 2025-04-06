// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 8092;

const uri = "mongodb+srv://mins2510:lalala@cluster0.vfmamy2.mongodb.net/?appName=Cluster0";
let db;

app.use(express.json());

// Connexion DB optimisée
async function connectDB() {
  if (!db) {
    const client = await MongoClient.connect(uri);
    db = client.db();
    await createIndexes();
  }
  return db;
}

async function createIndexes() {
  // Index sur le champ "id" pour les deals et les sales
  await db.collection('deals').createIndex({ id: 1 });
  await db.collection('sales').createIndex({ id: 1 });
  // Index sur la date de publication pour trier les deals si besoin
  await db.collection('deals').createIndex({ published: -1 });
}

/**
 * Pour les deals, on stocke "published" sous forme d'ISO string (ex. "2025-04-06T13:30:17.000Z").
 * On peut comparer ces dates en les convertissant en objet Date.
 */

app.get('/deals/search', async (req, res) => {
  try {
    const database = await connectDB();
    const { 
      limit = 12, 
      price, 
      date, 
      filterBy,
      minDiscount = 0
    } = req.query;

    const query = {
      price: { $lte: Number(price) || Infinity },
      discount: { $gte: Number(minDiscount) }
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.published = { $gte: startDate.toISOString(), $lte: endDate.toISOString() };
    }

    if (filterBy === 'best-discount') {
      query.discount = { ...query.discount, $gte: 30 };
    } else if (filterBy === 'most-commented') {
      query.comments = { $gte: 5 };
    }

    const dealsCollection = database.collection('deals');
    const [results, total] = await Promise.all([
      dealsCollection.find(query)
        .sort({ price: 1 })
        .limit(Math.min(Number(limit), 100))
        .toArray(),
      dealsCollection.countDocuments(query)
    ]);

    res.json({ 
      limit: Number(limit),
      total,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer un deal spécifique par id
app.get('/deals/:id', async (req, res) => {
  try {
    const database = await connectDB();
    const deal = await database.collection('deals').findOne({ id: req.params.id });

    if (!deal) {
      return res.status(404).json({ error: `Deal with id ${req.params.id} not found` });
    }
    
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Pour les sales, la date "published" est au format "DD/MM/YYYY HH:mm:ss".
 * La fonction ci-dessous convertit ce format en timestamp Unix.
 */
function convertVintedDate(dateStr) {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const formatted = `${year}-${month}-${day}T${timePart}`;
  const date = new Date(formatted);
  return Math.floor(date.getTime() / 1000);
}

// GET /sales/search - Recherche de sales
// Paramètres acceptés : limit, legoSetId
// Les résultats sont triés par date (champ published) décroissante
app.get('/sales/search', async (req, res) => {
  try {
    const database = await connectDB();
    const { limit = 12, legoSetId } = req.query;
    
    const query = legoSetId ? { id: legoSetId } : {};
    
    const sales = await database.collection('sales')
      .find(query)
      .sort({ published: -1 })
      .limit(Number(limit))
      .toArray();

    // Formatage des sales : conversion de la date au format timestamp Unix
    const formattedSales = sales.map(sale => ({
      ...sale,
      published: convertVintedDate(sale.published),
      // Le champ "price" reste une chaîne, en remplaçant la virgule par un point si nécessaire
      price: sale.price.replace(',', '.')
    }));

    res.json({
      limit: Number(limit),
      total: formattedSales.length,
      results: formattedSales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
async function startServer() {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch(console.error);
