const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://mins2510:lalala@cluster0.vfmamy2.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);
const legoSetId = '42156'; // ID spécifique à rechercher

async function findBestDiscountDeals() {
  const collection = client.db().collection('deals');
  return await collection.find()
    .sort({ discount: -1 })
    .limit(20)
    .toArray();
}

async function findMostCommentedDeals() {
  const collection = client.db().collection('deals');
  return await collection.find()
    .sort({ comments: -1 })
    .limit(20)
    .toArray();
}

async function findDealsSortedByPrice() {
  const collection = client.db().collection('deals');
  return await collection.find()
    .sort({ price: 1 })
    .toArray();
}

async function findDealsSortedByDate() {
  const collection = client.db().collection('deals');
  return await collection.find()
    .sort({ published: -1 })
    .toArray();
}

async function findSalesBySetId(setId) {
  const collection = client.db().collection('sales');
  return await collection.find({ id: setId }).toArray();
}

async function findRecentSales() {
  const collection = client.db().collection('sales');
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  return await collection.aggregate([
    {
      $addFields: {
        convertedDate: {
          $dateFromString: {
            dateString: "$published",
            format: "%d/%m/%Y %H:%M:%S"
          }
        }
      }
    },
    {
      $match: {
        convertedDate: { $gte: threeWeeksAgo }
      }
    }
  ]).toArray();
}

async function run() {
  try {
    await client.connect();

    // 1. Meilleures promos
    const bestDeals = await findBestDiscountDeals();
    console.log('Top 20 des meilleures promos:', bestDeals);

    // 2. Deals les plus commentés
    const popularDeals = await findMostCommentedDeals();
    console.log('Deals populaires:', popularDeals);

    // 3. Tri par prix
    const sortedByPrice = await findDealsSortedByPrice();
    console.log('Deals triés par prix:', sortedByPrice);

    // 4. Tri par date
    const sortedByDate = await findDealsSortedByDate();
    console.log('Deals récents:', sortedByDate);

    // 5. Recherche par ID Lego
    const setSales = await findSalesBySetId(legoSetId);
    console.log(`Ventes pour le set ${legoSetId}:`, setSales);

    // 6. Ventes récentes
    const recentSales = await findRecentSales();
    console.log('Ventes des 3 dernières semaines:', recentSales);

  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);