'use strict';

// Global variables pour les deals Dealabs
let allDeals = [];      // Tous les deals récupérés de l'API Dealabs
let currentDeals = [];  // Deals affichés sur la page courante
let currentPagination = { currentPage: 1, pageCount: 1, count: 0 };

// Global variables pour les deals Vinted
let allVintedDeals = [];
let currentVintedDeals = [];
let currentVintedPagination = { currentPage: 1, pageCount: 1, count: 0 };

// Sélecteurs pour les deals Dealabs
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const filterBestDiscount = document.querySelector('#filter-best-discount');
const filterMostCommented = document.querySelector('#filter-most-commented');
const filterHotDeals = document.querySelector('#filter-hot-deals');
const selectSort = document.querySelector('#sort-select');

// Sélecteurs pour les deals Vinted
const selectVintedSetId = document.querySelector('#vinted-set-id-select');
const selectVintedShow = document.querySelector('#vinted-show-select');
const selectVintedPage = document.querySelector('#vinted-page-select');
const selectVintedSort = document.querySelector('#vinted-sort-select');
const vintedDealsSection = document.querySelector('#vinted-deals-list');

// Sélecteurs pour les indicateurs Vinted (Features 8, 9 et 10)
const spanVintedTotalSales = document.querySelector('#vinted-total-sales');
const spanVintedAveragePrice = document.querySelector('#vinted-average-price');
const spanVintedP5Price = document.querySelector('#vinted-p5-price');
const spanVintedP25Price = document.querySelector('#vinted-p25-price');
const spanVintedP50Price = document.querySelector('#vinted-p50-price');
const spanVintedLifetime = document.querySelector('#vinted-lifetime');

/**
 * Définit les valeurs globales pour les deals Dealabs
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Définit les valeurs globales pour les deals Vinted
 */
const setCurrentVintedDeals = ({ result, meta }) => {
  currentVintedDeals = result;
  currentVintedPagination = meta;
};

/**
 * Récupère tous les deals depuis l'API Dealabs
 */
const fetchAllDeals = async () => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/deals?page=1&size=1000`);
    const body = await response.json();
    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }
    allDeals = body.data.result;
    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Récupère les deals Vinted pour un set donné
 */
const fetchVintedDeals = async (legoSetId) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${legoSetId}`);
    const body = await response.json();
    return body.success ? body.data.result : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Valide et convertit une date
 */
const parseDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Affiche la liste des deals Dealabs
 * (Affiche l'ID, le titre, le prix, le discount, les commentaires, la température et la date)
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals.map(deal => {
    const date = parseDate(deal.date);
    const formattedDate = date ? date.toLocaleDateString() : 'N/A';
    return `
      <div class="deal" id="${deal.uuid}">
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
        <span>Discount: ${deal.discount}%</span>
        <span>Comments: ${deal.comments}</span>
        <span>Temperature: ${deal.temperature}</span>
        <span>Date: ${formattedDate}</span>
      </div>
    `;
  }).join('');
  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '';
  sectionDeals.appendChild(fragment);
};

/**
 * Affiche la liste des deals Vinted
 * (Affiche uniquement l'ID du set, le titre avec lien, le prix et la date)
 */
const renderVintedDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals.map(deal => {
    const date = parseDate(deal.date);
    const formattedDate = date ? date.toLocaleDateString() : 'N/A';
    return `
      <div class="vinted-deal" id="${deal.uuid}">
        <span>Set ID: ${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>Price: ${deal.price}</span>
        <span>Date: ${formattedDate}</span>
      </div>
    `;
  }).join('');
  div.innerHTML = template;
  fragment.appendChild(div);
  vintedDealsSection.innerHTML = '';
  vintedDealsSection.appendChild(fragment);
};

/**
 * Affiche le sélecteur de pagination pour Dealabs
 */
const renderPagination = pagination => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from({ length: pageCount }, (v, index) => 
    `<option value="${index + 1}">${index + 1}</option>`
  ).join('');
  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Affiche le sélecteur de pagination pour Vinted
 */
