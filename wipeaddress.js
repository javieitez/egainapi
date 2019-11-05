console.clear();

const editCustomerUrl = baseUrl + '/system/ws/v12/interaction/customer' //PUT
const searchCustomerUrl = baseUrl + '/system/ws/v12/interaction/customer?email=' //GET
var cpArray = []

function emailIsValid(string){
  return /\S+@\S+\.\S+/.test(string)
}

function clearResults(){
  writeDIV('outputTable', '' );
  writeDIV('wipeButton', '');
  writeDIV('wipeLog', '')
}

function SearchEmailAddress(){
  let customerEmail = document.getElementById("emailform").value;

  if (emailIsValid(customerEmail) == true) {
    cpArray = []
    let firstTrigger = egLogin()
    firstTrigger
    .then(() => fetchRemoteSearch(customerEmail))
    .then(() => egLogout())
} else {
  writeDIV('SearchLog',  'Please enter a valid email address ' + forbiddenSign)
  clearResults()
}
}

function fetchRemoteSearch(string) {
	return new Promise(function(resolve, reject) {
    switchMethodAndBody('GET', null)
    console.log('searching for ' + string);
    let remoteSearch = searchCustomerUrl + string + '&$attribute=all'
    fetch(remoteSearch, initObject)
    .then(function(response) {
      let msg = ''
      if (response.status == 200){
      msg = string + ' found in customer DB' + okSign
      writeDIV('SearchLog',  msg)

    return response.json();

    }else {
      msg = 'No results matching ' + string + ' ' + errorSign + '<p>Please make sure to enter the complete email address. Partial searches are not supported.</p>'
      writeDIV('SearchLog',  msg);
      clearResults();
      resolve('nothing found');
    }


    })
    .then(function(data) {
      console.log(data);
      customerId = data.customer[0].id
      contactPointId = data.customer[0].contactPersons.contactPerson[0].id
      itemsFound = data.customer[0].contactPersons.contactPerson[0].contactPoints.contactPoint.length;
      append2DIV('SearchLog', itemsFound + ' contact '+ PluralizePoint(itemsFound) + ' found for this customer')
      tableContent = ''
      for (i of data.customer){

        //populate the table with content
        cName = i.customerName;
        //cemail = i.contactPersons.contactPerson[0].contactPoints.contactPoint[0].type.email.emailAddress;
        clastmod = i.lastModified.date;
          for (x of i.contactPersons.contactPerson[0].contactPoints.contactPoint){

            console.log(x);

            cid = x.id;
            cemail = x.type.email.emailAddress;
            tableContent += build4RTableContent(cName, cid, createCheckBox(cid) + cemail, clastmod);
          }
      }
      //then build the headers, append the previous information and create the table
      fullTable = build4RTableHeader('Customer Name', 'contact point ID', 'email', 'Last Modified', tableContent)

      writeDIV('outputTable', fullTable)
      writeDIV('wipeButton', '<button onclick="wipeContacts(cpArray)">Wipe!!</button>')
      resolve('ok');
    })
	})
  }

//just return singular or plural depending on amount
function PluralizePoint(n){
	if (n == 1) {return 'point '} else {return 'points '}}

// create the checkbox for later selection
function createCheckBox(boxId){
  return '<input type="checkbox" id="' + boxId + '" onclick="updateArray(' + boxId + ', window.cpArray)">'
}

//add the selected items to an array, remove if unselected
function updateArray(a, array){
  var checkBox = document.getElementById(a);
  if (checkBox.checked == true){ //action for checkbox selected
    if (array.includes(a)){ //check if the number already exists
      //console.log(a + ' already selected');
      //console.log(cpArray);
    } else {
      array.push(a)
      //console.log(a + ' selected');
      //console.log(cpArray);
    }
  } else { //action for checkbox UNselected
    if (array.includes(a)){
    //console.log(a + ' unselected');
    cpArray = array.filter(function(value){return value != a});
      //console.log(cpArray);
    } else {
      console.log(a + ' was not selected');} // not gonna happen
  }
}

function wipeContacts(z){
  if (z.length == 0){
  writeDIV('wipeLog', 'Nothing selected ' + forbiddenSign)
  } else {
    console.clear()
  writeDIV('wipeLog', 'preparing to wipe ' + z + '...')
  let secondTrigger = egLogin()
  cpCounter = 0
  secondTrigger
  .then(() => cpArray.forEach(fetchEditCustomer))
  //.then(() => egLogout())
}}

function fetchEditCustomer(y){
  return new Promise(function(resolve, reject) {
    var wipePattern = 'zzzzzzzzzzzzz' + y + '@zzzz.zzz'
    var tempVar = '{"id": "' + customerId + '", "contactPersons": {"contactPerson": [ {"id": "' + contactPointId + '", "contactPoints": { "contactPoint": [{"id": "'+ y.toString() +'", "type": {"email": {"emailAddress": "'+ wipePattern +'" }} }] }} ]}}'
    console.log(wipePattern);
    switchMethodAndBody('PUT', tempVar)
    fetch(editCustomerUrl, initObject)
    .then(function(response) {
        if (response.ok){
          cpCounter += 1
          console.log('Processing item ' + cpCounter + ' of ' + cpArray.length);
          append2DIV('wipeLog', y + ' has been wiped' + okSign)
          if (cpCounter === cpArray.length) {
            resolve('all items processed');
            hideAndLogout();
          }
        } else {
          append2DIV('wipeLog', '<strong><font color=red>' + response.status + ':</strong></font> '+ response.statusText + errorSign)
          if (cpCounter == cpArray.length) {
            resolve('resolved with errors');
            hideAndLogout();
            }
        }
      })
  })
}

function hideAndLogout(){
  //resolve(message);
  egLogout();
  writeDIV('wipeButton', '')
}
