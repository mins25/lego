const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const uri = "mongodb+srv://mins2510:lalala@cluster0.vfmamy2.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    // Chemin vers les fichiers JSON
    const dealsPath = path.join(__dirname, 'AllDeals.json');
    const salesPath = path.join(__dirname, 'AllVinted.json');

    // Lecture et parsing des données
    const dealsData = await fs.readFile(dealsPath, 'utf8');
    const salesData = await fs.readFile(salesPath, 'utf8');
    
    const deals = JSON.parse(dealsData);
    const sales = JSON.parse(salesData);

    const db = client.db(); // Utilise la base de données spécifiée dans l'URI

    // Insertion des deals
    const dealsCollection = db.collection('deals');
    const dealsResult = await dealsCollection.insertMany(deals);
    console.log(`✅ ${dealsResult.insertedCount} deals insérés`);

    // Insertion des ventes dans une collection séparée
    const salesCollection = db.collection('sales');
    const salesResult = await salesCollection.insertMany(sales);
    console.log(`✅ ${salesResult.insertedCount} ventes insérées`);

  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);