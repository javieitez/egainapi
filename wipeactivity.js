const wipeActivityURL = baseUrl + '/ws/v19/interaction/activity/mask' // PUT

//check for a valid input and confirm
function validateInput(w){
if (isNaN(w) || w == '') {
	writeDIV('infopane', 'Please provide a valid activity ID')
} else {
	writeDIV('infopane', 'searching for activity ' + w )
  getActivityData(w)
}}

function getActivityData(id){
  let actionTrigger = egLogin()
  actionTrigger
    .then(() => fetchAPIforData(id))
    .then(() => egLogout())
	}

function fetchAPIforData(n){
  return new Promise(function(resolve, reject) {
    switchMethodAndBody('GET', null)
    fetch(baseUrl + getActivityURL, initObject)
    .then(function(response) {
      if (response.status == 200){
				msg = 'Activity found in customer DB' + okSign
				writeDIV('infopane',  msg)
				return response.json();
  } else {
    append2DIV('infopane', '<STRONG>' + response.status + ': </STRONG>item not found' + errorSign)
    resolve('error');
  }})
	.then(function(data) {
		console.log(data);
		caseID = data.activity[0].case.id // put the required JSON values into vars
		activityID = data.activity[0].id
		subject = data.activity[0].subject
		creation = data.activity[0].created.date
		lastModified = data.activity[0].lastModified.date
		tableContent = build4RTableContent( caseID, activityID, subject, creation )
		outputTable = build4RTableHeader('Case','Activity', 'Subject', 'created on', tableContent)
		msg = '<p>' + outputTable + '</p>'
		append2DIV('infopane',  msg)
		// Only show the wipe button if the activity is an inbound email
			if (data.activity[0].mode.value == 'inbound' && data.activity[0].type.value == 'email' ){
				append2DIV('infopane', 'Activity ' + activityID + ' will be wiped. '
				+ warningSign + ' <STRONG> This action cannot be undone </STRONG>' + warningSign )
				writeDIV('workpane', '<button onclick="wipeactivity(activityID, lastModified)">Wipe!!</button>')
			}else{
				writeDIV('workpane', 'Not a valid activity. Only inbound emails are wipeable.')
			}
		resolve('ok');
})})}

function wipeactivity(n, date){
	var tempVar = '{"activity":[{"id": "' + n + '" ,"lastModified":{"date": "' + date + '"}}]}'
	switchMethodAndBody('PUT', tempVar)
	fetch(wipeActivityURL, initObject)
		.then(function(response) {
			if (response.ok){
				writeDIV('workpane', 'Activity ' + n + ' has been successfully wiped ' + okSign)
			} else {
				writeDIV('workpane', 'Something went wrong ' + errorSign)
			}

})}
