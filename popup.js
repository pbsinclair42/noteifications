var storedData;
var refreshTimer;
var url; //temp for dev
var userId = '96660';

String.prototype.hashCode = function(){
  //Source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


function httpGetAsync(url, callback){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function(){
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open("GET", url, true); // true for asynchronous
  xmlHttp.send(null);
}

function processNotificationsAPI(response){
  var currentTime = (new Date).getTime().toString();
  chrome.storage.sync.get("lastTimeChecked", function(retrievedData){
      var date = retrievedData.lastTimeChecked;
      var items = JSON.parse(response)['items'];
      var newNotifications = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (Date.parse(item['published']) > date) {
          newNotifications.push({'text': item['title'], 'id': item['title'].hashCode()});
        } else {
          break;
        }
      }
      //TODO: read more if needed
      addNotifications(newNotifications);
      document.getElementsByClassName('fa-refresh')[0].classList.remove('fa-spin')
      chrome.storage.sync.set({
        'lastTimeChecked': currentTime
      });
    }
  );
}

function addNotificationsToUI(notifications){
  var notificationsUI = document.getElementById('notifications');
  for (var i = 0; i < notifications.length; i++) {
    var notification = notifications[i];
    //TODO
    var newNotification = document.getElementById('notificationTemplate').cloneNode(true);
    newNotification.innerHTML = notification.text;
    newNotification.id = notification.id;
    newNotification.onclick = function(){
      removeNotification(this.id);
    };
    newNotification.style = 'display:block;';
    notificationsUI.insertBefore(newNotification, notificationsUI.firstChild);
  }

  chrome.browserAction.setBadgeText({
    'text': storedData.notifications.length.toString() > 0 ? storedData.notifications.length.toString() : ''
  });
  document.getElementById('none').style = "display:none";//TODO
}

function addNotifications(notifications){
  storedData.notifications = storedData.notifications.concat(notifications);
  chrome.storage.sync.set({"notifications": storedData.notifications});
  addNotificationsToUI(notifications);
  for (var i = 0; i < notifications.length; i++) {
    var notification = notifications[i];
    chrome.notifications.create(notification.id.toString(), {
      'type': 'basic',
      'iconUrl': 'icon.png',
      'title': 'New notification',
      'message': notification.text,
      'isClickable': true
    });
  }
}

function removeNotificationFromUI(notificationId){
  var toRemove = document.getElementById(notificationId);
  toRemove.parentNode.removeChild(toRemove);

  chrome.browserAction.setBadgeText({
    'text': storedData.notifications.length.toString() > 0 ? storedData.notifications.length.toString() : ''
  });

  if (storedData.notifications.length === 0) {
    document.getElementById('none').style = "display:block";
  }
}

function removeNotification(notificationId){
  var index = storedData.notifications.findIndex(function(n, i){
    return n.id === notificationId;
  });
  storedData.notifications.splice(index, 1);
  chrome.storage.sync.set({"notifications": storedData.notifications});
  removeNotificationFromUI(notificationId);
}

function removeAllNotifications(){
  document.getElementById('notifications').innerHTML = '';
  document.getElementById('none').style = "display:block";
  storedData.notifications = [];
  chrome.storage.sync.set({'notifications': []});
  chrome.browserAction.setBadgeText({'text': ''});

}

function refresh(){
  httpGetAsync(url, processNotificationsAPI);
  document.getElementsByClassName('fa-refresh')[0].classList.add("fa-spin");
  setRefreshRate();
}

function setRefreshRate(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, storedData.settings.refreshRateInSeconds * 1000);
}

function setup(){
  chrome.storage.sync.set({
    "lastTimeChecked": "1520192045000" //TODO: change from testing value to current date
  })
  //TODO: setup username
}

window.onload = function(){

  document.getElementById('refresh').onclick = refresh;
  chrome.storage.sync.get({
    "notifications": [],
    "settings": {
      "notificationsPerPage": -1,
      "refreshRateInSeconds": 300,
      "username": null
    }
  }, function(retrievedData){
    storedData = retrievedData;
    if (storedData.settings.username === null) {
      setup();
    }
    addNotificationsToUI(storedData.notifications);
    setRefreshRate();
  });

  url = "https://thesession.org/members/" + userId + "/notifications/tunes?format=json";

  chrome.notifications.onClicked.addListener(function(notificationId){
    //TODO: open the page
    removeNotification(notificationId);
    chrome.notifications.clear(notificationId);
  })
};
