console.clear();
let apiCaseCall = "/system/ws/v12/interaction/case/";
let getCaseUrl = baseUrl + apiCaseCall + srcCaseID;
var srcCaseActivityIDs = []

/*make sure the entered case ID is a valid one*/
function validateCaseID(n){
	if (isNaN(n) || n < 1111111 || n > 9999999) {
	return false;
}	else {
	return true;	}}


/* build the request headers
Example: buildHeaders('POST', null, JSON object to string) */
function buildHeaders(method, body, headers){
	initObject = {
		method: method,
		mode: 'cors', // MUST BE cors
		body : body,
		headers: headers,};}

//modify the headers on the fly
function switchMethodAndBody(x, y){
			initObject.method = x
			initObject.body = y
		}



/* LOGIN and GET SESSION ID */
function egLogin(){
	return new Promise(function(resolve, reject){
		buildHeaders('POST', myCredentials, brandNewHeaders);
		fetch(loginUrl, initObject)
			.then(function (response) {
						if (response.ok) {
							myToken = response.headers.get('X-egain-session');
							initObject.headers.set('X-egain-session', myToken);
							console.log('logged in, session ID: ' + myToken);
							resolve('logged in, session id: ' + myToken);
							console.log('step 1: login');
						} else {
							reject('not logged in')
;}})})}
/*lOGOUT*/
function egLogout() {
			initObject.method = 'DELETE';
			fetch(logoutUrl, initObject);
			console.log('Final Step: logout');
				}


function storeFirstCase(){
	window.srcCaseProperties = window.bufferCase;}

function validActivityStatus(z){
if (z == 'awaiting_assignment' || z == 'assigned') {
  return true;
} else {
  return false;
}};

/* fetch the case data and put it on a table*/
function buildTableAndLogout(y) {
	switchMethodAndBody('GET', null)
	fetch(getCaseUrl, initObject)
		.then(function(response){
				return response.json();})
		.then(function(data){
	  	window.bufferCase = data.case[0];
			// prevent unassigned case from crashing the function
			let caseOwner = '';
					if (typeof window.bufferCase.owner.user === 'undefined') {
								caseOwner = 'unassigned'} else {
								caseOwner = window.bufferCase.owner.user.name }
			// convert source Case data to HTML TABLE
			myTable = '<TABLE><TR><TH>Case ID & status</TH><TH>Customer</TH><TH>Owner</TH><TH>Subject</TH><TH>Due Date</TH></TR>';
			myTable +=
					'<TR><TD>' + window.bufferCase.id + '<BR> (' + window.bufferCase.status.value + ')'+
					'</TD><TD>' + window.bufferCase.customer.customerName + '<br>(ID: ' + window.bufferCase.customer.id +')'+
					'</TD><TD>' + caseOwner +
					'</TD><TD>' + window.bufferCase.subject +
					'</TD><TD>' + window.bufferCase.dueDate + '</TD></TR></TABLE>';
			//put the table in place
			writeDIV(y, myTable)
			//store the source case properties only if first run
			if (y == 'firstTable'){
				storeFirstCase()}
			;})
			.then(() => egLogout())
			.catch(function(err){
			 	console.log("Something went wrong!", err);
				egLogout()
			})
	}

/*function for the Submit button*/
function processDestCaseID() {
	//reset the DIVs
	writeDIV('mergeCaseButton', '')
	writeDIV('actionsLog', '')
	let destCaseID = document.getElementById("destCaseID").value;
	//validate the user's input
	if (validateCaseID(destCaseID) == true){
		console.log('Case ID is valid');
		getCaseUrl = baseUrl + apiCaseCall + destCaseID;
		egLogin()
			.then(() => buildTableAndLogout('secondTable'))
			.then(() => writeDIV('mergeCaseButton', '<button onclick="mergeCases()">Merge Cases</button>'))
	}else {
		writeDIV("secondTable", "Please enter a 7 digit number");
	}
}



