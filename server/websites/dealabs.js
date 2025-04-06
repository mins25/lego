const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Parse HTML data to extract deals
 * @param {String} data - HTML content
 * @returns {Array} Filtered deals array
 */
const parse = (data) => {
  const $ = cheerio.load(data, { 'xmlMode': true });

  const deals = $('div.js-threadList article')
    .map((i, element) => {
      const link = $(element).find('a[data-t="threadLink"]').attr('href');
      const vueData = JSON.parse($(element).find('div.js-vue2').attr('data-vue2'));
      const thread = vueData.props.thread || {};

      // Extraction des données
      const retail = thread.nextBestPrice || null;
      const price = thread.price || null;
      const discount = price && retail ? Math.round((1 - price / retail) * 100) : null;
      const temperature = +thread.temperature || 0;
      const image = thread.mainImage ? `https://static-pepper.dealabs.com/threads/raw/${thread.mainImage.slotId}/${thread.mainImage.name}/re/300x300/qt/60/${thread.mainImage.name}.${thread.mainImage.ext}` : null;
      const comments = +thread.commentCount || 0;
      const published = new Date(thread.publishedAt * 1000);
      const title = thread.title || 'Sans titre';
      const id = thread.threadId ? thread.threadId.toString() : null;

      return {
        id,
        title,
        price,
        retail,
        discount,
        temperature,
        image,
        comments,
        published,
        link: link ? `https://dealabs.com${link}` : null
      };
    })
    .get();

  // Filtrage des deals avec ID valide
  return deals.filter(deal => /^\d{5,}$/.test(deal.id));
};

/**
 * Scrape une page Dealabs
 * @param {String} url - URL à scraper
 * @returns {Promise<Array|null>} Liste des deals
 */
module.exports.scrape = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9'
      }
    });

    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    return parse(await response.text());
  } catch (error) {
    console.error(`Échec du scraping: ${error.message}`);
    return null;
  }
};