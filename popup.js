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

function processNotificationsAPI(response, dateChecked){
  var date = storedData.lastTimeChecked;
  var items = JSON.parse(response)['items'];
  var newNotifications = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (Date.parse(item['published']) > date) {
      newNotifications.push({
        'id': (item['title'] + item['published']).hashCode(),
        'text': item['title'],
        'url': item['object']['url']
      });
    } else {
      break;
    }
  }
  //TODO: read more if needed
  addNotifications(newNotifications);
  document.getElementsByClassName('fa-refresh')[0].classList.remove('fa-spin')
  chrome.storage.sync.set({
    'lastTimeChecked': dateChecked
  });
  storedData.lastTimeChecked = dateChecked;
}

function addNotificationsToUI(notifications){
  var notificationsUI = document.getElementById('notifications');
  for (var i = 0; i < notifications.length; i++) {
    var notification = notifications[i];
    var newNotification = document.getElementById('notificationTemplate').cloneNode(true);
    newNotification.id = notification.id;
    newNotification.children[0].innerHTML = notification.text;
    console.log(newNotification);
    console.log(newNotification.children);
    newNotification.children[0].onclick = function(){
      openNotification(this.parentElement.id);
      removeNotification(this.parentElement.id);
    };
    newNotification.children[1].onclick = function(){
      removeNotification(this.parentElement.id);
    };
    newNotification.style = 'display: flex;';
    notificationsUI.insertBefore(newNotification, notificationsUI.firstChild);
  }

  chrome.browserAction.setBadgeText({
    'text': storedData.notifications.length.toString() > 0 ? storedData.notifications.length.toString() : ''
  });
  if (storedData.notifications.length > 0) {
    document.getElementById('none').style = "display:none";
    chrome.browserAction.setIcon({path: "logo.png"});
  } else {
    chrome.browserAction.setIcon({path: "logobw.png"});
  }
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
    chrome.browserAction.setIcon({path: "logobw.png"})
  }
}

function removeNotification(notificationId){
  var index = storedData.notifications.findIndex(function(n, i){
    return n.id == notificationId;
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
  var currentTime = (new Date).getTime().toString();
  httpGetAsync(url, function(response){
    processNotificationsAPI(response, currentTime);
  });
  document.getElementsByClassName('fa-refresh')[0].classList.add("fa-spin");
  setRefreshRate();
}

function setRefreshRate(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, storedData.settings.refreshRateInSeconds * 1000);
}

function setup(){
  currentDate = "1520192045000"; //TODO: change from testing value to current date
  storedData.lastTimeChecked = currentDate;
  chrome.storage.sync.set({
    "lastTimeChecked": currentDate
  })
  //TODO: setup username
}

function openNotification(notificationId){
  console.log(notificationId);
  console.log(storedData.notifications);
  var notification = storedData.notifications.find(function(notification){
    return notification.id == notificationId;
  });
  window.open(notification.url);
}

window.onload = function(){

  document.getElementById('refresh').onclick = refresh;

  url = "https://thesession.org/members/" + userId + "/notifications/tunes?format=json";

  chrome.notifications.onClicked.addListener(function(notificationId){
    openNotification(notificationId);
    removeNotification(notificationId);
    chrome.notifications.clear(notificationId);
  });

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
};