const renderVintedPagination = pagination => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from({ length: pageCount }, (v, index) => 
    `<option value="${index + 1}">${index + 1}</option>`
  ).join('');
  selectVintedPage.innerHTML = options;
  selectVintedPage.selectedIndex = currentPage - 1;
};

/**
 * Remplit le sélecteur d'IDs de set pour les deux sections
 */
const renderLegoSetIds = deals => {
  const ids = [...new Set(deals.map(deal => deal.id))];
  const options = ids.map(id => `<option value="${id}">${id}</option>`).join('');
  const oldSelect = document.querySelector('#lego-set-id-select');
  if (oldSelect) {
    oldSelect.innerHTML = options;
  }
  selectVintedSetId.innerHTML = options;
};

/**
 * Affiche les indicateurs pour Dealabs (seul le nombre de deals)
 */
const renderIndicators = pagination => {
  const { count } = pagination;
  spanNbDeals.textContent = count;
};

/**
 * Pagination des deals
 */
const paginateDeals = (deals, page, size) => deals.slice((page - 1) * size, (page - 1) * size + size);

/**
 * Pagination des deals Vinted
 */
const paginateVintedDeals = (deals, page, size) => deals.slice((page - 1) * size, (page - 1) * size + size);

/**
 * Fonctions de filtrage pour Dealabs
 */
const filterByBestDiscount = deals => deals.filter(deal => deal.discount > 50);
const filterByMostCommented = deals => deals.filter(deal => deal.comments > 15);
const filterByHotDeals = deals => deals.filter(deal => deal.temperature > 100);

/**
 * Fonctions de tri pour Dealabs
 */
const sortByPrice = (deals, order) => deals.sort((a, b) => order === 'asc'
  ? parseFloat(a.price) - parseFloat(b.price)
  : parseFloat(b.price) - parseFloat(a.price)
);
const sortByDate = (deals, order) => deals.sort((a, b) => order === 'asc'
  ? (parseDate(a.date) || new Date(0)) - (parseDate(b.date) || new Date(0))
  : (parseDate(b.date) || new Date(0)) - (parseDate(a.date) || new Date(0))
);

/**
 * Applique les filtres actifs sur Dealabs
 */
const applyFilters = deals => {
  let filteredDeals = [...deals];
  if (filterBestDiscount.checked) filteredDeals = filterByBestDiscount(filteredDeals);
  if (filterMostCommented.checked) filteredDeals = filterByMostCommented(filteredDeals);
  if (filterHotDeals.checked) filteredDeals = filterByHotDeals(filteredDeals);
  return filteredDeals;
};

/**
 * Applique le tri sur Dealabs
 */
const applySorting = deals => {
  const sortValue = selectSort.value;
  switch (sortValue) {
    case 'price-asc': return sortByPrice(deals, 'asc');
    case 'price-desc': return sortByPrice(deals, 'desc');
    case 'date-asc': return sortByDate(deals, 'asc');
    case 'date-desc': return sortByDate(deals, 'desc');
    default: return deals;
  }
};

/**
 * Met à jour les indicateurs Vinted (Total des ventes, prix moyen, percentiles, Lifetime)
 */
const updateVintedIndicators = deals => {
  const totalSales = deals.length;
  let average = 0, p5 = 0, p25 = 0, p50 = 0, lifetime = 0;
  if (totalSales > 0) {
    const prices = deals.map(deal => parseFloat(deal.price)).filter(price => !isNaN(price)).sort((a, b) => a - b);
    const sum = prices.reduce((acc, price) => acc + price, 0);
    average = (sum / prices.length).toFixed(2);
    const getPercentile = (arr, p) => {
      const index = Math.floor(p * (arr.length - 1));
      return arr[index].toFixed(2);
    };
    p5 = getPercentile(prices, 0.05);
    p25 = getPercentile(prices, 0.25);
    p50 = getPercentile(prices, 0.50);
    
    const dates = deals.map(deal => parseDate(deal.date)).filter(date => date !== null);
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      lifetime = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
    }
  }
  spanVintedTotalSales.textContent = totalSales;
  spanVintedAveragePrice.textContent = average;
  spanVintedP5Price.textContent = p5;
  spanVintedP25Price.textContent = p25;
  spanVintedP50Price.textContent = p50;
  spanVintedLifetime.textContent = lifetime + ' days';
};

