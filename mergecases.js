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

/* fetch the case data and put it on a table*/
function buildTableAndLogout(y) {
	initObject.method = 'GET'
	initObject.body = undefined
	fetch(getCaseUrl, initObject)
		.then(function(response){
				return response.json()})
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
			writeDIV(y, myTable);
			//move the buffered object from the previous step to a fixed place
			window.srcCaseProperties = window.bufferCase;		})
			.then(() => {egLogout()})
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


//Ready, steady, GO!!!
egLogin()
	.then(() => buildTableAndLogout('firstTable'))
