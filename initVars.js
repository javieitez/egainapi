// credentials hardcoded for testing, will be replaced by session ID
const myCredentials = '{ "userName": "my_user_name" , "password": "my_password"}';


//common to all apps
const domainUrl = 'my.egain.url'; 
const protocolUrl = 'https://';
const baseUrl = protocolUrl + domainUrl + '/system';

const loginUrl = baseUrl +'/ws/v12/authentication/user/login';
const logoutUrl = baseUrl + '/ws/v12/authentication/user/logout';

const brandNewHeaders = new Headers({'accept': 'application/json',
			'Accept-Language': 'en-US',
			 'content-type': 'application/json'})

//expand some nice colored HTML signs
const okSign = '<font color="green"><strong> &#10004;</strong></font>'
const errorSign = '<font color="red"><strong> &#10007;</strong></font>'
const forbiddenSign = '<font color="green"><strong>&#9940;</strong></font>'
const warningSign = '<font color="red"><strong>&#9888;</strong></font>'

//specific for the wipeaddress app

//specific for the mergeCases App
// Case ID taken from URL Line
const srcCaseID = getQuery("srcCaseID");   // Example '2699230'

//Functions common to all apps

/* **************************************************
Build a 4 rows table with the paramaters supplied
*****************************************************
First generate the table content with build4RTableContent
Then pass the output to build4RTableHeader
*/
function build4RTableHeader(h1, h2, h3, h4, content){
  myTable = '<TABLE><TR><TH>' + h1 + '</TH><TH>'  + h2 + '</TH><TH>' +
             h3 + '</TH><TH>'  + h4 + '</TH></TR>' + content + '</TABLE>';
  return myTable
}

function build4RTableContent(field1, field2, field3,field4){
   tableContent = '<TR><TD>' + field1 +
                 '</TD><TD>' + field2 +
                 '</TD><TD>' + field3 +
                 '</TD><TD>' + field4 + '</TD></TR>';
   return tableContent
}


//listen for enter keypress on specific field and button
function enterButton(fieldID, buttonID) {
	var input = document.getElementById(fieldID);
	input.addEventListener("keyup", function(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			document.getElementById(buttonID).click();
		}})
	}


//extract the params from URL
function getQuery(name){
	if(name=(new RegExp('[?&;]'+encodeURIComponent(name)+'=([^&;]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
	}

/* replacing the content of a DIV */
function writeDIV(element, message) {
	document.getElementById(element).innerHTML = message + '<BR>'}

/* appending to a DIV */
function append2DIV(element, message) {
	let w = document.getElementById(element);
	w.innerHTML += message + '<BR>'}

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
	initObject.body = y }

/* LOGIN and GET SESSION ID */
function egLogin(){
	return new Promise(function(resolve, reject){
		buildHeaders('POST', myCredentials, brandNewHeaders);
		fetch(loginUrl, initObject)
		.then(function (response) {
			if (response.ok) {
				myToken = response.headers.get('X-egain-session');
				initObject.headers.set('X-egain-session', myToken);
				console.log('Step 1: logged in, session ID: ' + myToken);
				resolve('logged in, session id: ' + myToken);
			} else {
				reject('not logged in');
			}
		})
	})
}

/*lOGOUT*/
function egLogout() {
	return new Promise(function(resolve, reject){
		initObject.method = 'DELETE';
		fetch(logoutUrl, initObject)
		.then(function (response) {
			if (response.ok) {
				myToken = ''
				console.log('Final Step: logout. Session ID Cleared' + myToken);
						resolve('OK, logged out');
			}})})}
