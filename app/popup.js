/**
 * Register the initilize function when the DOM has finished loading
 */
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Event handler for the select since
 * @param {event} event 
 */
function selectSinceChanged(event) {
  search(event.target.value);
}

/**
 * Execute steps on the intial load of the page
 */
function initialize() {
  let selectSince = document.getElementById('selectSince');
  selectSince.onchange = selectSinceChanged;

  search(selectSince.value);
}

/**
 * Execute the ticket search with search parameters
 * @param {string} sinceText 
 */
function search(sinceText) {

  console.debug('Searching...');

  let historySearchQuery = buildTicketSearchObject(sinceText);

  searchHistoryForTickets(historySearchQuery);

}

/**
 * Build the chrome history search query object
 * https://developer.chrome.com/extensions/history#method-search
 * @param {string} sinceText 
 */
function buildTicketSearchObject(sinceText) {

  let result = {
    text: "tickets/ticketdet"
  }

  switch (sinceText) {
    case 'oneHourAgo':
      searchMSSinceEpoch = moment().valueOf() - 3600000;
      break;
  
    case 'today':
      searchMSSinceEpoch = moment().startOf('day').valueOf();
      break;

    case 'yesterday':
      searchMSSinceEpoch = moment().startOf('day').subtract(1, 'days').valueOf();
      break;

    case 'thisWeek':
      searchMSSinceEpoch = moment().startOf('week').valueOf();
      break;

    case 'thisMonth':
      searchMSSinceEpoch = moment().startOf('month').valueOf();
      break;

    default:
      console.error('since option not supported');
      break;
  }

  if(searchMSSinceEpoch) {
    console.debug((new Date(searchMSSinceEpoch)).toISOString());
    result['startTime'] = searchMSSinceEpoch;
  }

  return result;

}

/**
 * Executes the search of chrome history
 * https://developer.chrome.com/extensions/history#method-search
 * @param {object} query 
 */
function searchHistoryForTickets(query) {

  chrome.history.search(query, displaySearchResults);

}

/**
 * Displays a list of chrome history items on the page.
 * @param {array} historyItems https://developer.chrome.com/extensions/history#type-HistoryItem
 */
function displaySearchResults(historyItems) {

  // Update ticket results summary information
  let spanResultCount = document.getElementById('resultCount');
  spanResultCount.innerHTML = '';
  spanResultCount.appendChild(document.createTextNode(historyItems.length.toString() + ' Ticket(s)'));

  // Grab a reference to the table body and clear the contents
  let tableResultsBody = document.getElementById('tableResultsBody');
  tableResultsBody.innerHTML = '';

  for(let historyItem of historyItems) {
    
    // Build the table row
    let row = document.createElement('tr');

    // Build the visits cell
    let tdVisits = document.createElement('td');
    tdVisits.appendChild(document.createTextNode(historyItem.visitCount.toString()));
    row.appendChild(tdVisits);

    // Build the ticket link cell
    let tdTicket = document.createElement('td');
    let link = document.createElement('a');
    link.setAttribute('href', historyItem.url);
    link.setAttribute('target', '_blank');
    link.appendChild(document.createTextNode(historyItem.title));
    tdTicket.appendChild(link);
    row.appendChild(tdTicket);

    // Build the last visited column
    let tdLastVisit = document.createElement('td');
    let lastVisitText = moment(historyItem.lastVisitTime).fromNow();
    tdLastVisit.appendChild(document.createTextNode(lastVisitText));
    row.appendChild(tdLastVisit);

    // Add the row to the table body
    tableResultsBody.appendChild(row);

  }
  
}