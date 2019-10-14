console.clear();
/*******  *******  *******  *******  *******  *******  *******
					 VARS, INITS and miscellaneous stuff
*******  *******  *******  *******  *******  *******  *******/

let srcCaseID = getQuery("srcCaseID");   // Example '2699230'

// credentials are hardcoded here for testing, will be replaced by session ID
let myCredentials = '{ "userName": "nhtestcti1" , "password": "nhtest1234"}';

//compose the miscellaneous URLs we'll need later
let apiCaseCall = "/system/ws/v12/interaction/case/";
let domainUrl = 'nhhotelsdev-de.egain.cloud'; //'bo-mail.nh-hotels.com'
let protocolUrl = 'https://';
let baseUrl = protocolUrl + domainUrl;
let loginUrl = baseUrl +'/system/ws/v12/authentication/user/login';
let logoutUrl = baseUrl + '/system/ws/v12/authentication/user/logout';
let getCaseUrl = baseUrl + apiCaseCall + srcCaseID;


//empty objects required later in the global scope
let myToken, destCaseIDMsg = '';
let initObject, srcCaseProperties, destCaseProperties, bufferCase, CurrentCase = {};
let srcCaseActivityIDs =[];
var destCIDisValid = false;

/* The Headers object is refreshed for every new request,
so declare a reusable function for it*/
function freshHeaders() {
initObject = { // then we fill it with the fetch headers and properties
method: 'POST',
mode: 'cors', // MUST BE cors
body : myCredentials,
headers: new Headers({'accept': 'application/json',
			'Accept-Language': 'en-US',
			 'content-type': 'application/json',
			})
	};
}