/*function for the mergeCases button*/
function mergeCases(){
	console.clear()
	writeDIV('mergeCaseButton', '')
	if (window.srcCaseProperties.id === window.bufferCase.id) {
		writeDIV('actionsLog', 'both cases are the same: ' + window.bufferCase.id);
		writeDIV('mergeCaseButton', '')

	} else {
		let thirdTrigger = egLogin()
		thirdTrigger
		.then(() => changeCaseCustomer())
		.then(() => getSourceActivityIDs()
			.catch(() => console.log('No shit'))
		)

		.then(() => moveActivities())

		.then(() => egLogout())
	}}

	/* get the valid activity IDs of source case*/
	function getSourceActivityIDs () {
		return new Promise(function(resolve, reject) {
		let listActivitiesURL = baseUrl + window.srcCaseProperties.activities.link.href;
		console.log('Step 3: getSourceActivityIDs')
		switchMethodAndBody('GET', null)
		fetch(listActivitiesURL, initObject)
		.then(function(response){
			return response.json();})
		.then(function(data){

			//check for activities with mismatched customers
			for (x of data.activity){
				//if customer differs, change it
			if (x.customer.id != window.srcCaseProperties.customer.id){
				console.log('Step 3.1: ' + window.bufferCase.customer.link.href);
				//must fetch the contact point ID first
				var getCstmrUrl = baseUrl + window.bufferCase.customer.link.href
				switchMethodAndBody('GET', null)
				fetch(getCstmrUrl, initObject)
				.then(function(response){
						return response.json();})
				.then(function(data){
					contactPointID = data.customer[0].contactPersons.contactPerson[0].contactPoints.contactPoint[0].id
					console.log(contactPointID);
					//now proceed to change it
					switchMethodAndBody('PUT', '{"activity": [{"id":"' + x.id + '","customer": {"contactPersons": {"contactPerson": [{"contactPoints": {"contactPoint":[{"id": "' + contactPointID +  '"}]}}]}}}]}')
					var chgCsUrl = baseUrl + '/system/ws/v12/interaction/activity/changecustomer'
					return chgCsUrl})
					.then(function(chgCsUrl){
						fetch(chgCsUrl, initObject)
						console.log('Activity ' + x.id + ', customer ' + x.customer.id + '. Must be changed to ' + window.srcCaseProperties.customer.id);
					})}
				}return data
			})
			.then(function(data){
			//restart the array, then populate it with the activities
			window.srcCaseActivityIDs =[]
			for (i of data.activity){
				//but ONLY with activities with a valid status
				if (validActivityStatus(i.status.value) == true) {
					// for those that qualify:
					append2DIV('actionsLog',i.id + ' is <I>' + i.status.value + '</I> <strong>&#10004;</strong>');
					window.srcCaseActivityIDs.push(i.id);
					} else {
					append2DIV('actionsLog', i.id + ' is <I>' + i.status.value + '</I> <strong>&#10008;</strong>');
				}}
				//exit if no valid activities left
				if (window.srcCaseActivityIDs.toString() == '') {
					append2DIV('actionsLog', 'Nothing can be moved from the source to the destination case');
					reject('no valid activity IDs');

				} else {
					append2DIV('actionsLog', window.srcCaseActivityIDs.toString() + ' will be moved');
					resolve('activity IDs changed: ' + window.srcCaseActivityIDs.toString())
					//console.log('Step 3: getSourceActivityIDs');
				}
	})})}

// Move the activities to the destination case
function moveActivities() {
	return new Promise(function(resolve, reject) {
		let moveactivityURL = baseUrl + '/system/ws/v12/interaction/activity/' + window.srcCaseActivityIDs.toString().replace(/[,]/g, '%2C') + '/changecase?relateCase=yes'
		switchMethodAndBody('PUT', '{"id": ' + window.bufferCase.id + ' }')
		fetch(moveactivityURL, initObject)
		.then(function(response){
			if (response.ok) {
				append2DIV('actionsLog', "<strong>&#10004;</strong> Activity " + window.srcCaseActivityIDs.toString() + " moved from source case "+
				window.srcCaseProperties.id +" to destination case " + window.bufferCase.id);
				resolve('ok')
			} else {
				append2DIV('actionsLog', response.status + ' ' + response.statusText + ' - something unexpected happened')
				egLogout()
			}})
			console.log('step 4: moveActivities');
		})}

function changeActivityCustomer(activityID, customerID){
	return new Promise(function(resolve, reject){
	switchMethodAndBody('PUT', '{"activity": [{"id":"' + activityID + '","customer": {"contactPersons": {"contactPerson": [{"contactPoints": {"contactPoint":[{"id": "' + customerID +  '"}]}}]}}}]}')
	var tempURL = baseUrl + '/system/ws/v12/interaction/activity/changecustomer'
	fetch(tempURL, initObject)
	.then(function(response) {
		if (!response.ok){
			//append2DIV('actionsLog', 'Activity ' + activityID + ' belongs to customer ' + customerID )
			//reject('customer unchanged');
			console.log('Problem on 3.1 changeActivityCustomer')
		} else {
			append2DIV('actionsLog', 'Customer for activity' + activityID + ' has been changed' )
			//resolve('customer changed');
			console.log('Step 3.1: changeActivityCustomer');
			}

		})})}

function changeCaseCustomer() {
	return new Promise(function(resolve, reject) {
	let chgCustomerURL = baseUrl + apiCaseCall + window.srcCaseProperties.id + '/changecustomer'
	switchMethodAndBody('PUT', '{ "customer": { "id": ' + window.bufferCase.customer.id + ' }}')
	if (window.srcCaseProperties.id != window.bufferCase.id && window.srcCaseProperties.customer.id == window.bufferCase.customer.id) {
		append2DIV('actionsLog', 'both cases already have the same customer: ' + window.bufferCase.customer.id);
		resolve('same customer')
	} else {
		fetch(chgCustomerURL, initObject)
		.then(function(response) {
			if (!response.ok){
				append2DIV('actionsLog', '<strong>' + response.status + ' - ' + response.statusText + '</strong>. Something went wrong');
				resolve('customer unchanged');
			} else {
				append2DIV('actionsLog', 'Customer for case ' + window.srcCaseProperties.id +' changed to ' + window.bufferCase.customer.id);
				resolve('customer changed');
				}})
				}
				resolve('no changes in customer association')
				console.log('Step 2: changeCaseCustomer');
			}
		)}




//Invoke the first actions to run on page load
let firstLoginOnPageLoad = egLogin()

firstLoginOnPageLoad
	.then(() => buildTableAndLogout('firstTable'))
	//.then(() => storeFirstCase())

window.document.title =  'Source Case ' + srcCaseID
