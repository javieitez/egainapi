console.clear();
const apiCaseCall = '/ws/v12/interaction/case/';
let getCaseUrl = baseUrl + apiCaseCall + srcCaseID;
var srcCaseActivityIDs = []
var arrayCounter = 0
var mergeRetries = 0

/*make sure the entered case ID is a valid one*/
function validateCaseID(n){
	if (isNaN(n) || n < 1111111 || n > 9999999) {
	return false;
}	else {
	return true;	}}

function PluralizeActivity(n){
	if (n == 1) {return 'activity '}
	else {return 'activities '}
}

function capitalizeFirstLetter(string){
		return string.charAt(0).toUpperCase() + string.slice(1);
}

function storeFirstCase(){
	window.srcCaseProperties = window.bufferCase;
	console.log(window.srcCaseProperties.status.value);
	//Disable the submit button if the source case is closed
	if (window.srcCaseProperties.status.value == 'closed'){
		writeDIV('SubmitDestCaseID', 'Source Case must have at least one open activity. Please choose a different case ID and reload.')
	}

	}

function isInbound(t){
	if (t == 'outbound') {return false;} else {return true}
}

function isDraft(w){ if (w == 'outbound') {return 'Draft'} else {return w}}

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
				//console.log(data);
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
			 	writeDIV('actionsLog', 'Something went wrong! <br><I>' + err + '.</I> <br>(Is this a valid Case ID?)');
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

/* retry failed mergeCases if failed the first time*/
function retryMergeCases () {

		console.log('mergeRetries: ' + window.mergeRetries);
		egLogout()
		.then(() => window.setTimeout(mergeCases, 500)) /* Pause forced, this is
		                                                  ugly as hell, but the
																									   remote API needs it */
}

/*function for the mergeCases button*/
function mergeCases(){
	//console.clear()
	writeDIV('mergeCaseButton', '')
	if (window.srcCaseProperties.id === window.bufferCase.id) {
		writeDIV('actionsLog', 'both cases are the same: ' + window.bufferCase.id);
		writeDIV('mergeCaseButton', '')

	} else {
		let thirdTrigger = egLogin()
		thirdTrigger
		.then(() => changeCaseCustomer())
		.then(() => getSourceActivityIDs())
		.then(() => moveActivities())
		.then(() => egLogout())
	}}

	/* get the valid activity IDs of source case*/
	function getSourceActivityIDs () {
		return new Promise(function(resolve, reject) {
		let listActivitiesURL = baseUrl + window.srcCaseProperties.activities.link.href.replace('/system', '');
		console.log('Step 3: get Source Activity IDs')
		switchMethodAndBody('GET', null)
		fetch(listActivitiesURL, initObject)
		.then(function(response){
			return response.json();})
			.then(function(data){
				console.log(data);
			//restart the array, then populate it with the activities
			window.srcCaseActivityIDs =[]
			const mainCustomer = data.activity[0].customer.id
			const mainContactPoint = data.activity[0].customer.contactPersons.contactPerson[0].contactPoints.contactPoint[0].id
			for (i of data.activity){
			//but ONLY with activities with a valid status
				if (validActivityStatus(i.status.value) == true && isInbound(i.mode.value) == true ) {
					// for those that qualify:
					append2DIV('actionsLog',i.id + ' is <I>' + i.status.value + '-' + i.type.subtype.value + '</I>'  + okSign);
					window.srcCaseActivityIDs.push(i.id);
					//also, check if customer if valid (change if not)
						if (i.customer.id != mainCustomer) {
								changeActivityCustomer(i.id, mainContactPoint)
								console.log('Customer for activity' + i.id + ' is ' + i.customer.id + ', should be ' + mainCustomer);
							}
					} else {
					append2DIV('actionsLog', i.id + ' is <I>' + i.status.value + '-' + isDraft(i.mode.value) + '</I>' + errorSign);
				}}
				//exit if no valid activities left
				if (window.srcCaseActivityIDs.toString() == '') {
					append2DIV('actionsLog', 'Nothing can be moved from the source to the destination case');
					reject('no valid activity IDs');
					egLogout();
				} else {
					append2DIV('actionsLog', capitalizeFirstLetter(PluralizeActivity(window.srcCaseActivityIDs.length)) + window.srcCaseActivityIDs.toString() + ' will be moved');
					resolve('activity IDs changed: ' + window.srcCaseActivityIDs.toString())
				}
	})})}

// Move the activities to the destination case
function moveActivities() {
	return new Promise(function(resolve, reject) {
		let moveactivityURL = baseUrl + '/ws/v12/interaction/activity/' + window.srcCaseActivityIDs.toString().replace(/[,]/g, '%2C') + '/changecase?relateCase=yes'
		switchMethodAndBody('PUT', '{"id": ' + window.bufferCase.id + ' }')
		fetch(moveactivityURL, initObject)
		.then(function(response){
			if (response.ok) {
				append2DIV('actionsLog', '<strong>Done!</strong> ' + window.srcCaseActivityIDs.length + ' ' + PluralizeActivity(window.srcCaseActivityIDs.length) + "moved from source case "+
				window.srcCaseProperties.id +" to destination case " + window.bufferCase.id + okSign );
				resolve('ok')
			} else {

				// IF FAILED FOR SOME REASON, RETRY FROM SCRATCH

				if (window.mergeRetries < 3) {

					window.mergeRetries += 1

					append2DIV('actionsLog', '<font color="red">Something went wrong, retrying...</font>' + errorSign )
					retryMergeCases()

				}	else {
				append2DIV('actionsLog', '<font color="red"><strong>' + response.status + ' ' + response.statusText + '</strong></font> - something unexpected happened' + errorSign +
																	'<BR><strong>Reloading this page might fix the problem</strong>')
				console.log('Step 4 failed, logging out')
				egLogout()}

			}})
			console.log('Step 4: moveActivities');
		})}

function changeActivityCustomer(activityID, customerID){

	//do NOT return a new promise for this one
	switchMethodAndBody('PUT', '{"activity": [{"id":"' + activityID + '","customer": {"contactPersons": {"contactPerson": [{"contactPoints": {"contactPoint":[{"id": "' + customerID +  '"}]}}]}}}]}')
	var tempURL = baseUrl + '/ws/v12/interaction/activity/changecustomer'
	fetch(tempURL, initObject)
	.then(function(response) {
		if (!response.ok){
			console.log('Problem on 3.1 change Activity Customer')
		} else {
			append2DIV('actionsLog', 'Customer for activity ' + activityID + ' has been changed' + okSign )
			}

		})}


function changeCaseCustomer() {
	return new Promise(function(resolve, reject) {
	console.log('Step 2: changeCaseCustomer');
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
				append2DIV('actionsLog', 'Customer for case ' + window.srcCaseProperties.id +' changed to ' + window.bufferCase.customer.id + okSign);
				resolve('customer changed');
				}})
				}
				//resolve('no changes in customer association')
			}
		)}




//Invoke the first actions to run on page load
let firstLoginOnPageLoad = egLogin()

firstLoginOnPageLoad
	.then(() => buildTableAndLogout('firstTable'))
	//.then(() => storeFirstCase())

window.document.title =  'Source Case ' + srcCaseID
