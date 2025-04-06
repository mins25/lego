const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { v5: uuidv5 } = require('uuid');
const fs = require('fs');

const getCSRFTokenAndCookies = async () => {
  try {
    const response = await fetch('https://www.vinted.fr', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    const cookies = response.headers.raw()['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
    const html = await response.text();
    const $ = cheerio.load(html);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');

    return { cookies, csrfToken };
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
};

const scrapeWithCookies = async (searchText, page = 1) => {
  try {
    const authData = await getCSRFTokenAndCookies();
    if (!authData) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const apiUrl = `https://www.vinted.fr/api/v2/catalog/items?page=${page}&per_page=96&time=${currentTime}&search_text=${encodeURIComponent(searchText)}`;

    const response = await fetch(apiUrl, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "fr",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-token": authData.csrfToken,
        "x-money-object": "true",
        "cookie": authData.cookies,
        "Referer": `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(searchText)}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (response.ok) {
      const body = await response.json();
      const salesVint = parseJSON(body, searchText);
      return salesVint;
    }
    
    console.error('API Error:', response.status, response.statusText);
    return null;
  } catch (error) {
    console.error('Request Error:', error);
    return null;
  }
};

// Parse les résultats JSON Vinted
const parseJSON = (data, IdLego) => {
  try {
    const { items } = data;
    const seenLinks = new Set();

    const filtered = items
      .filter(item => item.brand_title === 'LEGO')
      .filter(item => {
        const link = item.url;
        if (seenLinks.has(link)) return false;
        seenLinks.add(link);
        return true;
      })
      .map(item => {
        return {
          link: item.url,
          price: item.total_item_price.amount,
          title: item.title,
          published: formatTimestamp(item.photo?.high_resolution?.timestamp || Date.now()),
          status: item.status,
          id: IdLego,
          brand: item.brand_title,
        };
      });

    return filtered;
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    return [];
  }
};

// Formate un timestamp en date lisible
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

module.exports = {
  scrapeWithCookies
};