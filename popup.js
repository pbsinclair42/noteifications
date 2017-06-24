var storedData;
var refreshTimer;
var url; //temp for dev

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
  //TODO
  //if (Math.random()>0.5){
  //  date = 1492005340000
  //} else {
  var date = 1491973240000;
  //}
  var items = JSON.parse(response)['items'];
  var newNotifications = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (Date.parse(item['published']) > date) {
      newNotifications.push({'text':item['title'], 'id':item['title'].hashCode()});
    } else {
      break
    }
  }
  addNotifications(newNotifications);
  document.getElementsByClassName('fa-refresh')[0].classList.remove('fa-spin')
}

function addNotificationsToUI(notifications){
  var notificationsUI = document.getElementById('notifications');
  for (var i = 0; i < notifications.length; i++) {
    var notification = notifications[i];
    //TODO
    var newNotification = document.createElement('div');
    newNotification.innerHTML = notification.text;
    newNotification.id = notification.id;
    newNotification.onclick = function(){
      removeNotification(this.id);
    };
    notificationsUI.insertBefore(newNotification, notificationsUI.firstChild);

    chrome.browserAction.setBadgeText({'text':storedData.notifications.length.toString()});

    document.getElementById('none').style = "display:none";
  }
}

function addNotifications(notifications){
  storedData.notifications = storedData.notifications.concat(notifications);
  chrome.storage.sync.set({"notifications":storedData.notifications});
  addNotificationsToUI(notifications);
}

function removeNotificationFromUI(notificationId){
  var toRemove = document.getElementById(notificationId);
  toRemove.parentNode.removeChild(toRemove);

  chrome.browserAction.setBadgeText({
    'text':storedData.notifications.length.toString() > 0 ? storedData.notifications.length.toString() : ''
  });

  if (storedData.notifications.length == 0) {
    document.getElementById('none').style = "display:block";
  }
}

function removeNotification(notificationId){
  var index = storedData.notifications.findIndex(function(n, i){
    return n.id == notificationId;
  });
  storedData.notifications.splice(index, 1);
  chrome.storage.sync.set({"notifications":storedData.notifications});
  removeNotificationFromUI(notificationId);
}

function removeAllNotifications(){
  document.getElementById('notifications').innerHTML = '';
  document.getElementById('none').style = "display:block";
  storedData.notifications = [];
  chrome.storage.sync.set({'notifications':[]});
  chrome.browserAction.setBadgeText({'text':''});

}

function refresh(){
  httpGetAsync(url, processNotificationsAPI);
  document.getElementsByClassName('fa-refresh')[0].classList.add("fa-spin");
}

function setRefreshRate(){
  clearInterval(refreshTimer);
  refreshTimer = setInterval(refresh, storedData.settings.refreshRateInSeconds * 1000);
}

window.onload = function(){

  document.getElementById('refresh').onclick = refresh;

  chrome.storage.sync.get({
    "notifications":[],
    "settings":{
      "notificationsPerPage":5,
      "refreshRateInSeconds":60,
      "username":null
    }
  }, function(retrievedData){
    storedData = retrievedData;
    if (storedData.settings.username === null) {
      // setup()
    }
    addNotificationsToUI(storedData.notifications);
    setRefreshRate();
  });

  url = "https://thesession.org/tunes/27/activity?format=json&perpage=50";

  //refresh()

};
