import * as moment from '../node_modules/moment/moment';
import * as _ from 'lodash'

/**
 * Register the initilize function when the DOM has finished loading
 */
document.addEventListener('DOMContentLoaded', initialize);

interface UserSettings {
  filter: HistoryFilter;
}

interface HistoryFilter {
  since: string;
}

enum TicketAction {
  detail = "Detail",
  edit = "Edit",
  update = "Update"
}

interface TicketSummary {
  id: number;
  title: string;
  visitCount: number;
  lastVisitedUnixMS: number;
  lastVisitedDisplay: string;
  tdAppName: string;
  ticketAction: TicketAction;
}

var settings: UserSettings = {
  filter: {
    since: "today"
  }
};

/**
 * Execute steps on the intial load of the page
 */
function initialize(): void {

  // Setup fields that don't depend on saved settings
  let txtSearch = document.getElementById('txtSearch');
  txtSearch.onkeyup = _.debounce(search, 300);
  
  // Setup fields that persist to synced storage and run search
  getSettingsFromStorage((results) => {
    settings = results['filter'];

    let selectSince: HTMLSelectElement = <HTMLSelectElement> document.getElementById('selectSince');
    selectSince.value = settings.filter.since;
    selectSince.onchange = (event: Event) => {

      let selectSince: HTMLSelectElement = <HTMLSelectElement>event.target;

      settings.filter.since = selectSince.value;
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
function search(): void {

  let selectSince: HTMLSelectElement = <HTMLSelectElement>document.getElementById('selectSince');
  let txtSearch: HTMLInputElement = <HTMLInputElement>document.getElementById('txtSearch');

  let historySearchQuery = buildTicketSearchObject(selectSince.value);

  searchHistoryForTickets(historySearchQuery, txtSearch.value);

}

/**
 * Build the chrome history search query object
 * https://developer.chrome.com/extensions/history#method-search
 * @param {string} sinceText 
 */
function buildTicketSearchObject(sinceText: string): chrome.history.HistoryQuery {

  let result : chrome.history.HistoryQuery = {
    text: "tickets/ticketdet"
  }

  let searchMSSinceEpoch : number;

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

  if (searchMSSinceEpoch) {
    result['startTime'] = searchMSSinceEpoch;
  }

  return result;

}

/**
 * Executes the search of chrome history
 * https://developer.chrome.com/extensions/history#method-search
 * @param {object} query 
 */
function searchHistoryForTickets(query: chrome.history.HistoryQuery, searchPhrase: string) {

  chrome.history.search(query, (results) => {

    let filteredResults = _.filter(results, (item) => {
      return filterSearchResults(item, searchPhrase)
    });

    displaySearchResults(filteredResults, searchPhrase);
  });

}

/**
 * Determines whether or not a history item contains the specified 
 * search phrase.
 * @param {object} historyItem 
 * @param {string} searchPhrase 
 */
function filterSearchResults(historyItem: chrome.history.HistoryItem, searchPhrase: string): boolean {

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
function displaySearchResults(historyItems: chrome.history.HistoryItem[], searchPhrase: string) {

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
function renderSearchResultRow(historyItem: chrome.history.HistoryItem): HTMLTableRowElement {
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

  return row;
}

/**
 * Saves settings to sync storage
 * @param {object} settings 
 */
function saveSettings(settings: object) {
  if (settings) {
    chrome.storage.sync.set(settings);
  }
}

/**
 * Gets settings from sync storage and invokes callback upon completion
 * @param {function} callback 
 */
function getSettingsFromStorage(callback: (items: { [key: string]: any; }) => void) {
  chrome.storage.sync.get(settings, callback);
}

function parseTicketPageTitle(pageTitle: string): TicketSummary {
  let result: TicketSummary;

  if (!pageTitle) {
    return null;
  }
  
  let dashIndex: number = pageTitle.indexOf('-');

  if (!dashIndex) {
    return result;
  }

  let classificationAndAction: string[] = pageTitle.substring(0, dashIndex).split(' ');
  result.ticketAction = TicketAction[classificationAndAction[1]];

  return result;
}