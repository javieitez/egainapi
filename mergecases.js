console.clear();
let apiCaseCall = "/system/ws/v12/interaction/case/";
let getCaseUrl = baseUrl + apiCaseCall + srcCaseID;

/*make sure the entered case ID is a valid one*/
function validateCaseID(n){
	if (isNaN(n) || n < 1111111 || n > 9999999) {
	return false;
}	else {
	return true;	}}


/* build the request headers
Example: buildHeaders('POST', '', brandNewHeaders) */
function buildHeaders(method, body, headers){
	initObject = {
		method: method,
		mode: 'cors', // MUST BE cors
		body : body,
		headers: headers,};}

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
						} else {
							reject('not logged in')
;}})})}
/*lOGOUT*/
function egLogout() {
			initObject.method = 'DELETE';
			fetch(logoutUrl, initObject);
				}

function switchMethodAndBody(x, y){
	initObject.method = x
	initObject.body = y
}

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
	if (window.srcCaseProperties.id === window.bufferCase.id) {
		writeDIV('actionsLog', 'both cases are the same: ' + window.bufferCase.id);
		writeDIV('mergeCaseButton', '')

	} else {
		thirdTrigger = egLogin()
		thirdTrigger
		.then(() => getSourceActivityIDs()
			.catch(() => console.log('No shit'))
		)
		//movea ctivities must go first, in order to reopen the case if it was closed

		//then change the customer
		.then(() => changeCaseCustomer())
		.then(() => moveActivitiesAndLogout())
		//.then(() => egLogout())

	}}

function storeFirstCase(){
	window.srcCaseProperties = window.bufferCase;
	}

/* get the valid activity IDs of source case*/
function getSourceActivityIDs () {
	return new Promise(function(resolve, reject) {
	let listActivitiesURL = baseUrl + window.srcCaseProperties.activities.link.href;
	switchMethodAndBody('GET', null)
	fetch(listActivitiesURL, initObject)
	.then(function(response){
		return response.json();})
	.then(function(data){
		//restart the array, then populate it with the activities
		window.srcCaseActivityIDs =[]
		for (i =0; i < Object.keys(data.activity).length; i++){
			//but ONLY with activities with a valid status
			if (validActivityStatus(data.activity[i].status.value) == true) {
				// for those that qualify:
				append2DIV('actionsLog',data.activity[i].id + ' is in a valid status');
				window.srcCaseActivityIDs.push(data.activity[i].id);
				//if customer differs, change it
				if (data.activity[i].customer.id != window.srcCaseProperties.customer.id) {
          fetchAndChangeActivityCustomer(data.activity[i].id, window.srcCaseProperties.customer.id)
				}} else {
				append2DIV('actionsLog', data.activity[i].id + ' is ' + data.activity[i].status.value);
			}}
			//exit if no valid activities left
			if (window.srcCaseActivityIDs.toString() == '') {
				append2DIV('actionsLog', 'Nothing can be moved from the source to the destination case');
				reject('no valid activity IDs');

			} else {
				append2DIV('actionsLog', window.srcCaseActivityIDs.toString() + ' will be moved');
				resolve('activity IDs changed: ' + window.srcCaseActivityIDs.toString())
			}

			})})
//			return promise;
}

function fetchAndChangeActivityCustomer(activity, customer) {
//must fetch the contact point ID first
var tempURL = baseUrl + window.bufferCase.customer.link.href
switchMethodAndBody('GET', null)
fetch(tempURL, initObject)
	.then(function(response){
		return response.json();})
	.then(function(data){
		contactPointID = data.customer[0].contactPersons.contactPerson[0].contactPoints.contactPoint[0].id
		return(window.contactPointID);})
	.then(function(w){
		changeActivityCustomer(activity, w)
	})}

// Move the activities to the destination case
function moveActivitiesAndLogout() {
	return new Promise(function(resolve, reject) {
		let moveactivityURL = baseUrl + '/system/ws/v12/interaction/activity/' + window.srcCaseActivityIDs.toString().replace(/[,]/g, '%2C') + '/changecase?relateCase=yes'
		switchMethodAndBody('PUT', '{"id": ' + window.bufferCase.id + ' }')
		fetch(moveactivityURL, initObject)
		.then(function(response){
			if (response.ok) {
				append2DIV('actionsLog', "<strong>&#10004;</strong> Activity " + window.srcCaseActivityIDs.toString() + " moved from source case "+
				window.srcCaseProperties.id +" to destination case " + window.bufferCase.id);
				egLogout()
			} else {
				append2DIV('actionsLog', response.status + ' ' + response.statusText + ' - something unexpected happened')
				egLogout()
			}})
		})}

function changeActivityCustomer(activityID, customerID){
	append2DIV('actionsLog', 'Activity ID: ' + activityID + ', customer ' + customerID + ' must be changed' )
	switchMethodAndBody('PUT', '{"activity": [{"id":"' + activityID + '","customer": {"contactPersons": {"contactPerson": [{"contactPoints": {"contactPoint":[{"id": "' + customerID +  '"}]}}]}}}]}')
	var tempURL = baseUrl + '/system/ws/v12/interaction/activity/changecustomer'
	fetch(tempURL, initObject)
	}

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
				}})
	//return promise;
	}




//Invoke the first actions to run on page load
let firstLoginOnPageLoad = egLogin()

firstLoginOnPageLoad
	.then(() => buildTableAndLogout('firstTable'))
	.then(() => storeFirstCase())
