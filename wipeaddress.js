console.clear();

const editCustomerUrl = baseUrl + '/system/ws/v15/context/interaction/customer' //PUT
const searchCustomerUrl = baseUrl + '/system/ws/v12/interaction/customer?email=' //GET
var cpArray = []

function emailIsValid(string){
  return /\S+@\S+\.\S+/.test(string)
}

function SearchEmailAddress(){
  let customerEmail = document.getElementById("emailform").value;

  if (emailIsValid(customerEmail) == true) {
    let firstTrigger = egLogin()
    firstTrigger
    .then(() => fetchRemoteSearch(customerEmail))
    .then(() => egLogout())
} else {
  writeDIV('SearchLog',  'Please enter a valid email address')
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
    }else {
      msg = 'no results matching ' + string + ' ' + errorSign
      writeDIV('SearchLog',  msg)
      resolve('nothing found')
    }

    return response.json();
    })
    .then(function(data) {
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

      resolve('ok');
    })
	})
  }





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

//just return singular or plural depending on amount
function PluralizePoint(n){
	if (n == 1) {return 'point '}
	else {return 'points '}
}

// create the checkbox for later selection
function createCheckBox(boxId){
  return '<input type="checkbox" id="' + boxId + '" onclick="updateArray(' + boxId + ', window.cpArray)">'
}

//add the selected items to an array, remove if unselected
function updateArray(a, array){
  var checkBox = document.getElementById(a);
  if (checkBox.checked == true){ //action for checkbox selected
    if (array.includes(a)){ //check if the number already exists
      console.log(a + ' already selected');
      console.log(cpArray);
    } else {
      array.push(a)
      console.log(a + ' selected');
      console.log(cpArray);
    }
  } else { //action for checkbox UNselected
    if (array.includes(a)){
    console.log(a + ' unselected');
    cpArray = array.filter(function(value){return value != a});
      console.log(cpArray);
    } else {
      console.log(a + ' was not selected');}


  }
}
