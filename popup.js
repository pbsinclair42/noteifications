
function httpGetAsync(url, callback){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() { 
  if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
    callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", url, true); // true for asynchronous 
  xmlHttp.send(null);
}

function getNotifications(response){
  //if (Math.random()>0.5){
  //  date = 1492005340000
  //} else {
    date = 1491962140000
  //}
  items = JSON.parse(response)['items'];
  for (var i=0; i<items.length; i++){
    item = items[i]
    if (Date.parse(item['published']) > date) {
      document.getElementById('notifications').innerHTML = item['title']
      document.getElementById('none').style = "display:none"
    } else {
      break
    }
  }
  document.getElementsByClassName('fa-refresh')[0].classList.remove('fa-spin')
}


function refresh(){
  httpGetAsync(url, getNotifications);
  document.getElementsByClassName('fa-refresh')[0].classList.add("fa-spin");
}

window.onload = function(){

  document.getElementById('refresh').onclick=refresh
  
  url = "https://thesession.org/tunes/27/activity?format=json&perpage=50";
  //refresh()

}