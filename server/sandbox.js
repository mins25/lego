/* eslint-disable no-console, no-process-exit */
const path = require('path');
const fs = require('fs');
const avenuedelabrique = require('./websites/avenuedelabrique');
const dealabs = require('./websites/dealabs');
const vinted = require('./websites/vinted');

const DATA_DIR = path.join('C:', 'Users', 'minse', 'Desktop', 'All', 'webdesign', 'lego', 'server', 'data');

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* === Scraping Vinted avec pagination pour les LEGO Sets === */

// Lecture du fichier AllDeals.json pour extraire les IDs LEGO
let allDeals = [];
try {
  allDeals = JSON.parse(fs.readFileSync('./AllDeals.json', 'utf-8'));
} catch (error) {
  console.error("Erreur lors de la lecture d'AllDeals.json :", error);
}
const allVintedDeals = [];

const Lego_set_ids = allDeals.map(deal => {
  let match = deal.title.match(/\((\d{4,6})\)/);
  if (!match) match = deal.title.match(/\b\d{4,6}\b/);
  return match ? match[1] || match[0] : null;
}).filter(id => id !== null);

console.log("Liste des IDs :", Lego_set_ids);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const seenLinks = new Set(); // Pour éviter les doublons globaux

async function scrapeVintedWithPagination(legoSetId) {
  let currentPage = 1;
  let totalResults = 0;
  const maxPages = 10;

  try {
    while (currentPage <= maxPages) {
      console.log(`Scraping page ${currentPage} pour Lego Set ID: ${legoSetId}...`);
      const deals = await vinted.scrapeWithCookies(legoSetId, currentPage);

      if (deals && deals.length > 0) {
        const uniqueDeals = deals.filter(deal => {
          if (seenLinks.has(deal.link)) return false;
          seenLinks.add(deal.link);
          return true;
        });

        totalResults += uniqueDeals.length;
        allVintedDeals.push(...uniqueDeals);

        fs.writeFileSync(
          `./vinted-${legoSetId}.json`,
          JSON.stringify(uniqueDeals, null, 2),
          'utf-8'
        );

        console.log(`Ajout de ${uniqueDeals.length} nouvelles offres sur la page ${currentPage}`);
      } else {
        console.log(`Plus de résultats à la page ${currentPage}`);
        break;
      }

      currentPage++;
      await delay(1500);
    }

    console.log(`Total des résultats pour ${legoSetId}: ${totalResults}`);
  } catch (error) {
    console.error(`Erreur lors du scraping pour ${legoSetId}:`, error);
  }
}

async function scrapeAllLegoSets() {
  console.log(`Début du scraping de ${Lego_set_ids.length} IDs LEGO...\n`);

  for (const id of Lego_set_ids) {
    console.log(`Scraping pour Lego Set: ${id}`);
    await scrapeVintedWithPagination(id);
    await delay(3000);
  }

  console.log("\nScraping Vinted terminé!");

  if (allVintedDeals.length > 0) {
    fs.writeFileSync(
      './AllVinted.json',
      JSON.stringify(allVintedDeals, null, 2),
      'utf-8'
    );
    console.log(`Sauvegarde de ${allVintedDeals.length} offres uniques dans AllVinted.json`);
  } else {
    console.log("Aucune offre trouvée sur Vinted.");
  }
}

/* === Scraping Avenue de la Brique et Dealabs === */

async function scrapeAvenueDeLaBrique(website) {
  console.log(`🕵️‍♀️  Scraping Avenue de la Brique: ${website}`);
  const deals = await avenuedelabrique.scrape(website);
  const filePath = path.join(DATA_DIR, 'avenue_deals.json');
  fs.writeFileSync(filePath, JSON.stringify(deals, null, 2));
  console.log(`💾 Sauvegardé dans ${filePath}`);
  return deals;
}

async function scrapeDealabs(website = 'https://www.dealabs.com/groupe/lego') {
  console.log(`🕵️‍♀️  Scraping Dealabs: ${website}`);
  const deals = await dealabs.scrape(website);
  const filePath = path.join(DATA_DIR, 'dealabs_deals.json');
  fs.writeFileSync(filePath, JSON.stringify(deals, null, 2));
  console.log(`💾 Sauvegardé dans ${filePath}`);
  return deals;
}

/* === Fonction principale sandbox === */

async function sandbox(website) {
  try {
    if (website?.includes('avenuedelabrique')) {
      await scrapeAvenueDeLaBrique(website);
    } else if (website?.includes('dealabs')) {
      await scrapeDealabs(website);
    } else if (website?.includes('vinted')) {
      await scrapeAllLegoSets();
    } else {
      console.log('⚡ Mode par défaut : Scraping de Avenue de la Brique, Dealabs et Vinted');
      await Promise.all([
        scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/nouveautes-lego'),
        scrapeDealabs(),
        scrapeAllLegoSets()
      ]);
    }

    console.log('✅ Terminé');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur :', e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;
sandbox(eshop);
