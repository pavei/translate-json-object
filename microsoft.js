var MsTranslator = require('mstranslator');
// Second parameter to constructor (true) indicates that
// the token should be auto-generated.

var client = new MsTranslator({
	api_key: "5edf1ba23d754614b76c95001d1d4aeb"
}, true);

var params = {
	text: 'How\'s it going?'
	, from: 'en'
	, to: 'es'
};

// Don't worry about access token, it will be auto-generated if needed.
client.translate(params, function(err, data) {
	console.log(data);
});