/**
 * Rend les deals Dealabs avec filtres, tri et pagination
 */
const render = async () => {
  let filteredDeals = applyFilters(allDeals);
  filteredDeals = applySorting(filteredDeals);

  const pageSize = parseInt(selectShow.value);
  const totalPages = Math.ceil(filteredDeals.length / pageSize);
  const currentPage = Math.min(currentPagination.currentPage, totalPages) || 1;
  const paginatedDeals = paginateDeals(filteredDeals, currentPage, pageSize);
  const updatedPagination = { currentPage, pageCount: totalPages, count: filteredDeals.length };

  renderDeals(paginatedDeals);
  renderPagination(updatedPagination);
  renderIndicators(updatedPagination);
  renderLegoSetIds(filteredDeals);

  setCurrentDeals({ result: paginatedDeals, meta: updatedPagination });
};

/**
 * Rend la section Vinted avec tri, pagination et mise à jour des indicateurs
 */
const renderVintedSection = async () => {
  const selectedLegoSetId = selectVintedSetId.value;
  if (selectedLegoSetId) {
    let vintedDeals = await fetchVintedDeals(selectedLegoSetId);
    allVintedDeals = vintedDeals;
    
    updateVintedIndicators(allVintedDeals);
    
    const sortValue = selectVintedSort.value;
    switch (sortValue) {
      case 'price-asc': 
        vintedDeals.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        vintedDeals.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'date-asc':
        vintedDeals.sort((a, b) => (parseDate(a.date) || new Date(0)) - (parseDate(b.date) || new Date(0)));
        break;
      case 'date-desc':
        vintedDeals.sort((a, b) => (parseDate(b.date) || new Date(0)) - (parseDate(a.date) || new Date(0)));
        break;
      default:
        break;
    }
    
    const pageSize = parseInt(selectVintedShow.value);
    const totalPages = Math.ceil(vintedDeals.length / pageSize);
    const currentPage = (currentVintedPagination.currentPage && currentVintedPagination.currentPage <= totalPages)
      ? currentVintedPagination.currentPage : 1;
    const paginatedVintedDeals = paginateVintedDeals(vintedDeals, currentPage, pageSize);
    const updatedVintedPagination = { currentPage, pageCount: totalPages, count: vintedDeals.length };
    
    renderVintedDeals(paginatedVintedDeals);
    renderVintedPagination(updatedVintedPagination);
    
    setCurrentVintedDeals({ result: paginatedVintedDeals, meta: updatedVintedPagination });
  } else {
    vintedDealsSection.innerHTML = '';
  }
};

// Événements pour Dealabs
selectShow.addEventListener('change', () => render());
selectPage.addEventListener('change', e => {
  currentPagination.currentPage = parseInt(e.target.value);
  render();
});
[filterBestDiscount, filterMostCommented, filterHotDeals].forEach(filter => {
  filter.addEventListener('change', () => {
    currentPagination.currentPage = 1;
    render();
  });
});
selectSort.addEventListener('change', () => {
  currentPagination.currentPage = 1;
  render();
});

// Événements pour Vinted
selectVintedSetId.addEventListener('change', () => {
  currentVintedPagination.currentPage = 1;
  renderVintedSection();
});
selectVintedShow.addEventListener('change', () => {
  currentVintedPagination.currentPage = 1;
  renderVintedSection();
});
selectVintedPage.addEventListener('change', e => {
  currentVintedPagination.currentPage = parseInt(e.target.value);
  renderVintedSection();
});
selectVintedSort.addEventListener('change', () => {
  currentVintedPagination.currentPage = 1;
  renderVintedSection();
});

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchAllDeals();
  setCurrentDeals(data);
  render();
  renderVintedSection();
});
