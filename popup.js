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
      newNotifications.push(item['title'])
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
    notification = notifications[i];
    //TODO
    var newNotification = document.createElement('div');
    newNotification.innerHTML = notification;
    newNotification.classList.add(notification.hashCode());
    notificationsUI.insertBefore(newNotification, notificationsUI.firstChild);

    document.getElementById('none').style = "display:none";
  }
}

function addNotifications(notifications){
  storedData.notifications = storedData.notifications.concat(notifications);
  chrome.storage.sync.set({"notifications":storedData.notifications});
  addNotificationsToUI(notifications);
}

function removeNotificationFromUI(notification){
  //TODO
  var toRemove = document.getElementsByClassName(notification.hashCode())[0];
  toRemove.parentNode.removeChild(toRemove);
  if (storedData.notifications.length == 0) {
    document.getElementById('none').style = "display:block";
  }
}

function removeNotification(notification){
  storedData.notifications.splice(storedData.notifications.indexOf(notification), 1);
  chrome.storage.sync.set({"notifications":storedData.notifications});
  removeNotificationFromUI(notification);
}

function removeAllNotifications(){
  document.getElementById('notifications').innerHTML = '';
  document.getElementById('none').style = "display:block";
  storedData.notifications = [];
  chrome.storage.sync.set({'notifications':[]})
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
  });

  url = "https://thesession.org/tunes/27/activity?format=json&perpage=50";

  //refresh()

};
