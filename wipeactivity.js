const wipeActivityURL = '/ws/v19/interaction/activity/mask'



//check for a valid input and confirm
function validateInput(w){
if (isNaN(w) || w == '') {
	writeDIV('infopane', 'Please provide a valid activity ID')
} else {
	writeDIV('infopane', 'Activity ' + w + ' will be completely wiped')
  getActivityData(w)
}}

function getActivityData(id){
  let actionTrigger = egLogin()
  actionTrigger
    .then(() => fetchAPIforData(id))
    .then(() => append2DIV('infopane', 'activity ID: ' + id))
    .then(() => egLogout())


}

function fetchAPIforData(n){
  return new Promise(function(resolve, reject) {
    switchMethodAndBody('GET', null)
    fetch(baseUrl + getActivityURL, initObject)
    .then(function(response) {

      if (response.status == 200){
        console.log(response)

        tableContent = build4RTableContent('a','b','c','d' )
        outputTable = build4RTableHeader('Case','Activity', 'Subject', 'From', tableContent)

        msg = 'item found in customer DB' + okSign + '<p>' + outputTable + '</p>'
        append2DIV('infopane',  msg)
        resolve('ok');
        return response.json();

  } else {
    append2DIV('infopane', '<STRONG>' + response.status + ': </STRONG>item not found' + errorSign)
    egLogout()
  }
})})}