//extract the params from URL
function getQuery(name){
	if(name=(new RegExp('[?&;]'+encodeURIComponent(name)+'=([^&;]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
	}

/*******  *******  *******  *******  *******  *******  *******
		LOGIN AND LOGOUT functions
*******  *******  *******  *******  *******  *******  *******/
function logTheFuckOut() {
	initObject.method = 'DELETE';
	fetch(logoutUrl, initObject);
}

/* LOGIN and GET SESSION ID */
function initLoginParams(resolve, reject) {
	fetch(loginUrl, initObject)
		.then(function (response) {
					if (response.ok) {
						resolve('logged in');
						window.myToken = response.headers.get('X-egain-session');
						initObject.method = 'GET';
						initObject.body = null;
						initObject.headers.set('X-egain-session', window.myToken);
					} else {
						reject('not logged in');}
					});}

/* Reusable function for updating DIV elements */
function writeDIV(element, message) {
		document.getElementById(element).innerHTML = message}


/*******  *******  *******  *******  *******  *******  *******
						Other functions
*******  *******  *******  *******  *******  *******  *******/
/* Reusable function for changing the customer of source case*/
let changeCustomer = function() {
	let promise = new Promise(function(resolve, reject) {
		let chgCustomerURL = baseUrl + apiCaseCall + window.srcCaseProperties.id + '/changecustomer'
		initObject.method = 'PUT';
		initObject.body = '{ "customer": { "id": ' + window.bufferCase.customer.id + ' }}'
		if (window.srcCaseProperties.id != window.bufferCase.id && window.srcCaseProperties.customer.id == window.bufferCase.customer.id) {
			writeDIV('finalstep', 'both cases already have the same customer: ' + window.bufferCase.customer.id);
			resolve('same customer')
		} else {
			fetch(chgCustomerURL, initObject)
				.then(function(response) {
					if (!response.ok){
						writeDIV('finalstep', '<strong>' + response.status + ' - ' + response.statusText + '</strong>. Something went wrong');
						resolve('customer unchanged');
					} else {
						writeDIV('finalstep', 'Customer for case ' + window.srcCaseProperties.id +' changed to ' + window.bufferCase.customer.id );
						resolve('customer changed');
					}})
					}})
			return promise;
					}

/* Reusable function for getting activity IDs of source case*/
let getSourceActivityIDs = function() {
	let promise = new Promise(function(resolve, reject) {
	let listActivitiesURL = baseUrl + window.srcCaseProperties.activities.link.href;
	initObject.body = null;
	initObject.method = 'GET';
	fetch(listActivitiesURL, initObject)
		.then(function(response){
			return response.json()})
		.then(function(data){

			//restart the array, then populate it with the activities
			window.srcCaseActivityIDs =[]
			for (i =0; i < Object.keys(data.activity).length; i++){

					//console.log(data.activity[i]);

				//ONLY activities with a valid status are pushed into the array
				if (data.activity[i].status.value == 'awaiting_assignment' || data.activity[i].status.value == 'assigned') {

					console.log(data.activity[i].id + ' is in a valid status');
					window.srcCaseActivityIDs.push(data.activity[i].id)
				} else {
					console.log(data.activity[i].id + ' is ' + data.activity[i].status.value);
				}
				//exit if no valid activities left
				if (window.srcCaseActivityIDs.toString() == '') {
					logTheFuckOut()
					reject('no valid activity IDs')
				} else {
					resolve('again yep');
				}}
				console.log(window.srcCaseActivityIDs.toString() + " will be moved");
			})})
			return promise;
}

// Move the activities to the destination case
let moveActivities = function() {
	let promise = new Promise(function(resolve, reject) {
		let moveactivityURL = baseUrl + '/system/ws/v12/interaction/activity/' + window.srcCaseActivityIDs.toString().replace(/[,]/g, '%2C') +'/changecase?relateCase=yes'
		initObject.method = 'PUT';
		initObject.body = '{"id": ' + window.bufferCase.id + ' }';

		window.testthisshit = initObject.body;

		fetch(moveactivityURL, initObject)
			.then(function(response){
							console.log("Moving activity " + window.srcCaseActivityIDs[n] + " from case "+
							window.srcCaseProperties.id +" to case " + window.bufferCase.id);
						})
			.catch(() => console.log(initObject))
	resolve('ok');
	return promise;
})}


/* Reusable function for fetching the case data and put it on a table*/
function buildTableAndLogout(CurrentTable) {
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
						writeDIV(CurrentTable, myTable);
					})
		.then(() => {
		logTheFuckOut()
			})
			.catch(function(err){
					console.log("Something went wrong!", err);
					fetch(logoutUrl, initObject)
				})
}

/*******  *******  *******  *******  *******  *******  *******
			BUTTON (meta)FUNCTIONS
*******  *******  *******  *******(meta)  *******  *******  *******
			function for the Submit button
*******  *******  *******  *******  *******  *******  *******/
function processDestCaseID() {
		//reset the DIVs
		writeDIV('mergeCaseButton', '')
		writeDIV('finalstep', '')
		//move the buffered object from the previous step to a fixed place
		window.srcCaseProperties = window.bufferCase;
		// All set, let's go
		let destCaseID = document.getElementById("destCaseID").value;
		getCaseUrl = baseUrl + apiCaseCall + destCaseID;
			if (isNaN(destCaseID) || destCaseID < 1111111 || destCaseID > 9999999) {
				destCaseIDMsg = "Destination Case ID must be a 7 digit number";
				window.destCIDisValid = false;
			}	else {
					writeDIV("destCaseIDheader", 'Destination Case')
					destCaseIDMsg = 'Destination Case will be ' + destCaseID + '<BR> Fetching case details, please wait...';
					window.destCIDisValid = true;
				}
		writeDIV("secondTable", destCaseIDMsg);
		/* login for the second time,
		first reboot the headers object*/
		freshHeaders();
		/* then create a new promise for the login */
		let SecondUserLogin = new Promise(function(resolve, reject) {
			initLoginParams(resolve, reject)
						});

		SecondUserLogin
			.then(function(fromResolve){
					console.log('session ID: ' + window.myToken);
					//build the table again, this time place it on the second DIV

					if (window.destCIDisValid === false) {
						writeDIV('mergeCaseButton', '');
						logTheFuckOut()
					}else{
						writeDIV('mergeCaseButton', '<button onclick="mergeCases()">Merge Cases</button>')
						buildTableAndLogout('secondTable');
					}})}
/*******  *******  *******  *******  *******  *******  *******
	function for the mergeCases button
*******  *******  *******  *******  *******  *******  *******/
function mergeCases() {

		console.clear()

			// same case?
			if (window.srcCaseProperties.id == window.bufferCase.id) {
				writeDIV('finalstep', 'both cases are the same: ' + window.bufferCase.id);

				// same customer?
			}	else  {
						/* again, refresh headers and create a new promise for the login */
						freshHeaders()
						let ThirdUserLogin = new Promise(function(resolve, reject) {
								initLoginParams(resolve, reject)
							});

						//everything OK,  go
						ThirdUserLogin

							.then(() => getSourceActivityIDs())
							//moveactivities must go first, in order to reopen the case if it was closed
							.then(() => moveActivities())
							//then change the customer
							.then(() => changeCustomer())
							.then(() => logTheFuckOut())
					}}


/*******  *******  *******  *******  *******  *******  *******
		end of declaring functions, let's start doing things
*******  *******  *******  *******  *******  *******  *******/

freshHeaders()
/* login for the first time, using the init parameters*/
/*      MUST use a new promise for each login      */
let FirstUserLogin = new Promise(function(resolve, reject) {
		initLoginParams(resolve, reject)
});

FirstUserLogin
		.then(function(fromResolve){

				console.log('session ID: ' + window.myToken);
				buildTableAndLogout('firstTable')

								})
				// catch means "if error"
		.catch(function(fromReject){
		console.log('the user is ' + fromReject)
});
