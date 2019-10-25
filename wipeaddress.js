console.clear();

const editCustomerUrl = baseUrl + '/system/ws/v15/context/interaction/customer' //PUT
const searchCustomerUrl = baseUrl + '/system/ws/v12/interaction/customer?email=' //GET

function SearchEmailAddress(){
  let customerEmail = document.getElementById("emailform").value;
  let firstTrigger = egLogin()
  firstTrigger
  .then(() => fetchRemoteSearch(customerEmail))
  .then(() => egLogout())

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
    }
    return response.json();
    })
    .then(function(data) {
      console.log(data);
      resolve('ok');
    })
	})
  }
