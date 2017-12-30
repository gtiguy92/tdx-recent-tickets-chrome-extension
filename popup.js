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

  let now = new Date();
  let todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  let yesterdayAtMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);

  let nowMSSinceEpoch = now.getTime();
  let searchMSSinceEpoch = 0;

  switch (sinceText) {
    case 'oneHourAgo':
      searchMSSinceEpoch = nowMSSinceEpoch - 3600000;
      break;
  
    case 'today':
      searchMSSinceEpoch = todayAtMidnight.getTime();
      break;

    case 'yesterday':
      searchMSSinceEpoch = yesterdayAtMidnight.getTime();
      break;

    default:
      console.error('since option not yet supported');
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

  let spanResultCount = document.getElementById('resultCount');
  spanResultCount.innerHTML = '';
  spanResultCount.appendChild(document.createTextNode(historyItems.length.toString() + ' Ticket(s)'));

  let ul = document.getElementById('listResults');
  ul.innerHTML = '';

  for(let historyItem of historyItems) {
    
    let link = document.createElement('a');
    link.setAttribute('href', historyItem.url);
    link.setAttribute('target', '_blank');
    link.appendChild(document.createTextNode(historyItem.visitCount.toString() + ' visit(s) - ' + historyItem.title));

    let li = document.createElement('li');
    li.appendChild(link);

    ul.appendChild(li);

  }
  
}