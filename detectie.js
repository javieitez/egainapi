// Detect Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var IEerrmsg = 'This app won\'t work on Internet Explorer. \r Please use Chrome or Firefox instead.'
if (isIE == true) {
	alert(IEerrmsg);}
