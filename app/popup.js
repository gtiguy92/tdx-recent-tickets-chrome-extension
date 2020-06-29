/**
 * Register the initilize function when the DOM has finished loading
 */
document.addEventListener('DOMContentLoaded', initialize);

var settings = {
  filter: {
    sinceHoursAgo: "24"
  }
}

/**
 * Execute steps on the intial load of the page
 */
function initialize() {

  // Setup fields that don't depend on saved settings
  let txtSearch = document.getElementById('txtSearch');
  txtSearch.onkeyup = _.debounce(search, 300);
  
  // Setup fields that persist to synced storage and run search
  getSettingsFromStorage((results) => {
    settings = results;

    let selectSince = document.getElementById('selectSince');
    selectSince.value = settings.filter.sinceHoursAgo;
    selectSince.onchange = (event) => {

      settings.filter.sinceHoursAgo = event.target.value;
      saveSettings(settings);
      search();

    }; 

    search();
  });
  
}

/**
 * Execute the ticket search with search parameters
 * @param {string} sinceText 
 */
function search() {

  let selectSince = document.getElementById('selectSince');
  let txtSearch = document.getElementById('txtSearch');

  let historySearchQuery = buildTicketSearchObject(selectSince.value);

  searchHistoryForTickets(historySearchQuery, txtSearch.value);

}

/**
 * Build the chrome history search query object
 * https://developer.chrome.com/extensions/history#method-search
 * @param {string} hoursAgo 
 */
function buildTicketSearchObject(hoursAgo) {

  let result = {
    text: "tickets/ticketdet"
  }

  let hoursToMsConversion = 3600000;

  result['startTime'] = moment().valueOf() - (hoursAgo * hoursToMsConversion);

  return result;

}

/**
 * Executes the search of chrome history
 * https://developer.chrome.com/extensions/history#method-search
 * @param {object} query 
 */
function searchHistoryForTickets(query, searchPhrase) {

  chrome.history.search(query, (results) => {

    let filteredResults = _.filter(results, (item) => {
      return filterSearchResults(item, searchPhrase)
    });

    displaySearchResults(filteredResults);
  });

}

/**
 * Determines whether or not a history item contains the specified 
 * search phrase.
 * @param {object} historyItem 
 * @param {string} searchPhrase 
 */
function filterSearchResults(historyItem, searchPhrase) {

  if (!searchPhrase) {
    return true;
  } else {
    return historyItem.title.toLowerCase().includes(searchPhrase.toLowerCase());
  }
  
}

/**
 * Displays a list of chrome history items on the page.
 * @param {array} historyItems https://developer.chrome.com/extensions/history#type-HistoryItem
 */
function displaySearchResults(historyItems, searchPhrase) {

  // Update ticket results summary information
  let spanResultCount = document.getElementById('resultCount');
  spanResultCount.innerHTML = '';
  spanResultCount.appendChild(document.createTextNode(historyItems.length.toString() + ' Ticket(s)'));

  // Grab a reference to the table body and clear the contents
  let tableResultsBody = document.getElementById('tableResultsBody');
  tableResultsBody.innerHTML = '';

  for(let historyItem of historyItems) {
    
    // Add the row to the table body
    tableResultsBody.appendChild(renderSearchResultRow(historyItem));

  }
  
}

/**
 * Renders the HTML for the supplied search result
 * @param {object} historyItem 
 */
function renderSearchResultRow(historyItem) {
  // Build the table row
  let row = document.createElement('tr');

  // Build the ticket link cell
  let tdTicket = document.createElement('td');
  let link = document.createElement('a');
  link.setAttribute('href', historyItem.url);
  link.setAttribute('target', '_blank');
  link.appendChild(document.createTextNode(historyItem.title));
  tdTicket.appendChild(link);
  row.appendChild(tdTicket);

  // Build the visits cell
  let tdVisits = document.createElement('td');
  tdVisits.appendChild(document.createTextNode(historyItem.visitCount.toString()));
  row.appendChild(tdVisits);

  // Build the last visited column
  let tdLastVisit = document.createElement('td');
  let lastVisitText = moment(historyItem.lastVisitTime).fromNow();
  tdLastVisit.appendChild(document.createTextNode(lastVisitText));
  row.appendChild(tdLastVisit);

  return row;
}

function saveSettings(settings) {
  if (settings) {
    chrome.storage.sync.set(settings);
  }
}

function getSettingsFromStorage(callback) {
  chrome.storage.sync.get(settings, callback);
}