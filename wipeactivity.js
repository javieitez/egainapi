const wipeActivityURL = '/ws/v19/interaction/activity/mask'



//check for a valid input and confirm
function validateInput(w){
if (isNaN(w) || w == '') {
	writeDIV('infopane', 'Please provide a valid activity ID')
} else {
	writeDIV('infopane', 'Activity ' + w + ' will be completely wiped')}}
